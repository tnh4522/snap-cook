import React, { createContext, useCallback, useContext, useState } from 'react';
import { optimizeImageForAI } from '@/services/imageOptimizer';
import { ApiClientError, generateRecipesFromImage } from '@/services/api';
import { RecipeItem } from '@/types/recipe';
import { useToast } from '@/context/ToastContext';

interface RecipeContextValue {
  recipes: RecipeItem[];
  capturedImageUri: string | null;
  isLoading: boolean;
  error: string | null;
  analyzeIngredientPhoto: (rawUri: string) => Promise<boolean>;
  clearError: () => void;
  resetSession: () => void;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const clearError = useCallback(() => setError(null), []);

  const resetSession = useCallback(() => {
    setRecipes([]);
    setCapturedImageUri(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const analyzeIngredientPhoto = useCallback(
    async (rawUri: string): Promise<boolean> => {
      console.log('[RecipeContext] Starting ingredient analysis for:', rawUri);
      setIsLoading(true);
      setError(null);
      try {
        const optimized = await optimizeImageForAI(rawUri);
        console.log('[RecipeContext] Image optimized successfully. Setting captured URI.');
        setCapturedImageUri(optimized.uri);

        const response = await generateRecipesFromImage(optimized.base64);
        console.log(
          `[RecipeContext] Received ${response?.recipes?.length ?? 0} recipes. Updating state.`
        );
        setRecipes(response.recipes || []);
        showToast(
          'Recipes Ready!',
          `Generated ${response.recipes.length} recipes from your ingredients.`,
          'success'
        );
        return true;
      } catch (err) {
        console.error('[RecipeContext] Error in analyzeIngredientPhoto:', err);
        if (err instanceof ApiClientError) {
          setError(err.message);
          if (err.errorCode === 'NETWORK_ERROR') {
            showToast('Connection Failed', err.message, 'error');
          } else if (err.errorCode === 'NO_INGREDIENTS_FOUND') {
            showToast('No Ingredients Found', err.message, 'warning');
          } else if (err.errorCode === 'IMAGE_TOO_LARGE') {
            showToast('Image Too Large', err.message, 'warning');
          } else {
            showToast('AI Generation Error', err.message, 'error');
          }
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'An unexpected error occurred while analyzing ingredients.';
          setError(message);
          showToast('Unexpected Error', message, 'error');
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        capturedImageUri,
        isLoading,
        error,
        analyzeIngredientPhoto,
        clearError,
        resetSession,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes(): RecipeContextValue {
  const ctx = useContext(RecipeContext);
  if (!ctx) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return ctx;
}
