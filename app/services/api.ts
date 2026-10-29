import {
  ApiErrorCode,
  ApiErrorResponse,
  GenerateRecipesRequest,
  GenerateRecipesResponse,
} from '@/types/recipe';

const API_BASE_URL = (
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

export async function generateRecipesFromImage(
  base64Image: string
): Promise<GenerateRecipesResponse> {
  const payload: GenerateRecipesRequest = {
    image_base64: base64Image,
  };

  const endpoint = `${API_BASE_URL}/api/v1/generate-recipes`;
  console.log(`[SnapCook API] POST ${endpoint} (payload length: ${payload.image_base64.length})`);

  const controller = new AbortController();
  const timeoutMs = 60000; // 60s timeout for AI generation
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
    clearTimeout(timeoutId);
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || err.message.toLowerCase().includes('abort'));
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

  try {
    const data = JSON.parse(rawText) as GenerateRecipesResponse;
    console.log(
      `[SnapCook API] Parsed ${data?.recipes?.length ?? 0} recipes successfully.`
    );
    return data;
  } catch (parseErr) {
    console.error('[SnapCook API] Failed to parse JSON response:', rawText, parseErr);
    throw new ApiClientError(
      'Server returned invalid JSON response.',
      response.status,
      'INVALID_AI_JSON'
    );
  }
}
