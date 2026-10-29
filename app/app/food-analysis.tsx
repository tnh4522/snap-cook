import React, { useMemo, useState } from 'react';
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
  ArrowLeft,
  CheckCircle2,
  Flame,
  Scale,
  ShieldCheck,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { MealType } from '@/types/health';
import { scaleFoodAnalysis } from '@/utils/health';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

const PORTION_MULTIPLIERS = [0.5, 0.75, 1, 1.25, 1.5];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function FoodAnalysisScreen() {
  const router = useRouter();
  const { lastFoodAnalysis, lastFoodImageUri, logMeal } = useHealth();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [multiplier, setMultiplier] = useState<number>(1);
  const [mealType, setMealType] = useState<MealType>('lunch');

  const scaled = useMemo(() => {
    if (!lastFoodAnalysis) return null;
    return scaleFoodAnalysis(lastFoodAnalysis, multiplier);
  }, [lastFoodAnalysis, multiplier]);

  if (!scaled) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9fa] px-6 dark:bg-[#121415]">
        <Text className="text-base font-bold text-stone-700 dark:text-stone-200">
          {t('recipes.emptyTitle')}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-2xl bg-emerald-700 px-5 py-3"
        >
          <Text className="text-xs font-bold text-white">{t('common.goBack')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const scoreColor =
    scaled.health_score >= 8
      ? '#16a34a'
      : scaled.health_score >= 5
      ? '#d97706'
      : '#e11d48';

  const handleSaveToDiary = () => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    logMeal({
      meal_type: mealType,
      food_name: scaled.food_name,
      portion_description: `${scaled.portion_description} (${multiplier}x)`,
      portion_multiplier: multiplier,
      estimated_grams: scaled.estimated_grams,
      calories: scaled.calories,
      protein_g: scaled.protein_g,
      carbs_g: scaled.carbs_g,
      fat_g: scaled.fat_g,
      fiber_g: scaled.fiber_g,
      health_score: scaled.health_score,
      ai_advice: scaled.ai_advice,
      imageUri: lastFoodImageUri,
    });

    showToast(
      t('foodLens.loggedSuccessTitle'),
      t('foodLens.loggedSuccessDesc', {
        name: scaled.food_name,
        calories: scaled.calories,
      }),
      'success'
    );
    router.replace('/(tabs)/health');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View className="flex-row items-center justify-between py-4">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
          </Pressable>
          <Text className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            {t('foodLens.resultTitle')}
          </Text>
          <View className="w-10" />
        </View>

        {/* Dish Photo + Hero Summary */}
        <View
          className="mb-5 overflow-hidden rounded-3xl shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {lastFoodImageUri && (
            <Image
              source={{ uri: lastFoodImageUri }}
              className="h-48 w-full"
              resizeMode="cover"
            />
          )}

          <View className="p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
                  {scaled.food_name}
                </Text>
                <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {scaled.portion_description} ·{' '}
                  {t('foodLens.estimatedWeight', { grams: scaled.estimated_grams })}
                </Text>
              </View>

              <View
                className="flex-row items-center rounded-2xl px-3 py-1.5"
                style={{ backgroundColor: `${scoreColor}20` }}
              >
                <ShieldCheck size={15} color={scoreColor} />
                <Text
                  className="ml-1.5 text-xs font-extrabold"
                  style={{ color: scoreColor }}
                >
                  {scaled.health_score}/10
                </Text>
              </View>
            </View>

            {/* Health Tags */}
            {scaled.health_tags.length > 0 && (
              <View className="mt-3 flex-row flex-wrap gap-1.5">
                {scaled.health_tags.map((tag, idx) => (
                  <View
                    key={`${tag}-${idx}`}
                    className="rounded-full bg-emerald-50 px-2.5 py-1 dark:bg-emerald-950/50"
                  >
                    <Text className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Big Calorie Banner */}
            <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-emerald-900 px-4 py-3.5 dark:bg-[#14291e]">
              <View className="flex-row items-center">
                <Flame size={22} color="#86efac" />
                <Text className="ml-2.5 text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Calories
                </Text>
              </View>
              <Text className="text-2xl font-extrabold text-white">
                {scaled.calories}{' '}
                <Text className="text-xs font-semibold text-emerald-200">kcal</Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Interactive Portion Multiplier */}
        <View
          className="mb-5 rounded-3xl p-4"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-2.5 flex-row items-center">
            <Scale size={16} color={isDark ? '#52b788' : '#2d6a4f'} />
            <Text className="ml-2 text-xs font-bold text-stone-800 dark:text-stone-100">
              {t('foodLens.portionLabel')}
            </Text>
          </View>
          <View className="flex-row gap-2">
            {PORTION_MULTIPLIERS.map((m) => {
              const active = multiplier === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMultiplier(m)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#2d6a4f'
                      : isDark
                      ? '#141718'
                      : '#f1f5f9',
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: active ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    {m}x
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Macronutrients Grid */}
        <View
          className="mb-5 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text className="mb-3 text-sm font-bold text-stone-800 dark:text-stone-100">
            {t('foodLens.macrosTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            <View className="min-w-[30%] flex-1 rounded-2xl bg-rose-50/70 p-3 dark:bg-rose-950/30">
              <Text className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                {t('foodLens.protein')}
              </Text>
              <Text className="mt-1 text-lg font-extrabold text-rose-900 dark:text-rose-100">
                {scaled.protein_g}g
              </Text>
            </View>
            <View className="min-w-[30%] flex-1 rounded-2xl bg-amber-50/70 p-3 dark:bg-amber-950/30">
              <Text className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {t('foodLens.carbs')}
              </Text>
              <Text className="mt-1 text-lg font-extrabold text-amber-900 dark:text-amber-100">
                {scaled.carbs_g}g
              </Text>
            </View>
            <View className="min-w-[30%] flex-1 rounded-2xl bg-sky-50/70 p-3 dark:bg-sky-950/30">
              <Text className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                {t('foodLens.fat')}
              </Text>
              <Text className="mt-1 text-lg font-extrabold text-sky-900 dark:text-sky-100">
                {scaled.fat_g}g
              </Text>
            </View>
          </View>

          <View className="mt-2.5 flex-row gap-2.5">
            <View className="flex-1 rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-800">
              <Text className="text-[10px] text-stone-500">{t('foodLens.fiber')}</Text>
              <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {scaled.fiber_g}g
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-800">
              <Text className="text-[10px] text-stone-500">{t('foodLens.sugar')}</Text>
              <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {scaled.sugar_g}g
              </Text>
            </View>
            <View className="flex-1 rounded-xl border border-stone-200/70 px-3 py-2 dark:border-stone-800">
              <Text className="text-[10px] text-stone-500">{t('foodLens.sodium')}</Text>
              <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {scaled.sodium_mg}mg
              </Text>
            </View>
          </View>
        </View>

        {/* AI Nutritionist Advice */}
        {scaled.ai_advice ? (
          <View className="mb-5 rounded-3xl border border-emerald-600/20 bg-emerald-50/80 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/30">
            <View className="mb-1.5 flex-row items-center">
              <Sparkles size={16} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {t('foodLens.aiAdviceTitle')}
              </Text>
            </View>
            <Text className="text-xs leading-5 text-emerald-900/90 dark:text-emerald-100/90">
              {scaled.ai_advice}
            </Text>
          </View>
        ) : null}

        {/* Component Breakdown */}
        {scaled.components.length > 0 && (
          <View
            className="mb-5 rounded-3xl p-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text className="mb-3 text-sm font-bold text-stone-800 dark:text-stone-100">
              {t('foodLens.componentsTitle')}
            </Text>
            {scaled.components.map((comp, idx) => (
              <View
                key={`${comp.name}-${idx}`}
                className="flex-row items-center justify-between border-b border-stone-100 py-2.5 last:border-b-0 dark:border-stone-800/70"
              >
                <View className="flex-1 pr-2">
                  <Text className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {comp.name}
                  </Text>
                  <Text className="text-[11px] text-stone-500 dark:text-stone-400">
                    ~{comp.estimated_grams}g · P: {comp.protein_g}g · C: {comp.carbs_g}g · F:{' '}
                    {comp.fat_g}g
                  </Text>
                </View>
                <Text className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                  {comp.calories} kcal
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Meal Type Selector */}
        <View
          className="mb-5 rounded-3xl p-4"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-2.5 flex-row items-center">
            <Utensils size={16} color={isDark ? '#52b788' : '#2d6a4f'} />
            <Text className="ml-2 text-xs font-bold text-stone-800 dark:text-stone-100">
              {t('foodLens.mealTypeLabel')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {MEAL_TYPES.map((mt) => {
              const active = mealType === mt;
              return (
                <Pressable
                  key={mt}
                  onPress={() => setMealType(mt)}
                  className="flex-1 items-center rounded-xl py-2.5"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#2d6a4f'
                      : isDark
                      ? '#141718'
                      : '#f1f5f9',
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: active ? '#ffffff' : colors.textSecondary,
                    }}
                  >
                    {t(`foodLens.meal_${mt}` as any)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Log Meal Button */}
        <Pressable
          onPress={handleSaveToDiary}
          className="flex-row items-center justify-center rounded-2xl bg-emerald-700 py-4 shadow-sm active:opacity-85 dark:bg-emerald-600"
        >
          <CheckCircle2 size={18} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">
            {t('foodLens.logMealBtn', { calories: scaled.calories })}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
