import AsyncStorage from '@react-native-async-storage/async-storage';
import { FavoriteRecipe, RecipePreferences, ScanSession } from '@/types/recipe';

const KEYS = {
  history: 'snapcook:history:v1',
  favorites: 'snapcook:favorites:v1',
  preferences: 'snapcook:preferences:v1',
} as const;

export const MAX_HISTORY_ITEMS = 30;

export const DEFAULT_PREFERENCES: RecipePreferences = {
  diet: [],
  language: 'en',
  servings: 2,
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (err) {
    console.warn(`[storage] Failed to read ${key}:`, err);
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed to write ${key}:`, err);
  }
}

export const storage = {
  loadHistory: () => readJson<ScanSession[]>(KEYS.history, []),
  saveHistory: (items: ScanSession[]) => writeJson(KEYS.history, items.slice(0, MAX_HISTORY_ITEMS)),

  loadFavorites: () => readJson<FavoriteRecipe[]>(KEYS.favorites, []),
  saveFavorites: (items: FavoriteRecipe[]) => writeJson(KEYS.favorites, items),

  loadPreferences: async (): Promise<RecipePreferences> => ({
    ...DEFAULT_PREFERENCES,
    ...(await readJson<Partial<RecipePreferences>>(KEYS.preferences, {})),
  }),
  savePreferences: (prefs: RecipePreferences) => writeJson(KEYS.preferences, prefs),
};
