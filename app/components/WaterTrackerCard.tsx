import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, Droplets, Plus, RotateCcw } from 'lucide-react-native';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

export function WaterTrackerCard() {
  const { todayWaterMl, dailyWaterTargetMl, addWater, resetTodayWater } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const pct = Math.min(
    100,
    Math.round((todayWaterMl / Math.max(1, dailyWaterTargetMl)) * 100)
  );
  const isGoalReached = todayWaterMl >= dailyWaterTargetMl;

  return (
    <View
      className="mb-5 rounded-3xl p-5 shadow-sm"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60">
            <Droplets size={18} color="#0284c7" />
          </View>
          <View className="ml-2.5">
            <Text className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('water.title')}
            </Text>
            <Text className="text-[11px] text-stone-500 dark:text-stone-400">
              {t('water.consumedLabel')}: {todayWaterMl} / {dailyWaterTargetMl} ml
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Text className="text-sm font-extrabold text-sky-600 dark:text-sky-400">
            {pct}%
          </Text>
          {isGoalReached && (
            <View className="h-5 w-5 items-center justify-center rounded-full bg-sky-500">
              <Check size={12} color="#ffffff" />
            </View>
          )}
        </View>
      </View>

      {/* Progress Bar */}
      <View
        className="mt-3.5 h-3 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }}
      >
        <View
          className="h-full rounded-full bg-sky-500"
          style={{ width: `${pct}%` }}
        />
      </View>

      {isGoalReached && (
        <Text className="mt-2 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
          {t('water.congratsGoal')}
        </Text>
      )}

      {/* Quick Add Buttons */}
      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={() => addWater(250)}
          className="flex-1 flex-row items-center justify-center rounded-2xl bg-sky-50 py-2.5 active:opacity-75 dark:bg-sky-950/40"
        >
          <Plus size={14} color="#0284c7" />
          <Text className="ml-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
            {t('water.add250')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => addWater(500)}
          className="flex-1 flex-row items-center justify-center rounded-2xl bg-sky-50 py-2.5 active:opacity-75 dark:bg-sky-950/40"
        >
          <Plus size={14} color="#0284c7" />
          <Text className="ml-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
            {t('water.add500')}
          </Text>
        </Pressable>

        {todayWaterMl > 0 && (
          <Pressable
            onPress={resetTodayWater}
            accessibilityLabel={t('water.resetBtn')}
            className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 active:opacity-75 dark:border-stone-800"
          >
            <RotateCcw size={15} color={isDark ? '#9ca9a1' : '#64748b'} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
