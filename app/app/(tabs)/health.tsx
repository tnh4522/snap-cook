import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Activity,
  Award,
  Bot,
  CalendarDays,
  Camera,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  LogIn,
  LogOut,
  Plus,
  Scale,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  Utensils,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';
import { WaterTrackerCard } from '@/components/WaterTrackerCard';
import { FastingTimerCard } from '@/components/FastingTimerCard';
import { LogWeightModal } from '@/components/LogWeightModal';
import { LogWorkoutModal } from '@/components/LogWorkoutModal';

function MacroBar({
  label,
  current,
  target,
  color,
  isDark,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  isDark: boolean;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <View className="mb-3 last:mb-0">
      <View className="mb-1 flex-row items-center justify-between">
        <Text className="text-xs font-bold text-stone-700 dark:text-stone-300">
          {label}
        </Text>
        <Text className="text-xs font-semibold text-stone-500 dark:text-stone-400">
          {current}g / {target}g ({pct}%)
        </Text>
      </View>
      <View
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: isDark ? '#24292b' : '#e2e8f0' }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export default function HealthDashboardScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signInDemo, signOut } = useAuth();
  const {
    profile,
    metrics,
    latestWeight,
    weightLogs,
    removeWeightLog,
    todayLogs,
    todayWorkouts,
    todayNutrition,
    removeMealLog,
    removeWorkoutLog,
  } = useHealth();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);

  if (!isAuthenticated) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#f8f9fa] px-6 dark:bg-[#121415]"
        edges={['top', 'left', 'right']}
      >
        <View className="flex-1 items-center justify-center">
          <View
            className="w-full max-w-md items-center rounded-3xl p-7 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/50">
              <HeartPulse size={32} color={isDark ? '#52b788' : '#2d6a4f'} />
            </View>
            <Text className="text-center text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {t('auth.loginRequiredTitle')}
            </Text>
            <Text className="mt-2.5 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
              {t('auth.loginRequiredDesc')}
            </Text>

            <Pressable
              onPress={() => router.push('/auth')}
              className="mt-6 w-full flex-row items-center justify-center rounded-2xl bg-emerald-700 py-3.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
            >
              <LogIn size={17} color="#ffffff" />
              <Text className="ml-2 text-sm font-bold text-white">
                {t('auth.loginBtn')} / {t('auth.registerBtn')}
              </Text>
            </Pressable>

            <Pressable
              onPress={async () => {
                await signInDemo();
                showToast(
                  t('auth.loginTitle'),
                  t('auth.welcomeBack', { name: 'Minh Anh' }),
                  'success'
                );
              }}
              className="mt-3 w-full flex-row items-center justify-center rounded-2xl border border-emerald-600/30 bg-emerald-50/70 py-3 active:opacity-80 dark:border-emerald-500/30 dark:bg-emerald-950/30"
            >
              <Sparkles size={15} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t('auth.quickDemoBtn')}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Net Calorie Balance Equation: Target - Eaten + Burned = Remaining
  const remainingCalories =
    metrics.daily_calorie_target - todayNutrition.calories + todayNutrition.burned_calories;
  const isOverBudget = remainingCalories < 0;

  // Weight goal difference
  const weightDiff = Math.abs(
    Math.round((latestWeight - profile.target_weight_kg) * 10) / 10
  );
  const isLosing = latestWeight > profile.target_weight_kg;

  return (
    <SafeAreaView
      className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]"
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {t('health.title')}
            </Text>
            <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {t('auth.signedInAs')} {user?.displayName} ·{' '}
              {t(`onboarding.diet_${profile.diet_style}` as any)}
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => router.push('/onboarding')}
              accessibilityLabel={t('health.setupProfileBtn')}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
            >
              <Sliders size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
            </Pressable>
            <Pressable
              onPress={async () => {
                await signOut();
                showToast(t('auth.signOutBtn'), t('auth.signedOut'), 'info');
              }}
              accessibilityLabel={t('auth.signOutBtn')}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
            >
              <LogOut size={17} color={isDark ? '#f43f5e' : '#be123c'} />
            </Pressable>
          </View>
        </View>

        {/* Phase 3 Banner: Smart 7-Day Meal Plan Shortcut */}
        <Pressable
          onPress={() => router.push('/meal-planner')}
          className="mb-4 flex-row items-center justify-between rounded-3xl border border-emerald-600/30 bg-emerald-50/80 p-4 shadow-sm active:opacity-85 dark:border-emerald-500/30 dark:bg-emerald-950/40"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 dark:bg-emerald-600">
              <CalendarDays size={20} color="#ffffff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {t('mealPlan.title')}
              </Text>
              <Text className="mt-0.5 text-[11px] text-emerald-800/80 dark:text-emerald-300/80" numberOfLines={1}>
                {t('mealPlan.subtitle')}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color={isDark ? '#86efac' : '#2d6a4f'} />
        </Pressable>

        {/* Phase 4 Quick Access Grid: AI Coach & Weekly Report */}
        <View className="mb-5 flex-row gap-3">
          <Pressable
            onPress={() => router.push('/coach')}
            className="flex-1 flex-row items-center rounded-3xl border border-emerald-600/30 bg-emerald-50/80 p-3.5 shadow-sm active:opacity-85 dark:border-emerald-500/30 dark:bg-emerald-950/40"
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 dark:bg-emerald-600">
              <Bot size={20} color="#ffffff" />
            </View>
            <View className="ml-2.5 flex-1">
              <Text className="text-xs font-bold text-stone-900 dark:text-stone-100" numberOfLines={1}>
                {t('health.aiCoachShortcut')}
              </Text>
              <Text className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-400" numberOfLines={1}>
                {t('health.aiCoachDesc')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/weekly-report')}
            className="flex-1 flex-row items-center rounded-3xl border border-sky-600/30 bg-sky-50/80 p-3.5 shadow-sm active:opacity-85 dark:border-sky-500/30 dark:bg-sky-950/40"
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-700 dark:bg-sky-600">
              <Award size={20} color="#ffffff" />
            </View>
            <View className="ml-2.5 flex-1">
              <Text className="text-xs font-bold text-stone-900 dark:text-stone-100" numberOfLines={1}>
                {t('health.weeklyReportShortcut')}
              </Text>
              <Text className="mt-0.5 text-[10px] text-stone-500 dark:text-stone-400" numberOfLines={1}>
                {t('health.weeklyReportDesc')}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Daily Calorie Net Balance Card */}
        <View className="mb-5 rounded-3xl border border-emerald-600/25 bg-emerald-900 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-[#14291e]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Flame size={18} color="#86efac" />
              <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
                {t('health.calorieBudgetTitle')}
              </Text>
            </View>
            <Pressable
              onPress={() => setWorkoutModalVisible(true)}
              className="flex-row items-center rounded-full bg-white/15 px-3 py-1"
            >
              <Plus size={12} color="#ffffff" />
              <Text className="ml-1 text-[11px] font-semibold text-emerald-100">
                + Tập luyện
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-end justify-between">
            <View>
              <Text className="text-3xl font-extrabold text-white">
                {Math.abs(remainingCalories)}{' '}
                <Text className="text-sm font-semibold text-emerald-200">
                  kcal {isOverBudget ? t('health.overBudget') : t('health.remaining')}
                </Text>
              </Text>
              <Text className="mt-1 text-xs text-emerald-200/90">
                {metrics.daily_calorie_target} (Mục tiêu) - {todayNutrition.calories} (Nạp) +{' '}
                {todayNutrition.burned_calories} (Tập)
              </Text>
            </View>
          </View>

          <View className="mt-3.5 h-3 w-full overflow-hidden rounded-full bg-black/30">
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (todayNutrition.calories /
                      Math.max(1, metrics.daily_calorie_target + todayNutrition.burned_calories)) *
                      100
                  )
                )}%`,
                backgroundColor: isOverBudget ? '#fb7185' : '#4ade80',
              }}
            />
          </View>
        </View>

        {/* Phase 2: Water Tracker & Fasting Widgets */}
        <WaterTrackerCard />
        <FastingTimerCard />

        {/* Phase 3: Workouts & Active Burn */}
        <View
          className="mb-5 rounded-3xl p-5 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/60">
                <Dumbbell size={18} color="#ea580c" />
              </View>
              <View className="ml-2.5">
                <Text className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {t('workout.title')}
                </Text>
                <Text className="text-[11px] text-stone-500 dark:text-stone-400">
                  {t('workout.todayBurned')}: {todayNutrition.burned_calories} kcal
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setWorkoutModalVisible(true)}
              className="flex-row items-center rounded-xl bg-orange-600 px-3 py-1.5"
            >
              <Plus size={13} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Ghi nhận</Text>
            </Pressable>
          </View>

          {todayWorkouts.length === 0 ? (
            <Text className="mt-3 text-xs text-stone-500 dark:text-stone-400">
              {t('workout.emptyWorkouts')}
            </Text>
          ) : (
            <View className="mt-3 gap-2">
              {todayWorkouts.map((w) => (
                <View
                  key={w.id}
                  className="flex-row items-center justify-between rounded-2xl bg-stone-50 p-3 dark:bg-[#141718]"
                >
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {w.exercise_name}
                    </Text>
                    <Text className="text-[11px] text-stone-500">
                      {w.duration_minutes} phút · Cường độ {w.intensity}
                    </Text>
                  </View>
                  <Text className="mr-3 text-xs font-extrabold text-orange-600 dark:text-orange-400">
                    -{w.calories_burned} kcal
                  </Text>
                  <Pressable
                    onPress={() => removeWorkoutLog(w.id)}
                    className="h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40"
                  >
                    <Trash2 size={13} color={isDark ? '#f43f5e' : '#be123c'} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Phase 2: Weight Journey Card */}
        <View
          className="mb-5 rounded-3xl p-5 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                <Scale size={18} color={isDark ? '#52b788' : '#2d6a4f'} />
              </View>
              <View className="ml-2.5">
                <Text className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {t('weight.title')}
                </Text>
                <Text className="text-[11px] text-stone-500 dark:text-stone-400">
                  {weightDiff === 0
                    ? t('weight.reachedGoal')
                    : isLosing
                    ? t('weight.diffToLose', { diff: weightDiff })
                    : t('weight.diffToGain', { diff: weightDiff })}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => setWeightModalVisible(true)}
              className="flex-row items-center rounded-xl bg-emerald-700 px-3 py-1.5 dark:bg-emerald-600"
            >
              <Plus size={13} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Ghi cân nặng</Text>
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-center justify-around rounded-2xl bg-stone-50 py-3 dark:bg-[#141718]">
            <View className="items-center">
              <Text className="text-[11px] text-stone-500">{t('weight.currentWeight')}</Text>
              <Text className="mt-0.5 text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {latestWeight} kg
              </Text>
            </View>
            <View className="h-8 w-px bg-stone-200 dark:bg-stone-800" />
            <View className="items-center">
              <Text className="text-[11px] text-stone-500">{t('weight.targetWeight')}</Text>
              <Text className="mt-0.5 text-xl font-extrabold text-emerald-700 dark:text-emerald-400">
                {profile.target_weight_kg} kg
              </Text>
            </View>
            <View className="h-8 w-px bg-stone-200 dark:bg-stone-800" />
            <View className="items-center">
              <Text className="text-[11px] text-stone-500">Chỉ số BMI</Text>
              <Text className="mt-0.5 text-xl font-extrabold text-stone-900 dark:text-stone-100">
                {metrics.bmi}
              </Text>
            </View>
          </View>

          {/* Historical Weight Logs */}
          {weightLogs.length > 0 && (
            <View className="mt-3 gap-2">
              {weightLogs.slice(0, 3).map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between border-t border-stone-100 pt-2 dark:border-stone-800"
                >
                  <Text className="text-xs text-stone-500">
                    {new Date(item.recordedAt).toLocaleDateString()}
                    {item.notes ? ` · ${item.notes}` : ''}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="mr-2 text-xs font-bold text-stone-800 dark:text-stone-200">
                      {item.weight_kg} kg
                    </Text>
                    <Pressable onPress={() => removeWeightLog(item.id)}>
                      <Trash2 size={12} color="#94a3b8" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Daily Macronutrients Progress */}
        <View
          className="mb-5 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text className="mb-3.5 text-sm font-bold text-stone-800 dark:text-stone-100">
            {t('health.macrosProgressTitle')}
          </Text>
          <MacroBar
            label={t('foodLens.protein')}
            current={todayNutrition.protein_g}
            target={metrics.macros.protein_g}
            color="#f43f5e"
            isDark={isDark}
          />
          <MacroBar
            label={t('foodLens.carbs')}
            current={todayNutrition.carbs_g}
            target={metrics.macros.carbs_g}
            color="#f59e0b"
            isDark={isDark}
          />
          <MacroBar
            label={t('foodLens.fat')}
            current={todayNutrition.fat_g}
            target={metrics.macros.fat_g}
            color="#0ea5e9"
            isDark={isDark}
          />
          <MacroBar
            label={t('foodLens.fiber')}
            current={todayNutrition.fiber_g}
            target={metrics.macros.fiber_g}
            color="#10b981"
            isDark={isDark}
          />
        </View>

        {/* Today's Food Diary */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-sm font-bold text-stone-800 dark:text-stone-100">
            {t('health.todayDiaryTitle')} ({todayLogs.length})
          </Text>
          <Pressable
            onPress={() => router.navigate('/(tabs)')}
            className="flex-row items-center rounded-xl bg-emerald-700 px-3 py-1.5 dark:bg-emerald-600"
          >
            <Camera size={13} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">
              {t('health.snapMealBtn')}
            </Text>
          </Pressable>
        </View>

        {todayLogs.length === 0 ? (
          <View
            className="items-center rounded-3xl p-6"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Utensils size={26} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text className="mt-2 text-sm font-bold text-stone-700 dark:text-stone-200">
              {t('health.emptyDiaryTitle')}
            </Text>
            <Text className="mt-1 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
              {t('health.emptyDiaryDesc')}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {todayLogs.map((log) => (
              <View
                key={log.id}
                className="flex-row items-center rounded-3xl p-3.5 shadow-sm"
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {log.imageUri ? (
                  <Image
                    source={{ uri: log.imageUri }}
                    className="mr-3.5 h-16 w-16 rounded-2xl"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="mr-3.5 h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50">
                    <Utensils size={20} color={isDark ? '#52b788' : '#2d6a4f'} />
                  </View>
                )}

                <View className="flex-1 pr-2">
                  <View className="flex-row items-center">
                    <View className="rounded-md bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/60">
                      <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {t(`foodLens.meal_${log.meal_type}` as any)}
                      </Text>
                    </View>
                    <Text className="ml-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      {log.calories} kcal
                    </Text>
                  </View>
                  <Text
                    className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100"
                    numberOfLines={1}
                  >
                    {log.food_name}
                  </Text>
                  <Text className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
                    P: {log.protein_g}g · C: {log.carbs_g}g · F: {log.fat_g}g · ~
                    {log.estimated_grams}g
                  </Text>
                </View>

                <Pressable
                  onPress={() => removeMealLog(log.id)}
                  accessibilityLabel={t('common.delete')}
                  className="h-9 w-9 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40"
                >
                  <Trash2 size={15} color={isDark ? '#f43f5e' : '#be123c'} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals for Logging Weight & Workouts */}
      <LogWeightModal
        visible={weightModalVisible}
        onClose={() => setWeightModalVisible(false)}
      />
      <LogWorkoutModal
        visible={workoutModalVisible}
        onClose={() => setWorkoutModalVisible(false)}
      />
    </SafeAreaView>
  );
}
