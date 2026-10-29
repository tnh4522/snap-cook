export interface RecipeItem {
  name: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
}

export interface GenerateRecipesRequest {
  image_base64: string;
  user_id?: string | null;
  image_url?: string | null;
}

export interface GenerateRecipesResponse {
  recipes: RecipeItem[];
  record_id?: string | null;
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
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  detail: string;
  error_code: ApiErrorCode;
}
