import {
  ApiErrorCode,
  ApiErrorResponse,
  GenerateRecipesRequest,
  GenerateRecipesResponse,
  RecipeLanguage,
  RecipePreferences,
} from '@/types/recipe';
import {
  AnalyzeFoodRequest,
  AnalyzeFoodResponse,
  CoachChatMessage,
  DietStyle,
  HealthGoal,
  MealType,
  UserHealthProfile,
  WeeklyHealthReport,
  WeeklyMealPlan,
} from '@/types/health';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000'
).replace(/\/+$/, '');

export class ApiClientError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ApiErrorCode;

  constructor(message: string, statusCode: number, errorCode: ApiErrorCode) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

interface GenerateOptions {
  preferences?: RecipePreferences | null;
  /** External signal so the caller can cancel an in-flight request. */
  signal?: AbortSignal;
  timeoutMs?: number;
}

export async function generateRecipesFromImage(
  base64Image: string,
  { preferences, signal, timeoutMs = 60000 }: GenerateOptions = {}
): Promise<GenerateRecipesResponse> {
  const payload: GenerateRecipesRequest = {
    image_base64: base64Image,
    preferences: preferences ?? null,
  };

  const endpoint = `${API_BASE_URL}/api/v1/generate-recipes`;
  console.log(`[SnapCook API] POST ${endpoint} (payload length: ${payload.image_base64.length})`);

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  let response: Response;
  const startTime = Date.now();
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    console.log(
      `[SnapCook API] Response status ${response.status} in ${Date.now() - startTime}ms`
    );
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));
    if (isAbort && !timedOut) {
      throw new ApiClientError('Analysis cancelled.', 0, 'CANCELLED');
    }
    if (isAbort) {
      throw new ApiClientError(
        'Request timed out waiting for AI to analyze ingredients. Please try again.',
        408,
        'NETWORK_ERROR'
      );
    }
    console.error(`[SnapCook API] Network request failed:`, err);
    throw new ApiClientError(
      `Network error: Unable to reach backend at ${API_BASE_URL}. Please check your connection and server status.`,
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const rawText = await response.text();

  if (!response.ok) {
    let errorDetail = `Server error (${response.status})`;
    let errorCode: ApiErrorCode = 'INTERNAL_ERROR';
    try {
      const errBody = JSON.parse(rawText) as Partial<ApiErrorResponse>;
      if (errBody?.detail) {
        errorDetail =
          typeof errBody.detail === 'string'
            ? errBody.detail
            : JSON.stringify(errBody.detail);
      }
      if (errBody?.error_code) {
        errorCode = errBody.error_code;
      }
    } catch {
      // Raw text was not JSON
      if (rawText) {
        errorDetail = rawText.slice(0, 200);
      }
    }
    throw new ApiClientError(errorDetail, response.status, errorCode);
  }

  let data: GenerateRecipesResponse;
  try {
    data = JSON.parse(rawText) as GenerateRecipesResponse;
  } catch (parseErr) {
    console.error('[SnapCook API] Failed to parse JSON response:', rawText, parseErr);
    throw new ApiClientError(
      'Server returned invalid JSON response.',
      response.status,
      'INVALID_AI_JSON'
    );
  }

  if (!Array.isArray(data?.recipes) || data.recipes.length === 0) {
    throw new ApiClientError(
      'No recipes were returned. Please try another photo.',
      response.status,
      'NO_INGREDIENTS_FOUND'
    );
  }

  console.log(`[SnapCook API] Parsed ${data.recipes.length} recipes successfully.`);
  return data;
}

export interface BackendHealth {
  online: boolean;
  geminiConfigured?: boolean;
  supabaseConfigured?: boolean;
  latencyMs?: number;
}

/** Pings the backend `/health` endpoint (used on the Settings screen). */
export async function checkBackendHealth(timeoutMs = 8000): Promise<BackendHealth> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    if (!res.ok) return { online: false };
    const body = await res.json();
    return {
      online: true,
      geminiConfigured: Boolean(body?.gemini_configured),
      supabaseConfigured: Boolean(body?.supabase_configured),
      latencyMs: Date.now() - start,
    };
  } catch {
    return { online: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

export interface AnalyzeFoodOptions {
  language?: RecipeLanguage;
  mealType?: MealType;
  dietaryGoal?: HealthGoal;
  userId?: string | null;
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * Phase 1: AI Food Lens - Analyze a photo of a prepared meal/dish for calories & macronutrients.
 */
export async function analyzeFoodFromImage(
  base64Image: string,
  {
    language = 'vi',
    mealType = 'lunch',
    dietaryGoal = 'lose_weight',
    userId = null,
    signal,
    timeoutMs = 60000,
  }: AnalyzeFoodOptions = {}
): Promise<AnalyzeFoodResponse> {
  const payload: AnalyzeFoodRequest = {
    image_base64: base64Image,
    language,
    meal_type: mealType,
    dietary_goal: dietaryGoal,
    user_id: userId,
  };

  const endpoint = `${API_BASE_URL}/api/v1/analyze-food`;
  console.log(`[SnapCook API] POST ${endpoint} (Food Lens, meal=${mealType})`);

  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));
    if (isAbort && !timedOut) {
      throw new ApiClientError('Food analysis cancelled.', 0, 'CANCELLED');
    }
    if (isAbort) {
      throw new ApiClientError(
        'Request timed out waiting for AI Food Lens. Please try again.',
        408,
        'NETWORK_ERROR'
      );
    }
    throw new ApiClientError(
      `Network error: Unable to reach backend at ${API_BASE_URL}.`,
      0,
      'NETWORK_ERROR'
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const rawText = await response.text();
  if (!response.ok) {
    let errorDetail = `Server error (${response.status})`;
    let errorCode: ApiErrorCode = 'INTERNAL_ERROR';
    try {
      const errBody = JSON.parse(rawText) as Partial<ApiErrorResponse>;
      if (errBody?.detail) {
        errorDetail =
          typeof errBody.detail === 'string'
            ? errBody.detail
            : JSON.stringify(errBody.detail);
      }
      if (errBody?.error_code) {
        errorCode = errBody.error_code;
      }
    } catch {
      if (rawText) errorDetail = rawText.slice(0, 200);
    }
    throw new ApiClientError(errorDetail, response.status, errorCode);
  }

  let data: AnalyzeFoodResponse;
  try {
    data = JSON.parse(rawText) as AnalyzeFoodResponse;
  } catch {
    throw new ApiClientError(
      'Server returned invalid JSON for food analysis.',
      response.status,
      'INVALID_AI_JSON'
    );
  }

  if (!data?.analysis?.food_name) {
    throw new ApiClientError(
      'Could not identify the dish in this photo. Please try a clearer angle.',
      response.status,
      'NO_INGREDIENTS_FOUND'
    );
  }

  return data;
}

/**
 * Phase 3: AI Meal Plan API caller
 */
export async function fetchWeeklyMealPlanRemote(
  dietStyle: DietStyle,
  dailyCalorieTarget: number,
  language: RecipeLanguage = 'vi',
  allergies: string[] = []
): Promise<WeeklyMealPlan> {
  const endpoint = `${API_BASE_URL}/api/v1/meal-plan/generate`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diet_style: dietStyle,
        daily_calorie_target: dailyCalorieTarget,
        language,
        allergies,
      }),
    });
    if (!res.ok) {
      throw new Error(`Meal plan generator returned status ${res.status}`);
    }
    const data = await res.json();
    return {
      id: `wp_${Date.now()}`,
      createdAt: Date.now(),
      diet_style: data.diet_style || dietStyle,
      daily_calorie_target: data.daily_calorie_target || dailyCalorieTarget,
      days: data.days || [],
      grocery_list: data.grocery_list || [],
    };
  } catch (err) {
    console.warn('[SnapCook API] Meal plan fetch error, fallback to local generator:', err);
    throw err;
  }
}

/**
 * Phase 4: Chat with AI Nutritionist Coach
 */
export async function sendCoachMessageRemote(
  messages: CoachChatMessage[],
  profile: UserHealthProfile,
  todaySummary: Record<string, any>,
  language: RecipeLanguage = 'vi'
): Promise<string> {
  const endpoint = `${API_BASE_URL}/api/v1/coach/chat`;
  const formatted = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    content: m.content,
  }));

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: formatted,
        user_profile: {
          gender: profile.gender,
          age: profile.age,
          height_cm: profile.height_cm,
          current_weight_kg: profile.current_weight_kg,
          target_weight_kg: profile.target_weight_kg,
          activity_level: profile.activity_level,
          main_goal: profile.main_goal,
          diet_style: profile.diet_style,
        },
        today_summary: todaySummary,
        language,
      }),
    });
    if (!res.ok) throw new Error(`Coach API returned ${res.status}`);
    const data = await res.json();
    return data.reply || '';
  } catch (err) {
    console.warn('[SnapCook API] Coach chat error, using local fallback:', err);
    throw err;
  }
}

/**
 * Phase 4: Generate Weekly Health Report
 */
export async function generateWeeklyReportRemote(
  profile: UserHealthProfile,
  daysData: Array<Record<string, any>>,
  language: RecipeLanguage = 'vi'
): Promise<WeeklyHealthReport> {
  const endpoint = `${API_BASE_URL}/api/v1/coach/weekly-report`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_profile: {
          gender: profile.gender,
          age: profile.age,
          height_cm: profile.height_cm,
          current_weight_kg: profile.current_weight_kg,
          target_weight_kg: profile.target_weight_kg,
          activity_level: profile.activity_level,
          main_goal: profile.main_goal,
          diet_style: profile.diet_style,
        },
        days_data: daysData,
        language,
      }),
    });
    if (!res.ok) throw new Error(`Weekly report API returned ${res.status}`);
    const data = await res.json();
    return {
      id: `rep_${Date.now()}`,
      generatedAt: Date.now(),
      summary_text: data.summary_text,
      total_deficit_surplus_kcal: data.total_deficit_surplus_kcal,
      est_fat_change_kg: data.est_fat_change_kg,
      avg_daily_calories: data.avg_daily_calories,
      avg_protein_g: data.avg_protein_g,
      adherence_score: data.adherence_score,
      recommendations: data.recommendations || [],
      safety_alerts: data.safety_alerts || [],
    };
  } catch (err) {
    console.warn('[SnapCook API] Weekly report API error, using local computation:', err);
    throw err;
  }
}
