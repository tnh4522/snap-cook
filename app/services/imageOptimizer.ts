import * as ImageManipulator from 'expo-image-manipulator';

export interface OptimizedImageResult {
  uri: string;
  base64: string;
  width: number;
  height: number;
}

/**
 * Resizes an image to a maximum width of 1024px and compresses it to 0.7 JPEG quality.
 * Returns the local URI and Base64 payload ready for AI analysis.
 */
export async function optimizeImageForAI(uri: string): Promise<OptimizedImageResult> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  if (!result.base64) {
    throw new Error('Failed to encode optimized image as Base64.');
  }

  return {
    uri: result.uri,
    base64: result.base64,
    width: result.width,
    height: result.height,
  };
}
