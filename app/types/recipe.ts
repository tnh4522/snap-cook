export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface RecipeItem {
  name: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  /** Optional metadata (older backend deployments may omit these). */
  cooking_time_minutes?: number | null;
  difficulty?: RecipeDifficulty | null;
  servings?: number | null;
}

export type DietOption =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'low_carb'
  | 'high_protein'
  | 'keto'
  | 'halal';

export type RecipeLanguage = 'en' | 'vi';

export interface RecipePreferences {
  diet: DietOption[];
  language: RecipeLanguage;
  servings: number;
}

export interface GenerateRecipesRequest {
  image_base64: string;
  user_id?: string | null;
  image_url?: string | null;
  preferences?: RecipePreferences | null;
}

export interface GenerateRecipesResponse {
  recipes: RecipeItem[];
  detected_ingredients?: string[];
  record_id?: string | null;
}

/** A single scan (photo -> recipes) persisted locally in history. */
export interface ScanSession {
  id: string;
  createdAt: number;
  imageUri: string | null;
  recipes: RecipeItem[];
  detectedIngredients: string[];
}

/** A recipe the user bookmarked. */
export interface FavoriteRecipe {
  key: string;
  savedAt: number;
  recipe: RecipeItem;
  imageUri?: string | null;
}

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_IMAGE'
  | 'IMAGE_TOO_LARGE'
  | 'NO_INGREDIENTS_FOUND'
  | 'INVALID_AI_JSON'
  | 'INVALID_AI_SCHEMA'
  | 'AI_UPSTREAM_ERROR'
  | 'MISSING_API_KEY'
  | 'NETWORK_ERROR'
  | 'CANCELLED'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  detail: string;
  error_code: ApiErrorCode;
}
