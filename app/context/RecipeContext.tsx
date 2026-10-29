import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { optimizeImageForAI } from '@/services/imageOptimizer';
import { ApiClientError, generateRecipesFromImage } from '@/services/api';
import { RecipeItem, ScanSession } from '@/types/recipe';
import { useToast } from '@/context/ToastContext';
import { useLibrary } from '@/context/LibraryContext';
import { generateId } from '@/utils/recipe';
import { useI18n } from '@/i18n';

interface RecipeContextValue {
  recipes: RecipeItem[];
  detectedIngredients: string[];
  capturedImageUri: string | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  analyzeIngredientPhoto: (rawUri: string) => Promise<boolean>;
  cancelAnalysis: () => void;
  openSession: (session: ScanSession) => void;
  clearError: () => void;
  resetSession: () => void;
  addDetectedIngredient: (ingredient: string) => void;
}

const RecipeContext = createContext<RecipeContextValue | undefined>(undefined);

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<string[]>([]);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { showToast } = useToast();
  const { preferences, addHistorySession } = useLibrary();
  const { t } = useI18n();

  const clearError = useCallback(() => setError(null), []);

  const addDetectedIngredient = useCallback((ingredient: string) => {
    const trimmed = ingredient.trim();
    if (!trimmed) return;
    setDetectedIngredients((prev) =>
      prev.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed]
    );
  }, []);

  const resetSession = useCallback(() => {
    abortRef.current?.abort();
    setRecipes([]);
    setDetectedIngredients([]);
    setCapturedImageUri(null);
    setSessionId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const openSession = useCallback((session: ScanSession) => {
    setRecipes(session.recipes);
    setDetectedIngredients(session.detectedIngredients ?? []);
    setCapturedImageUri(session.imageUri);
    setSessionId(session.id);
    setError(null);
  }, []);

  const cancelAnalysis = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const analyzeIngredientPhoto = useCallback(
    async (rawUri: string): Promise<boolean> => {
      console.log('[RecipeContext] Starting ingredient analysis for:', rawUri);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      try {
        const optimized = await optimizeImageForAI(rawUri);
        if (controller.signal.aborted) {
          throw new ApiClientError('Analysis cancelled.', 0, 'CANCELLED');
        }

        const response = await generateRecipesFromImage(optimized.base64, {
          preferences,
          signal: controller.signal,
        });

        const session: ScanSession = {
          id: generateId(),
          createdAt: Date.now(),
          imageUri: optimized.uri,
          recipes: response.recipes,
          detectedIngredients: response.detected_ingredients ?? [],
        };
        openSession(session);
        addHistorySession(session);

        showToast(
          t('toasts.recipesReadyTitle'),
          t('toasts.recipesReadyDesc', { count: response.recipes.length }),
          'success'
        );
        return true;
      } catch (err) {
        if (err instanceof ApiClientError && err.errorCode === 'CANCELLED') {
          console.log('[RecipeContext] Analysis cancelled by user.');
          showToast(t('toasts.cancelledTitle'), t('toasts.cancelledDesc'), 'info');
          return false;
        }
        console.error('[RecipeContext] Error in analyzeIngredientPhoto:', err);
        if (err instanceof ApiClientError) {
          setError(err.message);
          if (err.errorCode === 'NETWORK_ERROR') {
            showToast(t('toasts.connectionFailedTitle'), err.message, 'error');
          } else if (err.errorCode === 'NO_INGREDIENTS_FOUND') {
            showToast(t('toasts.noIngredientsTitle'), err.message, 'warning');
          } else if (err.errorCode === 'IMAGE_TOO_LARGE') {
            showToast(t('toasts.imageTooLargeTitle'), err.message, 'warning');
          } else {
            showToast(t('toasts.aiErrorTitle'), err.message, 'error');
          }
        } else {
          const message =
            err instanceof Error
              ? err.message
              : t('toasts.unexpectedErrorDesc');
          setError(message);
          showToast(t('toasts.unexpectedErrorTitle'), message, 'error');
        }
        return false;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsLoading(false);
        }
      }
    },
    [showToast, preferences, openSession, addHistorySession, t]
  );

  return (
    <RecipeContext.Provider
      value={{
        recipes,
        detectedIngredients,
        capturedImageUri,
        sessionId,
        isLoading,
        error,
        analyzeIngredientPhoto,
        cancelAnalysis,
        openSession,
        clearError,
        resetSession,
        addDetectedIngredient,
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
