import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChefHat,
  Flame,
  RotateCw,
  ShoppingBag,
  Sparkles,
  Utensils,
} from 'lucide-react-native';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

export default function MealPlannerScreen() {
  const router = useRouter();
  const {
    weeklyMealPlan,
    isGeneratingMealPlan,
    generateWeeklyMealPlanAction,
    toggleMealPlanItemEaten,
    profile,
  } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [activeDayIndex, setActiveDayIndex] = useState(1);
  const [activeTab, setActiveTab] = useState<'plan' | 'grocery'>('plan');

  useEffect(() => {
    if (!weeklyMealPlan) {
      generateWeeklyMealPlanAction();
    }
  }, [weeklyMealPlan, generateWeeklyMealPlanAction]);

  const activeDay = weeklyMealPlan?.days.find(
    (d) => d.day_index === activeDayIndex
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
        </Pressable>

        <View className="flex-1 px-3">
          <Text className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            {t('mealPlan.title')}
          </Text>
          <Text className="text-[11px] text-stone-500 dark:text-stone-400">
            {t(`onboarding.diet_${profile.diet_style}` as any)} ·{' '}
            {weeklyMealPlan?.daily_calorie_target || 1800} kcal/ngày
          </Text>
        </View>

        <Pressable
          onPress={() => generateWeeklyMealPlanAction(true)}
          disabled={isGeneratingMealPlan}
          className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 active:opacity-75 dark:bg-emerald-950/60"
        >
          {isGeneratingMealPlan ? (
            <ActivityIndicator size="small" color="#059669" />
          ) : (
            <RotateCw size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
          )}
        </Pressable>
      </View>

      {/* Sub Tabs: 7-Day Plan vs Grocery List */}
      <View className="mx-6 mb-3 flex-row rounded-2xl border border-stone-200 bg-stone-200/60 p-1 dark:border-stone-800 dark:bg-[#1a1d1f]">
        <Pressable
          onPress={() => setActiveTab('plan')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2"
          style={{
            backgroundColor:
              activeTab === 'plan'
                ? isDark
                  ? '#272b2e'
                  : '#ffffff'
                : 'transparent',
          }}
        >
          <CalendarDays
            size={14}
            color={activeTab === 'plan' ? (isDark ? '#52b788' : '#2d6a4f') : colors.textSecondary}
          />
          <Text
            className="ml-1.5 text-xs font-bold"
            style={{
              color:
                activeTab === 'plan'
                  ? isDark
                    ? '#edf2ee'
                    : '#1c2420'
                  : colors.textSecondary,
            }}
          >
            {t('mealPlan.title')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('grocery')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2"
          style={{
            backgroundColor:
              activeTab === 'grocery'
                ? isDark
                  ? '#272b2e'
                  : '#ffffff'
                : 'transparent',
          }}
        >
          <ShoppingBag
            size={14}
            color={
              activeTab === 'grocery' ? (isDark ? '#52b788' : '#2d6a4f') : colors.textSecondary
            }
          />
          <Text
            className="ml-1.5 text-xs font-bold"
            style={{
              color:
                activeTab === 'grocery'
                  ? isDark
                    ? '#edf2ee'
                    : '#1c2420'
                  : colors.textSecondary,
            }}
          >
            {t('mealPlan.groceryTitle')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'plan' ? (
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Day Selector Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4 flex-row py-1"
          >
            {(weeklyMealPlan?.days || []).map((day) => {
              const active = activeDayIndex === day.day_index;
              return (
                <Pressable
                  key={day.day_index}
                  onPress={() => setActiveDayIndex(day.day_index)}
                  className="mr-2.5 items-center rounded-2xl px-4 py-2.5"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#2d6a4f'
                      : isDark
                      ? '#1a1d1f'
                      : '#ffffff',
                    borderWidth: 1,
                    borderColor: active
                      ? isDark
                        ? '#29543d'
                        : '#2d6a4f'
                      : colors.border,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? '#ffffff' : colors.textSecondary }}
                  >
                    {day.day_name}
                  </Text>
                  <Text
                    className="mt-0.5 text-[10px]"
                    style={{ color: active ? '#86efac' : colors.textSecondary }}
                  >
                    {day.total_calories} kcal
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Active Day Summary Card */}
          {activeDay && (
            <View className="mb-5 rounded-3xl border border-emerald-600/20 bg-emerald-900 p-4 shadow-sm dark:bg-[#14291e]">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-extrabold text-white">
                  {activeDay.day_name} · Tổng {activeDay.total_calories} kcal
                </Text>
                <View className="flex-row items-center">
                  <Flame size={15} color="#86efac" />
                  <Text className="ml-1 text-xs font-bold text-emerald-200">
                    4 bữa
                  </Text>
                </View>
              </View>
              <Text className="mt-1 text-xs text-emerald-200/80">
                Đạm: {activeDay.total_protein_g}g · Tinh bột: {activeDay.total_carbs_g}g · Béo:{' '}
                {activeDay.total_fat_g}g
              </Text>
            </View>
          )}

          {/* Meals List for this Day */}
          <View className="gap-4">
            {(activeDay?.meals || []).map((meal) => {
              const isEaten = Boolean(meal.isEaten);
              return (
                <View
                  key={meal.id}
                  className="rounded-3xl p-5 shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: isEaten ? '#059669' : colors.border,
                  }}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                      <View className="flex-row items-center">
                        <View className="rounded-md bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/60">
                          <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {t(`foodLens.meal_${meal.meal_type}` as any)}
                          </Text>
                        </View>
                        <Text className="ml-2 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                          {meal.calories} kcal
                        </Text>
                      </View>
                      <Text className="mt-1 text-base font-extrabold text-stone-900 dark:text-stone-100">
                        {meal.food_name}
                      </Text>
                      <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                        P: {meal.protein_g}g · C: {meal.carbs_g}g · F: {meal.fat_g}g ·{' '}
                        {meal.portion_desc}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() =>
                        toggleMealPlanItemEaten(activeDayIndex, meal.id)
                      }
                      className="flex-row items-center rounded-xl px-3 py-1.5"
                      style={{
                        backgroundColor: isEaten
                          ? '#059669'
                          : isDark
                          ? '#141718'
                          : '#e2e8f0',
                      }}
                    >
                      {isEaten ? (
                        <>
                          <Check size={13} color="#ffffff" />
                          <Text className="ml-1 text-[11px] font-bold text-white">
                            {t('mealPlan.alreadyEaten')}
                          </Text>
                        </>
                      ) : (
                        <Text className="text-[11px] font-semibold text-stone-700 dark:text-stone-200">
                          {t('mealPlan.markEatenBtn')}
                        </Text>
                      )}
                    </Pressable>
                  </View>

                  {/* Cooking Tip */}
                  {meal.cooking_tip ? (
                    <View className="mt-3 flex-row items-start rounded-2xl bg-stone-50 p-3 dark:bg-[#141718]">
                      <ChefHat size={14} color={isDark ? '#52b788' : '#2d6a4f'} />
                      <Text className="ml-2 flex-1 text-xs text-stone-600 dark:text-stone-300">
                        {meal.cooking_tip}
                      </Text>
                    </View>
                  ) : null}

                  {/* Ingredients */}
                  {meal.ingredients.length > 0 && (
                    <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                      {meal.ingredients.map((ing, idx) => (
                        <View
                          key={idx}
                          className="rounded-lg bg-stone-100 px-2 py-0.5 dark:bg-stone-800"
                        >
                          <Text className="text-[10px] text-stone-600 dark:text-stone-400">
                            {ing}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        /* Grocery List Tab */
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View
            className="rounded-3xl p-5 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="mb-3 flex-row items-center">
              <ShoppingBag size={18} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                {t('mealPlan.groceryTitle')}
              </Text>
            </View>
            <Text className="mb-4 text-xs text-stone-500 dark:text-stone-400">
              {t('mealPlan.grocerySubtitle')}
            </Text>

            <View className="gap-2.5">
              {(weeklyMealPlan?.grocery_list || []).map((item, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center border-b border-stone-100 pb-2.5 last:border-b-0 dark:border-stone-800"
                >
                  <View className="mr-3 h-5 w-5 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/60">
                    <Check size={12} color={isDark ? '#52b788' : '#2d6a4f'} />
                  </View>
                  <Text className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
