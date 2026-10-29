import React, { useEffect } from 'react';
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
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  Flame,
  Lightbulb,
  RotateCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

export default function WeeklyReportScreen() {
  const router = useRouter();
  const {
    weeklyReport,
    isGeneratingReport,
    refreshWeeklyReport,
    profile,
    metrics,
  } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  useEffect(() => {
    if (!weeklyReport) {
      refreshWeeklyReport();
    }
  }, [weeklyReport, refreshWeeklyReport]);

  const score = weeklyReport?.adherence_score ?? 80;
  const getScoreColor = (val: number) => {
    if (val >= 80) return isDark ? '#4ade80' : '#16a34a';
    if (val >= 65) return isDark ? '#38bdf8' : '#0284c7';
    if (val >= 50) return isDark ? '#facc15' : '#d97706';
    return isDark ? '#f87171' : '#dc2626';
  };

  const getScoreGrade = (val: number) => {
    if (val >= 85) return 'Xuất Sắc (Excellent)';
    if (val >= 70) return 'Tốt (Good Progress)';
    if (val >= 50) return 'Khá (Fair / Steady)';
    return 'Cần Cải Thiện (Needs Focus)';
  };

  const deficit = weeklyReport?.total_deficit_surplus_kcal ?? 0;
  const isDeficit = deficit >= 0;

  return (
    <SafeAreaView
      className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]"
      edges={['top', 'left', 'right']}
    >
      {/* Top Navigation Bar */}
      <View
        className="flex-row items-center justify-between border-b px-5 py-3.5 shadow-sm"
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
        </Pressable>

        <View className="flex-1 px-3">
          <Text className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            {t('weeklyReport.title')}
          </Text>
          <Text className="text-[11px] text-stone-500 dark:text-stone-400">
            {t(`onboarding.goal_${profile.main_goal}` as any)} · Chu kỳ 7 ngày gần nhất
          </Text>
        </View>

        <Pressable
          onPress={() => refreshWeeklyReport()}
          disabled={isGeneratingReport}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          {isGeneratingReport ? (
            <ActivityIndicator size="small" color={isDark ? '#52b788' : '#2d6a4f'} />
          ) : (
            <RotateCw size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Adherence Score Card */}
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
              <Award size={20} color={getScoreColor(score)} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                {t('weeklyReport.adherenceScore')}
              </Text>
            </View>
            <View
              className="rounded-full px-2.5 py-0.5"
              style={{ backgroundColor: `${getScoreColor(score)}20` }}
            >
              <Text
                className="text-[11px] font-extrabold"
                style={{ color: getScoreColor(score) }}
              >
                {getScoreGrade(score)}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row items-baseline">
            <Text
              className="text-4xl font-black"
              style={{ color: getScoreColor(score) }}
            >
              {score}
            </Text>
            <Text className="ml-1.5 text-base font-bold text-stone-400 dark:text-stone-500">
              / 100
            </Text>
          </View>

          <View
            className="mt-3.5 h-3 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: isDark ? '#24292b' : '#e2e8f0' }}
          >
            <View
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, score))}%`,
                backgroundColor: getScoreColor(score),
              }}
            />
          </View>
        </View>

        {/* Core Progress Metrics Grid */}
        <View className="mb-5 flex-row gap-3">
          {/* Caloric Deficit / Surplus Card */}
          <View
            className="flex-1 rounded-3xl p-4 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center">
              {isDeficit ? (
                <TrendingDown size={16} color="#10b981" />
              ) : (
                <TrendingUp size={16} color="#f59e0b" />
              )}
              <Text className="ml-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {t('weeklyReport.deficitCardTitle')}
              </Text>
            </View>
            <Text className="mt-2 text-lg font-extrabold text-stone-900 dark:text-stone-100">
              {deficit > 0 ? `+${deficit}` : deficit}
              <Text className="text-xs font-semibold text-stone-400"> kcal</Text>
            </Text>
            <Text className="mt-0.5 text-[10px] text-stone-400">
              {isDeficit ? 'Thâm hụt năng lượng' : 'Dư thừa năng lượng'}
            </Text>
          </View>

          {/* Estimated Fat Loss Card */}
          <View
            className="flex-1 rounded-3xl p-4 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center">
              <Scale size={16} color="#0ea5e9" />
              <Text className="ml-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {t('weeklyReport.estFatLoss')}
              </Text>
            </View>
            <Text className="mt-2 text-lg font-extrabold text-stone-900 dark:text-stone-100">
              {weeklyReport ? Math.abs(weeklyReport.est_fat_change_kg) : 0}
              <Text className="text-xs font-semibold text-stone-400"> kg mỡ</Text>
            </Text>
            <Text className="mt-0.5 text-[10px] text-stone-400">
              Dựa trên mốc 7,700 kcal / 1kg
            </Text>
          </View>
        </View>

        {/* Daily Averages */}
        <View className="mb-5 flex-row gap-3">
          <View
            className="flex-1 rounded-3xl p-4 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center">
              <Flame size={16} color="#ea580c" />
              <Text className="ml-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {t('weeklyReport.avgDailyIntake')}
              </Text>
            </View>
            <Text className="mt-2 text-lg font-extrabold text-stone-900 dark:text-stone-100">
              {weeklyReport?.avg_daily_calories ?? 0}
              <Text className="text-xs font-semibold text-stone-400"> kcal/ngày</Text>
            </Text>
            <Text className="mt-0.5 text-[10px] text-stone-400">
              Mục tiêu: {metrics.daily_calorie_target} kcal
            </Text>
          </View>

          <View
            className="flex-1 rounded-3xl p-4 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row items-center">
              <Sparkles size={16} color="#f43f5e" />
              <Text className="ml-1.5 text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {t('weeklyReport.avgDailyProtein')}
              </Text>
            </View>
            <Text className="mt-2 text-lg font-extrabold text-stone-900 dark:text-stone-100">
              {weeklyReport?.avg_protein_g ?? 0}
              <Text className="text-xs font-semibold text-stone-400"> g/ngày</Text>
            </Text>
            <Text className="mt-0.5 text-[10px] text-stone-400">
              Chuẩn: {metrics.macros.protein_g}g
            </Text>
          </View>
        </View>

        {/* AI Executive Summary Card */}
        <View
          className="mb-5 rounded-3xl border border-emerald-600/25 bg-emerald-900/10 p-5 shadow-sm dark:bg-[#14291e]"
        >
          <View className="flex-row items-center">
            <Sparkles size={17} color={isDark ? '#4ade80' : '#059669'} />
            <Text className="ml-2 text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              Nhận Xét Chuyên Môn Của AI Coach
            </Text>
          </View>
          <Text className="mt-3 text-xs leading-6 text-stone-800 dark:text-stone-200">
            {weeklyReport?.summary_text ||
              'Đang tổng hợp dữ liệu dinh dưỡng và chỉ số tập luyện của bạn trong tuần...'}
          </Text>
        </View>

        {/* AI Recommendations List */}
        <View
          className="mb-5 rounded-3xl p-5 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3.5 flex-row items-center">
            <Lightbulb size={18} color="#f59e0b" />
            <Text className="ml-2 text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('weeklyReport.recsTitle')}
            </Text>
          </View>

          <View className="gap-2.5">
            {weeklyReport?.recommendations?.map((rec, index) => (
              <View key={index} className="flex-row items-start">
                <View className="mr-2.5 mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60">
                  <Text className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-xs leading-5 text-stone-700 dark:text-stone-300">
                  {rec}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Guardrails & Alerts */}
        <View
          className="rounded-3xl p-5 shadow-sm"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View className="mb-3 flex-row items-center">
            <ShieldCheck size={18} color={isDark ? '#4ade80' : '#059669'} />
            <Text className="ml-2 text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('weeklyReport.safetyTitle')}
            </Text>
          </View>

          {weeklyReport?.safety_alerts && weeklyReport.safety_alerts.length > 0 ? (
            <View className="gap-2">
              {weeklyReport.safety_alerts.map((alert, i) => (
                <View
                  key={i}
                  className="flex-row items-center rounded-2xl bg-amber-50 p-3 dark:bg-amber-950/40"
                >
                  <AlertTriangle size={16} color="#d97706" />
                  <Text className="ml-2 flex-1 text-xs font-semibold text-amber-800 dark:text-amber-200">
                    {alert}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-row items-center rounded-2xl bg-emerald-50 p-3.5 dark:bg-emerald-950/40">
              <CheckCircle2 size={18} color={isDark ? '#4ade80' : '#16a34a'} />
              <Text className="ml-2.5 flex-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Tất cả chỉ số dinh dưỡng và calo đều nằm trong giới hạn an toàn khoa học theo khuyến nghị WHO & Viện Dinh Dưỡng.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
