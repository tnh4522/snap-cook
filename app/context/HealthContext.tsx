import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  CoachChatMessage,
  ExerciseType,
  FastingProtocol,
  FastingState,
  FoodAnalysisResult,
  HealthMetrics,
  MealLogItem,
  MealType,
  UserHealthProfile,
  WaterLogItem,
  WeeklyHealthReport,
  WeeklyMealPlan,
  WeightLogItem,
  WorkoutIntensity,
  WorkoutLogItem,
} from '@/types/health';
import {
  calculateHealthMetrics,
  DEFAULT_HEALTH_PROFILE,
  isSameLocalDay,
} from '@/utils/health';
import { calculateWorkoutCalories, EXERCISE_METAS } from '@/utils/workout';
import { createDefaultWeeklyMealPlan } from '@/utils/mealPlan';
import { DEFAULT_FASTING_STATE, storage } from '@/services/storage';
import { optimizeImageForAI } from '@/services/imageOptimizer';
import {
  analyzeFoodFromImage,
  ApiClientError,
  fetchWeeklyMealPlanRemote,
  generateWeeklyReportRemote,
  sendCoachMessageRemote,
} from '@/services/api';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { generateId } from '@/utils/recipe';
import { useI18n } from '@/i18n';

interface TodayNutritionSummary {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  burned_calories: number;
  net_calories: number;
}

interface HealthContextValue {
  profile: UserHealthProfile;
  hasCustomProfile: boolean;
  metrics: HealthMetrics;
  mealLogs: MealLogItem[];
  todayLogs: MealLogItem[];
  todayNutrition: TodayNutritionSummary;
  lastFoodAnalysis: FoodAnalysisResult | null;
  lastFoodImageUri: string | null;
  isAnalyzingFood: boolean;
  foodError: string | null;
  updateHealthProfile: (nextProfile: UserHealthProfile) => Promise<void>;
  analyzeFoodPhoto: (rawUri: string, mealType?: MealType) => Promise<boolean>;
  cancelFoodAnalysis: () => void;
  clearFoodError: () => void;
  logMeal: (entry: Omit<MealLogItem, 'id' | 'loggedAt'>) => void;
  removeMealLog: (id: string) => void;

  // Phase 2: Weight, Water, Fasting
  weightLogs: WeightLogItem[];
  latestWeight: number;
  logWeight: (weightKg: number, notes?: string) => void;
  removeWeightLog: (id: string) => void;

  waterLogs: WaterLogItem[];
  todayWaterMl: number;
  dailyWaterTargetMl: number;
  addWater: (amountMl: number) => void;
  resetTodayWater: () => void;

  fastingState: FastingState;
  startFasting: (protocol?: FastingProtocol) => void;
  stopFasting: () => void;
  updateFastingProtocol: (protocol: FastingProtocol) => void;

  // Phase 3: Workouts & Meal Plan
  workoutLogs: WorkoutLogItem[];
  todayWorkouts: WorkoutLogItem[];
  logWorkout: (
    exerciseType: ExerciseType,
    durationMinutes: number,
    intensity?: WorkoutIntensity
  ) => void;
  removeWorkoutLog: (id: string) => void;

  weeklyMealPlan: WeeklyMealPlan | null;
  isGeneratingMealPlan: boolean;
  generateWeeklyMealPlanAction: (force?: boolean) => Promise<void>;
  toggleMealPlanItemEaten: (dayIndex: number, mealId: string) => void;

  // Phase 4: AI Health Coach & Weekly Insights
  coachMessages: CoachChatMessage[];
  isCoachReplying: boolean;
  sendMessageToCoach: (text: string) => Promise<void>;
  clearCoachChat: () => void;

  weeklyReport: WeeklyHealthReport | null;
  isGeneratingReport: boolean;
  refreshWeeklyReport: () => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

const PROTOCOL_HOURS: Record<FastingProtocol, number> = {
  '14_10': 14,
  '16_8': 16,
  '18_6': 18,
  '20_4': 20,
};

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { preferences } = useLibrary();
  const { showToast } = useToast();
  const { t, language } = useI18n();

  const [profile, setProfile] = useState<UserHealthProfile>(DEFAULT_HEALTH_PROFILE);
  const [hasCustomProfile, setHasCustomProfile] = useState(false);
  const [mealLogs, setMealLogs] = useState<MealLogItem[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLogItem[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLogItem[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogItem[]>([]);
  const [fastingState, setFastingState] = useState<FastingState>(DEFAULT_FASTING_STATE);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [coachMessages, setCoachMessages] = useState<CoachChatMessage[]>([]);
  const [isCoachReplying, setIsCoachReplying] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyHealthReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const [isHydrated, setIsHydrated] = useState(false);
  const [lastFoodAnalysis, setLastFoodAnalysis] = useState<FoodAnalysisResult | null>(null);
  const [lastFoodImageUri, setLastFoodImageUri] = useState<string | null>(null);
  const [isAnalyzingFood, setIsAnalyzingFood] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [
        storedProfile,
        storedLogs,
        storedWeight,
        storedWater,
        storedWorkouts,
        storedFasting,
        storedMealPlan,
        storedCoach,
        storedReport,
      ] = await Promise.all([
        storage.loadHealthProfile(),
        storage.loadMealLogs(),
        storage.loadWeightLogs(),
        storage.loadWaterLogs(),
        storage.loadWorkoutLogs(),
        storage.loadFastingState(),
        storage.loadWeeklyMealPlan(),
        storage.loadCoachMessages(),
        storage.loadWeeklyReport(),
      ]);
      if (!mounted) return;
      if (storedProfile) {
        setProfile(storedProfile);
        setHasCustomProfile(true);
      }
      setMealLogs(storedLogs);
      setWeightLogs(storedWeight);
      setWaterLogs(storedWater);
      setWorkoutLogs(storedWorkouts);
      setFastingState(storedFasting);
      setWeeklyMealPlan(storedMealPlan);
      setCoachMessages(storedCoach || []);
      setWeeklyReport(storedReport);
      setIsHydrated(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Save changes to storage
  useEffect(() => {
    if (isHydrated) storage.saveMealLogs(mealLogs);
  }, [mealLogs, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveWeightLogs(weightLogs);
  }, [weightLogs, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveWaterLogs(waterLogs);
  }, [waterLogs, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveWorkoutLogs(workoutLogs);
  }, [workoutLogs, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveFastingState(fastingState);
  }, [fastingState, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveWeeklyMealPlan(weeklyMealPlan);
  }, [weeklyMealPlan, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveCoachMessages(coachMessages);
  }, [coachMessages, isHydrated]);
  useEffect(() => {
    if (isHydrated) storage.saveWeeklyReport(weeklyReport);
  }, [weeklyReport, isHydrated]);

  const latestWeight = useMemo(() => {
    if (weightLogs.length > 0) return weightLogs[0].weight_kg;
    return profile.current_weight_kg;
  }, [weightLogs, profile.current_weight_kg]);

  const metrics = useMemo(
    () => calculateHealthMetrics({ ...profile, current_weight_kg: latestWeight }),
    [profile, latestWeight]
  );

  const todayLogs = useMemo(
    () => mealLogs.filter((item) => isSameLocalDay(item.loggedAt)),
    [mealLogs]
  );

  const todayWorkouts = useMemo(
    () => workoutLogs.filter((item) => isSameLocalDay(item.loggedAt)),
    [workoutLogs]
  );

  const todayWaterLogs = useMemo(
    () => waterLogs.filter((item) => isSameLocalDay(item.loggedAt)),
    [waterLogs]
  );

  const todayWaterMl = useMemo(
    () => todayWaterLogs.reduce((acc, item) => acc + item.amount_ml, 0),
    [todayWaterLogs]
  );

  const dailyWaterTargetMl = useMemo(() => {
    return Math.max(1500, Math.round(latestWeight * 35));
  }, [latestWeight]);

  const todayNutrition = useMemo<TodayNutritionSummary>(() => {
    const macroTotals = todayLogs.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein_g: Math.round((acc.protein_g + item.protein_g) * 10) / 10,
        carbs_g: Math.round((acc.carbs_g + item.carbs_g) * 10) / 10,
        fat_g: Math.round((acc.fat_g + item.fat_g) * 10) / 10,
        fiber_g: Math.round((acc.fiber_g + item.fiber_g) * 10) / 10,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
    );

    const burned = todayWorkouts.reduce(
      (acc, item) => acc + item.calories_burned,
      0
    );

    return {
      ...macroTotals,
      burned_calories: burned,
      net_calories: macroTotals.calories - burned,
    };
  }, [todayLogs, todayWorkouts]);

  const updateHealthProfile = useCallback(
    async (nextProfile: UserHealthProfile) => {
      const stamped: UserHealthProfile = {
        ...nextProfile,
        updatedAt: Date.now(),
      };
      setProfile(stamped);
      setHasCustomProfile(true);
      await storage.saveHealthProfile(stamped);

      if (isSupabaseConfigured && supabase && user?.isCloudUser) {
        try {
          const calc = calculateHealthMetrics(stamped);
          await supabase.from('user_profiles').upsert(
            {
              user_id: user.id,
              display_name: user.displayName,
              gender: stamped.gender,
              age: stamped.age,
              height_cm: stamped.height_cm,
              current_weight_kg: stamped.current_weight_kg,
              target_weight_kg: stamped.target_weight_kg,
              activity_level: stamped.activity_level,
              main_goal: stamped.main_goal,
              diet_style: stamped.diet_style,
              bmi: calc.bmi,
              bmr: calc.bmr,
              tdee: calc.tdee,
              daily_calorie_target: calc.daily_calorie_target,
              macro_ratio: {
                protein_pct: calc.macros.protein_pct,
                carbs_pct: calc.macros.carbs_pct,
                fat_pct: calc.macros.fat_pct,
              },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        } catch (err) {
          console.warn('[HealthContext] Cloud profile sync warning:', err);
        }
      }
    },
    [user]
  );

  const clearFoodError = useCallback(() => setFoodError(null), []);
  const cancelFoodAnalysis = useCallback(() => abortRef.current?.abort(), []);

  const analyzeFoodPhoto = useCallback(
    async (rawUri: string, mealType: MealType = 'lunch'): Promise<boolean> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsAnalyzingFood(true);
      setFoodError(null);
      try {
        const optimized = await optimizeImageForAI(rawUri);
        if (controller.signal.aborted) {
          throw new ApiClientError('Food analysis cancelled.', 0, 'CANCELLED');
        }

        const res = await analyzeFoodFromImage(optimized.base64, {
          language: preferences.language,
          mealType,
          dietaryGoal: profile.main_goal,
          userId: user?.id ?? null,
          signal: controller.signal,
        });

        setLastFoodAnalysis(res.analysis);
        setLastFoodImageUri(optimized.uri);
        return true;
      } catch (err) {
        if (err instanceof ApiClientError && err.errorCode === 'CANCELLED') {
          showToast(t('toasts.cancelledTitle'), t('toasts.cancelledDesc'), 'info');
          return false;
        }
        const message =
          err instanceof Error ? err.message : t('toasts.unexpectedErrorDesc');
        setFoodError(message);
        showToast(t('toasts.aiErrorTitle'), message, 'error');
        return false;
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setIsAnalyzingFood(false);
        }
      }
    },
    [preferences.language, profile.main_goal, user?.id, showToast, t]
  );

  const logMeal = useCallback(
    (entry: Omit<MealLogItem, 'id' | 'loggedAt'>) => {
      const newItem: MealLogItem = {
        ...entry,
        id: `meal_${generateId()}`,
        userId: user?.id ?? null,
        loggedAt: Date.now(),
      };
      setMealLogs((prev) => [newItem, ...prev]);
    },
    [user?.id]
  );

  const removeMealLog = useCallback((id: string) => {
    setMealLogs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Phase 2: Weight Actions
  const logWeight = useCallback(
    (weightKg: number, notes?: string) => {
      const rounded = Math.round(weightKg * 10) / 10;
      const newLog: WeightLogItem = {
        id: `wt_${generateId()}`,
        weight_kg: rounded,
        notes: notes?.trim() || undefined,
        recordedAt: Date.now(),
      };
      setWeightLogs((prev) => [newLog, ...prev]);
      setProfile((prev) => ({ ...prev, current_weight_kg: rounded }));
      showToast(
        t('weight.logSuccessTitle'),
        t('weight.logSuccessDesc', { weight: rounded }),
        'success'
      );
    },
    [showToast, t]
  );

  const removeWeightLog = useCallback((id: string) => {
    setWeightLogs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Phase 2: Water Actions
  const addWater = useCallback(
    (amountMl: number) => {
      const newLog: WaterLogItem = {
        id: `wtr_${generateId()}`,
        amount_ml: amountMl,
        loggedAt: Date.now(),
      };
      setWaterLogs((prev) => [newLog, ...prev]);
    },
    []
  );

  const resetTodayWater = useCallback(() => {
    setWaterLogs((prev) => prev.filter((item) => !isSameLocalDay(item.loggedAt)));
  }, []);

  // Phase 2: Intermittent Fasting Actions
  const startFasting = useCallback(
    (protocol: FastingProtocol = fastingState.protocol) => {
      const hours = PROTOCOL_HOURS[protocol] || 16;
      const now = Date.now();
      const end = now + hours * 60 * 60 * 1000;
      setFastingState({
        isActive: true,
        protocol,
        targetFastingHours: hours,
        startTime: now,
        targetEndTime: end,
      });
    },
    [fastingState.protocol]
  );

  const stopFasting = useCallback(() => {
    setFastingState((prev) => ({
      ...prev,
      isActive: false,
      startTime: null,
      targetEndTime: null,
    }));
  }, []);

  const updateFastingProtocol = useCallback(
    (protocol: FastingProtocol) => {
      const hours = PROTOCOL_HOURS[protocol] || 16;
      setFastingState((prev) => ({
        ...prev,
        protocol,
        targetFastingHours: hours,
        targetEndTime: prev.startTime ? prev.startTime + hours * 3600000 : null,
      }));
    },
    []
  );

  // Phase 3: Workout Actions
  const logWorkout = useCallback(
    (
      exerciseType: ExerciseType,
      durationMinutes: number,
      intensity: WorkoutIntensity = 'moderate'
    ) => {
      const meta = EXERCISE_METAS[exerciseType] || EXERCISE_METAS.walking;
      const isVi = language === 'vi';
      const name = isVi ? meta.name_vi : meta.name_en;
      const caloriesBurned = calculateWorkoutCalories(
        exerciseType,
        durationMinutes,
        latestWeight,
        intensity
      );

      const newLog: WorkoutLogItem = {
        id: `wko_${generateId()}`,
        exercise_type: exerciseType,
        exercise_name: name,
        duration_minutes: durationMinutes,
        calories_burned: caloriesBurned,
        intensity,
        loggedAt: Date.now(),
      };
      setWorkoutLogs((prev) => [newLog, ...prev]);
      showToast(
        t('workout.logSuccessTitle'),
        t('workout.logSuccessDesc', { calories: caloriesBurned, name }),
        'success'
      );
    },
    [latestWeight, language, showToast, t]
  );

  const removeWorkoutLog = useCallback((id: string) => {
    setWorkoutLogs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Phase 3: Smart Meal Plan Actions
  const generateWeeklyMealPlanAction = useCallback(
    async (force: boolean = false) => {
      if (weeklyMealPlan && !force) return;
      setIsGeneratingMealPlan(true);
      try {
        const plan = await fetchWeeklyMealPlanRemote(
          profile.diet_style,
          metrics.daily_calorie_target,
          preferences.language
        );
        setWeeklyMealPlan(plan);
      } catch {
        // Fallback to local deterministic plan
        const fallback = createDefaultWeeklyMealPlan(
          profile.diet_style,
          metrics.daily_calorie_target,
          preferences.language
        );
        setWeeklyMealPlan(fallback);
      } finally {
        setIsGeneratingMealPlan(false);
      }
    },
    [weeklyMealPlan, profile.diet_style, metrics.daily_calorie_target, preferences.language]
  );

  const toggleMealPlanItemEaten = useCallback(
    (dayIndex: number, mealId: string) => {
      if (!weeklyMealPlan) return;
      const updatedDays = weeklyMealPlan.days.map((day) => {
        if (day.day_index !== dayIndex) return day;
        return {
          ...day,
          meals: day.meals.map((meal) => {
            if (meal.id !== mealId) return meal;
            const nextEaten = !meal.isEaten;
            if (nextEaten) {
              // Also log to today's food diary!
              logMeal({
                meal_type: meal.meal_type,
                food_name: meal.food_name,
                portion_description: meal.portion_desc,
                portion_multiplier: 1,
                estimated_grams: 300,
                calories: meal.calories,
                protein_g: meal.protein_g,
                carbs_g: meal.carbs_g,
                fat_g: meal.fat_g,
                fiber_g: 3,
                health_score: 9,
                ai_advice: meal.cooking_tip || '',
                imageUri: null,
              });
              showToast(
                t('foodLens.loggedSuccessTitle'),
                t('foodLens.loggedSuccessDesc', {
                  name: meal.food_name,
                  calories: meal.calories,
                }),
                'success'
              );
            }
            return { ...meal, isEaten: nextEaten };
          }),
        };
      });

      setWeeklyMealPlan((prev) => (prev ? { ...prev, days: updatedDays } : null));
    },
    [weeklyMealPlan, logMeal, showToast, t]
  );

  // Phase 4: AI Coach Chat Actions
  const sendMessageToCoach = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      const userMsg: CoachChatMessage = {
        id: `cmsg_${generateId()}`,
        role: 'user',
        content: clean,
        timestamp: Date.now(),
      };

      const updatedHistory = [...coachMessages, userMsg];
      setCoachMessages(updatedHistory);
      setIsCoachReplying(true);

      const todaySummary = {
        calories: todayNutrition.calories,
        burned_calories: todayNutrition.burned_calories,
        daily_target: metrics.daily_calorie_target,
        water_ml: todayWaterMl,
      };

      try {
        const replyText = await sendCoachMessageRemote(
          updatedHistory,
          profile,
          todaySummary,
          preferences.language
        );
        const coachMsg: CoachChatMessage = {
          id: `cmsg_${generateId()}`,
          role: 'assistant',
          content: replyText,
          timestamp: Date.now(),
        };
        setCoachMessages((prev) => [...prev, coachMsg]);
      } catch (err) {
        console.warn('[HealthContext] AI Coach fallback:', err);
        const isVi = preferences.language === 'vi';
        const fallbackText =
          isVi
            ? 'Chào bạn! Dr. SnapCook luôn đồng hành cùng bạn. Lời khuyên nhanh: Hãy duy trì uống đủ nước, chia nhỏ các bữa ăn có chứa protein nạc (ức gà, trứng, đậu hũ) và kiên trì với kế hoạch calo thâm hụt nhé!'
            : 'Hello! Dr. SnapCook is here with you. Quick takeaway: Stay hydrated, prioritize lean protein with each meal, and stick consistently to your calorie plan!';
        const coachMsg: CoachChatMessage = {
          id: `cmsg_${generateId()}`,
          role: 'assistant',
          content: fallbackText,
          timestamp: Date.now(),
        };
        setCoachMessages((prev) => [...prev, coachMsg]);
      } finally {
        setIsCoachReplying(false);
      }
    },
    [
      coachMessages,
      todayNutrition,
      metrics.daily_calorie_target,
      todayWaterMl,
      profile,
      preferences.language,
    ]
  );

  const clearCoachChat = useCallback(() => {
    setCoachMessages([]);
  }, []);

  // Phase 4: Weekly Report Action
  const refreshWeeklyReport = useCallback(async () => {
    setIsGeneratingReport(true);
    const daysData: Array<Record<string, any>> = [];
    const now = Date.now();

    for (let i = 0; i < 7; i++) {
      const targetTs = now - i * 86400000;
      const dayMeals = mealLogs.filter((m) => isSameLocalDay(m.loggedAt, targetTs));
      const dayWorkouts = workoutLogs.filter((w) =>
        isSameLocalDay(w.loggedAt, targetTs)
      );

      daysData.push({
        calories: dayMeals.reduce((acc, m) => acc + m.calories, 0),
        burned_calories: dayWorkouts.reduce((acc, w) => acc + w.calories_burned, 0),
        protein_g: dayMeals.reduce((acc, m) => acc + m.protein_g, 0),
      });
    }

    try {
      const rep = await generateWeeklyReportRemote(
        profile,
        daysData,
        preferences.language
      );
      setWeeklyReport(rep);
    } catch {
      // Local fallback computation
      const daysCount = Math.max(1, daysData.filter((d) => d.calories > 0).length);
      const totalIn = daysData.reduce((acc, d) => acc + d.calories, 0);
      const totalOut = daysData.reduce((acc, d) => acc + d.burned_calories, 0);
      const totalTarget = metrics.daily_calorie_target * daysCount;
      const deficit = totalTarget - totalIn + totalOut;
      const estFat = Math.round((deficit / 7700) * 100) / 100;
      const avgCal = Math.round(totalIn / daysCount);
      const avgP = Math.round((daysData.reduce((acc, d) => acc + d.protein_g, 0) / daysCount) * 10) / 10;

      const isVi = preferences.language === 'vi';
      const localRep: WeeklyHealthReport = {
        id: `rep_${Date.now()}`,
        generatedAt: Date.now(),
        summary_text: isVi
          ? `Trong 7 ngày qua, bạn đã duy trì mức nạp trung bình ${avgCal} kcal/ngày và tiêu hao thâm hụt năng lượng ước tính ${deficit} kcal (~${estFat} kg mỡ).`
          : `Over the past 7 days, your average intake was ${avgCal} kcal/day with an estimated caloric deficit of ${deficit} kcal (~${estFat} kg fat).`,
        total_deficit_surplus_kcal: deficit,
        est_fat_change_kg: estFat,
        avg_daily_calories: avgCal,
        avg_protein_g: avgP,
        adherence_score: Math.min(95, Math.max(60, 100 - Math.round(Math.abs(avgCal - metrics.daily_calorie_target) / 30))),
        recommendations: isVi
          ? [
              'Duy trì bổ sung đủ nước 2-2.5L mỗi ngày để hỗ trợ quá trình đốt mỡ.',
              'Ưu tiên nạp đạm trong bữa sáng và sau các buổi tập luyện.',
              'Tiếp tục bám sát thực đơn ăn kiêng khoa học 7 ngày đã đề ra.',
            ]
          : [
              'Maintain daily hydration between 2-2.5L to boost metabolism.',
              'Prioritize lean protein at breakfast and post-workout.',
              'Continue following your structured 7-day meal plan.',
            ],
        safety_alerts: [],
      };
      setWeeklyReport(localRep);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [mealLogs, workoutLogs, profile, metrics.daily_calorie_target, preferences.language]);

  return (
    <HealthContext.Provider
      value={{
        profile,
        hasCustomProfile,
        metrics,
        mealLogs,
        todayLogs,
        todayNutrition,
        lastFoodAnalysis,
        lastFoodImageUri,
        isAnalyzingFood,
        foodError,
        updateHealthProfile,
        analyzeFoodPhoto,
        cancelFoodAnalysis,
        clearFoodError,
        logMeal,
        removeMealLog,

        // Phase 2
        weightLogs,
        latestWeight,
        logWeight,
        removeWeightLog,
        waterLogs,
        todayWaterMl,
        dailyWaterTargetMl,
        addWater,
        resetTodayWater,
        fastingState,
        startFasting,
        stopFasting,
        updateFastingProtocol,

        // Phase 3
        workoutLogs,
        todayWorkouts,
        logWorkout,
        removeWorkoutLog,
        weeklyMealPlan,
        isGeneratingMealPlan,
        generateWeeklyMealPlanAction,
        toggleMealPlanItemEaten,

        // Phase 4
        coachMessages,
        isCoachReplying,
        sendMessageToCoach,
        clearCoachChat,
        weeklyReport,
        isGeneratingReport,
        refreshWeeklyReport,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return ctx;
}
