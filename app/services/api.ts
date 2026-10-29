import {
  ApiErrorCode,
  ApiErrorResponse,
  GenerateRecipesRequest,
  GenerateRecipesResponse,
  RecipePreferences,
} from '@/types/recipe';

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
