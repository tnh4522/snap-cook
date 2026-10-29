import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthUser,
  CoachChatMessage,
  FastingState,
  MealLogItem,
  UserHealthProfile,
  WaterLogItem,
  WeeklyHealthReport,
  WeeklyMealPlan,
  WeightLogItem,
  WorkoutLogItem,
} from '@/types/health';
import { FavoriteRecipe, RecipePreferences, ScanSession } from '@/types/recipe';

const KEYS = {
  history: 'snapcook:history:v1',
  favorites: 'snapcook:favorites:v1',
  preferences: 'snapcook:preferences:v1',
  authUser: 'snapcook:auth_user:v1',
  localAccounts: 'snapcook:local_accounts:v1',
  healthProfile: 'snapcook:health_profile:v1',
  mealLogs: 'snapcook:meal_logs:v1',
  weightLogs: 'snapcook:weight_logs:v1',
  waterLogs: 'snapcook:water_logs:v1',
  workoutLogs: 'snapcook:workout_logs:v1',
  fastingState: 'snapcook:fasting_state:v1',
  weeklyMealPlan: 'snapcook:weekly_meal_plan:v1',
  coachMessages: 'snapcook:coach_messages:v1',
  weeklyReport: 'snapcook:weekly_report:v1',
} as const;

export const DEFAULT_FASTING_STATE: FastingState = {
  isActive: false,
  protocol: '16_8',
  targetFastingHours: 16,
  startTime: null,
  targetEndTime: null,
};

export const MAX_HISTORY_ITEMS = 30;
export const MAX_MEAL_LOGS = 200;

export const DEFAULT_PREFERENCES: RecipePreferences = {
  diet: [],
  language: 'en',
  servings: 2,
};

export interface LocalAccountRecord {
  user: AuthUser;
  password: string;
}

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
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
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

  loadAuthUser: () => readJson<AuthUser | null>(KEYS.authUser, null),
  saveAuthUser: (user: AuthUser | null) => writeJson(KEYS.authUser, user),

  loadLocalAccounts: () =>
    readJson<Record<string, LocalAccountRecord>>(KEYS.localAccounts, {}),
  saveLocalAccounts: (accounts: Record<string, LocalAccountRecord>) =>
    writeJson(KEYS.localAccounts, accounts),

  loadHealthProfile: () => readJson<UserHealthProfile | null>(KEYS.healthProfile, null),
  saveHealthProfile: (profile: UserHealthProfile | null) =>
    writeJson(KEYS.healthProfile, profile),

  loadMealLogs: () => readJson<MealLogItem[]>(KEYS.mealLogs, []),
  saveMealLogs: (logs: MealLogItem[]) =>
    writeJson(KEYS.mealLogs, logs.slice(0, MAX_MEAL_LOGS)),

  loadWeightLogs: () => readJson<WeightLogItem[]>(KEYS.weightLogs, []),
  saveWeightLogs: (logs: WeightLogItem[]) => writeJson(KEYS.weightLogs, logs),

  loadWaterLogs: () => readJson<WaterLogItem[]>(KEYS.waterLogs, []),
  saveWaterLogs: (logs: WaterLogItem[]) => writeJson(KEYS.waterLogs, logs),

  loadWorkoutLogs: () => readJson<WorkoutLogItem[]>(KEYS.workoutLogs, []),
  saveWorkoutLogs: (logs: WorkoutLogItem[]) => writeJson(KEYS.workoutLogs, logs),

  loadFastingState: () =>
    readJson<FastingState>(KEYS.fastingState, DEFAULT_FASTING_STATE),
  saveFastingState: (state: FastingState) => writeJson(KEYS.fastingState, state),

  loadWeeklyMealPlan: () =>
    readJson<WeeklyMealPlan | null>(KEYS.weeklyMealPlan, null),
  saveWeeklyMealPlan: (plan: WeeklyMealPlan | null) =>
    writeJson(KEYS.weeklyMealPlan, plan),

  loadCoachMessages: () =>
    readJson<CoachChatMessage[]>(KEYS.coachMessages, []),
  saveCoachMessages: (msgs: CoachChatMessage[]) =>
    writeJson(KEYS.coachMessages, msgs.slice(-50)),

  loadWeeklyReport: () =>
    readJson<WeeklyHealthReport | null>(KEYS.weeklyReport, null),
  saveWeeklyReport: (report: WeeklyHealthReport | null) =>
    writeJson(KEYS.weeklyReport, report),
};
