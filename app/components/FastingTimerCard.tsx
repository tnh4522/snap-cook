import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Clock, Play, Square, Timer } from 'lucide-react-native';
import { FastingProtocol } from '@/types/health';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

const PROTOCOLS: FastingProtocol[] = ['14_10', '16_8', '18_6'];

export function FastingTimerCard() {
  const { fastingState, startFasting, stopFasting, updateFastingProtocol } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!fastingState.isActive) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [fastingState.isActive]);

  let elapsedHours = 0;
  let elapsedMinutes = 0;
  let remainingHours = 0;
  let remainingMinutes = 0;
  let progressPct = 0;

  if (fastingState.isActive && fastingState.startTime && fastingState.targetEndTime) {
    const elapsedMs = Math.max(0, now - fastingState.startTime);
    const totalMs = Math.max(1, fastingState.targetEndTime - fastingState.startTime);
    const remainingMs = Math.max(0, fastingState.targetEndTime - now);

    elapsedHours = Math.floor(elapsedMs / 3600000);
    elapsedMinutes = Math.floor((elapsedMs % 3600000) / 60000);

    remainingHours = Math.floor(remainingMs / 3600000);
    remainingMinutes = Math.floor((remainingMs % 3600000) / 60000);

    progressPct = Math.min(100, Math.round((elapsedMs / totalMs) * 100));
  }

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
          <View className="h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60">
            <Timer size={18} color="#6366f1" />
          </View>
          <View className="ml-2.5">
            <Text className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {t('fasting.title')}
            </Text>
            <Text className="text-[11px] text-stone-500 dark:text-stone-400">
              {fastingState.isActive
                ? t('fasting.statusFasting')
                : t('fasting.statusEating')}
            </Text>
          </View>
        </View>

        <View className="rounded-full bg-indigo-50 px-2.5 py-1 dark:bg-indigo-950/60">
          <Text className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
            {fastingState.protocol.replace('_', ':')}
          </Text>
        </View>
      </View>

      {/* Protocol Selection (when not active) */}
      {!fastingState.isActive && (
        <View className="mt-3.5 flex-row gap-2">
          {PROTOCOLS.map((p) => {
            const active = fastingState.protocol === p;
            return (
              <Pressable
                key={p}
                onPress={() => updateFastingProtocol(p)}
                className="flex-1 items-center rounded-xl py-2"
                style={{
                  backgroundColor: active
                    ? isDark
                      ? '#312e81'
                      : '#e0e7ff'
                    : isDark
                    ? '#141718'
                    : '#f1f5f9',
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active ? '#4f46e5' : colors.textSecondary,
                  }}
                >
                  {p.replace('_', ':')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Active Fasting Live Banner */}
      {fastingState.isActive ? (
        <View className="mt-4">
          <View className="flex-row items-baseline justify-between">
            <View>
              <Text className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {elapsedHours}h {elapsedMinutes}m
              </Text>
              <Text className="text-[11px] text-stone-500">
                {t('fasting.elapsed')} · {t('fasting.remaining')}: {remainingHours}h {remainingMinutes}m
              </Text>
            </View>
            <Text className="text-sm font-extrabold text-indigo-600">{progressPct}%</Text>
          </View>

          <View
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: isDark ? '#1e1b4b' : '#e0e7ff' }}
          >
            <View
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${progressPct}%` }}
            />
          </View>

          <Pressable
            onPress={stopFasting}
            className="mt-4 flex-row items-center justify-center rounded-2xl bg-stone-100 py-3 active:opacity-80 dark:bg-stone-800"
          >
            <Square size={14} color={isDark ? '#f43f5e' : '#be123c'} />
            <Text className="ml-2 text-xs font-bold text-rose-700 dark:text-rose-400">
              {t('fasting.endBtn')}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => startFasting()}
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-indigo-600 py-3 active:opacity-85"
        >
          <Play size={14} color="#ffffff" fill="#ffffff" />
          <Text className="ml-2 text-xs font-bold text-white">
            {t('fasting.startBtn')} ({fastingState.targetFastingHours}h)
          </Text>
        </Pressable>
      )}
    </View>
  );
}
