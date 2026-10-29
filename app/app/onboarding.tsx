import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  Check,
  Flame,
  Scale,
  Target,
  Utensils,
} from 'lucide-react-native';
import {
  ActivityLevel,
  DietStyle,
  Gender,
  HealthGoal,
  UserHealthProfile,
} from '@/types/health';
import { calculateHealthMetrics } from '@/utils/health';
import { useHealth } from '@/context/HealthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

const ACTIVITY_OPTIONS: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

const GOAL_OPTIONS: HealthGoal[] = ['lose_weight', 'maintain', 'gain_muscle'];

const DIET_STYLE_OPTIONS: DietStyle[] = [
  'eat_clean',
  'balanced',
  'high_protein',
  'low_carb',
  'keto',
  'vegetarian',
  'vegan',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, updateHealthProfile } = useHealth();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [gender, setGender] = useState<Gender>(profile.gender);
  const [age, setAge] = useState(String(profile.age));
  const [heightCm, setHeightCm] = useState(String(profile.height_cm));
  const [currentWeight, setCurrentWeight] = useState(String(profile.current_weight_kg));
  const [targetWeight, setTargetWeight] = useState(String(profile.target_weight_kg));
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activity_level);
  const [mainGoal, setMainGoal] = useState<HealthGoal>(profile.main_goal);
  const [dietStyle, setDietStyle] = useState<DietStyle>(profile.diet_style);

  const draftProfile = useMemo<UserHealthProfile>(() => {
    const parsedAge = Math.min(110, Math.max(12, parseInt(age, 10) || 25));
    const parsedHeight = Math.min(240, Math.max(100, parseFloat(heightCm) || 165));
    const parsedCurrentW = Math.min(250, Math.max(25, parseFloat(currentWeight) || 60));
    const parsedTargetW = Math.min(250, Math.max(25, parseFloat(targetWeight) || 55));
    return {
      gender,
      age: parsedAge,
      height_cm: parsedHeight,
      current_weight_kg: parsedCurrentW,
      target_weight_kg: parsedTargetW,
      activity_level: activityLevel,
      main_goal: mainGoal,
      diet_style: dietStyle,
    };
  }, [gender, age, heightCm, currentWeight, targetWeight, activityLevel, mainGoal, dietStyle]);

  const previewMetrics = useMemo(
    () => calculateHealthMetrics(draftProfile),
    [draftProfile]
  );

  const handleSave = async () => {
    await updateHealthProfile(draftProfile);
    showToast(
      t('onboarding.profileSavedTitle'),
      t('onboarding.profileSavedDesc', {
        calories: previewMetrics.daily_calorie_target,
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
        <View className="flex-row items-center py-4">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              {t('onboarding.title')}
            </Text>
            <Text className="text-xs text-stone-500 dark:text-stone-400">
              {t('onboarding.subtitle')}
            </Text>
          </View>
        </View>

        {/* Live Calculated Preview Banner */}
        <View className="mb-5 rounded-3xl border border-emerald-600/25 bg-emerald-900 p-5 shadow-sm dark:border-emerald-500/30 dark:bg-[#14291e]">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Flame size={18} color="#86efac" />
              <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-emerald-200">
                {t('onboarding.previewTitle')}
              </Text>
            </View>
            <View className="rounded-full bg-emerald-800/90 px-2.5 py-1">
              <Text className="text-[11px] font-bold text-emerald-200">
                BMI {previewMetrics.bmi}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row items-baseline justify-between">
            <View>
              <Text className="text-3xl font-extrabold text-white">
                {previewMetrics.daily_calorie_target}{' '}
                <Text className="text-sm font-semibold text-emerald-200">kcal/ngày</Text>
              </Text>
              <Text className="mt-0.5 text-xs text-emerald-200/80">
                BMR: {previewMetrics.bmr} kcal · TDEE: {previewMetrics.tdee} kcal
              </Text>
            </View>
          </View>

          {/* Macro split pills */}
          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white/10 p-2.5">
              <Text className="text-[10px] font-medium text-emerald-200">Protein</Text>
              <Text className="text-sm font-bold text-white">
                {previewMetrics.macros.protein_g}g ({previewMetrics.macros.protein_pct}%)
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/10 p-2.5">
              <Text className="text-[10px] font-medium text-emerald-200">Carbs</Text>
              <Text className="text-sm font-bold text-white">
                {previewMetrics.macros.carbs_g}g ({previewMetrics.macros.carbs_pct}%)
              </Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/10 p-2.5">
              <Text className="text-[10px] font-medium text-emerald-200">Fat</Text>
              <Text className="text-sm font-bold text-white">
                {previewMetrics.macros.fat_g}g ({previewMetrics.macros.fat_pct}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Gender & Age */}
        <View
          className="mb-5 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center">
            <Scale size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
            <Text className="ml-2 text-sm font-bold text-stone-800 dark:text-stone-100">
              {t('onboarding.genderLabel')}
            </Text>
          </View>

          <View className="mb-4 flex-row gap-3">
            {(['female', 'male'] as Gender[]).map((g) => {
              const active = gender === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  className="flex-1 items-center rounded-2xl py-3"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#eaf4ee'
                      : isDark
                      ? '#141718'
                      : '#f8fafc',
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
                    style={{
                      color: active
                        ? isDark
                          ? '#86efac'
                          : '#1b4332'
                        : colors.textSecondary,
                    }}
                  >
                    {g === 'male' ? t('onboarding.male') : t('onboarding.female')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Numeric Inputs Grid */}
          <View className="flex-row flex-wrap gap-3">
            <View className="min-w-[45%] flex-1">
              <Text className="mb-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t('onboarding.ageLabel')}
              </Text>
              <TextInput
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
              />
            </View>
            <View className="min-w-[45%] flex-1">
              <Text className="mb-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t('onboarding.heightLabel')}
              </Text>
              <TextInput
                value={heightCm}
                onChangeText={setHeightCm}
                keyboardType="numeric"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
              />
            </View>
            <View className="min-w-[45%] flex-1">
              <Text className="mb-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t('onboarding.currentWeightLabel')}
              </Text>
              <TextInput
                value={currentWeight}
                onChangeText={setCurrentWeight}
                keyboardType="numeric"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
              />
            </View>
            <View className="min-w-[45%] flex-1">
              <Text className="mb-1 text-xs font-semibold text-stone-500 dark:text-stone-400">
                {t('onboarding.targetWeightLabel')}
              </Text>
              <TextInput
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                className="rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
              />
            </View>
          </View>
        </View>

        {/* Primary Goal */}
        <View
          className="mb-5 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center">
            <Target size={17} color={isDark ? '#f59e0b' : '#d97706'} />
            <Text className="ml-2 text-sm font-bold text-stone-800 dark:text-stone-100">
              {t('onboarding.goalLabel')}
            </Text>
          </View>
          <View className="gap-2">
            {GOAL_OPTIONS.map((g) => {
              const active = mainGoal === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => setMainGoal(g)}
                  className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#eaf4ee'
                      : isDark
                      ? '#141718'
                      : '#f8fafc',
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
                    style={{
                      color: active
                        ? isDark
                          ? '#86efac'
                          : '#1b4332'
                        : colors.textSecondary,
                    }}
                  >
                    {t(`onboarding.goal_${g}` as any)}
                  </Text>
                  {active && <Check size={16} color={isDark ? '#52b788' : '#2d6a4f'} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Activity Level */}
        <View
          className="mb-5 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center">
            <Activity size={17} color={isDark ? '#60a5fa' : '#2563eb'} />
            <Text className="ml-2 text-sm font-bold text-stone-800 dark:text-stone-100">
              {t('onboarding.activityLabel')}
            </Text>
          </View>
          <View className="gap-2">
            {ACTIVITY_OPTIONS.map((act) => {
              const active = activityLevel === act;
              return (
                <Pressable
                  key={act}
                  onPress={() => setActivityLevel(act)}
                  className="flex-row items-center justify-between rounded-2xl px-4 py-3"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#eaf4ee'
                      : isDark
                      ? '#141718'
                      : '#f8fafc',
                    borderWidth: 1,
                    borderColor: active
                      ? isDark
                        ? '#29543d'
                        : '#2d6a4f'
                      : colors.border,
                  }}
                >
                  <Text
                    className="flex-1 text-xs font-semibold"
                    style={{
                      color: active
                        ? isDark
                          ? '#86efac'
                          : '#1b4332'
                        : colors.textSecondary,
                    }}
                  >
                    {t(`onboarding.activity_${act}` as any)}
                  </Text>
                  {active && <Check size={16} color={isDark ? '#52b788' : '#2d6a4f'} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Diet Style */}
        <View
          className="mb-6 rounded-3xl p-5"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center">
            <Utensils size={17} color={isDark ? '#c084fc' : '#7c3aed'} />
            <Text className="ml-2 text-sm font-bold text-stone-800 dark:text-stone-100">
              {t('onboarding.dietStyleLabel')}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {DIET_STYLE_OPTIONS.map((ds) => {
              const active = dietStyle === ds;
              return (
                <Pressable
                  key={ds}
                  onPress={() => setDietStyle(ds)}
                  className="flex-row items-center rounded-2xl px-3.5 py-2.5"
                  style={{
                    backgroundColor: active
                      ? isDark
                        ? '#193325'
                        : '#eaf4ee'
                      : isDark
                      ? '#141718'
                      : '#f8fafc',
                    borderWidth: 1,
                    borderColor: active
                      ? isDark
                        ? '#29543d'
                        : '#2d6a4f'
                      : colors.border,
                  }}
                >
                  {active && <Check size={13} color={isDark ? '#52b788' : '#2d6a4f'} />}
                  <Text
                    className="text-xs font-semibold"
                    style={{
                      marginLeft: active ? 5 : 0,
                      color: active
                        ? isDark
                          ? '#86efac'
                          : '#1b4332'
                        : colors.textSecondary,
                    }}
                  >
                    {t(`onboarding.diet_${ds}` as any)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          className="items-center justify-center rounded-2xl bg-emerald-700 py-4 shadow-sm active:opacity-85 dark:bg-emerald-600"
        >
          <Text className="text-sm font-bold text-white">
            {t('onboarding.saveProfileBtn')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
