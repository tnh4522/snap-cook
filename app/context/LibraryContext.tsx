import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_PREFERENCES, MAX_HISTORY_ITEMS, storage } from '@/services/storage';
import { FavoriteRecipe, RecipeItem, RecipePreferences, ScanSession } from '@/types/recipe';
import { recipeKey } from '@/utils/recipe';

interface LibraryContextValue {
  isHydrated: boolean;
  history: ScanSession[];
  favorites: FavoriteRecipe[];
  preferences: RecipePreferences;
  addHistorySession: (session: ScanSession) => void;
  removeHistorySession: (id: string) => void;
  clearHistory: () => void;
  isFavorite: (recipe: RecipeItem) => boolean;
  toggleFavorite: (recipe: RecipeItem, imageUri?: string | null) => boolean;
  removeFavorite: (key: string) => void;
  clearFavorites: () => void;
  updatePreferences: (patch: Partial<RecipePreferences>) => void;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [history, setHistory] = useState<ScanSession[]>([]);
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [preferences, setPreferences] = useState<RecipePreferences>(DEFAULT_PREFERENCES);

  // Load persisted data once on startup
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [h, f, p] = await Promise.all([
        storage.loadHistory(),
        storage.loadFavorites(),
        storage.loadPreferences(),
      ]);
      if (!mounted) return;
      setHistory(h);
      setFavorites(f);
      setPreferences(p);
      setIsHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Persist on change (only after hydration so we never overwrite stored data with defaults)
  useEffect(() => {
    if (isHydrated) storage.saveHistory(history);
  }, [history, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveFavorites(favorites);
  }, [favorites, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.savePreferences(preferences);
  }, [preferences, isHydrated]);

  const addHistorySession = useCallback((session: ScanSession) => {
    setHistory((prev) =>
      [session, ...prev.filter((s) => s.id !== session.id)].slice(0, MAX_HISTORY_ITEMS)
    );
  }, []);

  const removeHistorySession = useCallback((id: string) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearHistory = useCallback(() => setHistory([]), []);

  const favoriteKeys = useMemo(() => new Set(favorites.map((f) => f.key)), [favorites]);

  const isFavorite = useCallback(
    (recipe: RecipeItem) => favoriteKeys.has(recipeKey(recipe)),
    [favoriteKeys]
  );

  const toggleFavorite = useCallback(
    (recipe: RecipeItem, imageUri?: string | null) => {
      const key = recipeKey(recipe);
      const willAdd = !favoriteKeys.has(key);
      setFavorites((prev) =>
        willAdd
          ? [{ key, recipe, imageUri: imageUri ?? null, savedAt: Date.now() }, ...prev]
          : prev.filter((f) => f.key !== key)
      );
      return willAdd;
    },
    [favoriteKeys]
  );

  const removeFavorite = useCallback((key: string) => {
    setFavorites((prev) => prev.filter((f) => f.key !== key));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  const updatePreferences = useCallback((patch: Partial<RecipePreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <LibraryContext.Provider
      value={{
        isHydrated,
        history,
        favorites,
        preferences,
        addHistorySession,
        removeHistorySession,
        clearHistory,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
        updatePreferences,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return ctx;
}
