import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Dumbbell, Flame, X } from 'lucide-react-native';
import { ExerciseType, WorkoutIntensity } from '@/types/health';
import { calculateWorkoutCalories, EXERCISE_METAS } from '@/utils/workout';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface LogWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
}

const DURATION_PRESETS = [15, 30, 45, 60];
const INTENSITY_OPTIONS: WorkoutIntensity[] = ['low', 'moderate', 'high'];

export function LogWorkoutModal({ visible, onClose }: LogWorkoutModalProps) {
  const { latestWeight, logWorkout } = useHealth();
  const { isDark, colors } = useTheme();
  const { t, language } = useI18n();

  const [exerciseType, setExerciseType] = useState<ExerciseType>('running');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<WorkoutIntensity>('moderate');

  const exerciseKeys = useMemo(
    () => Object.keys(EXERCISE_METAS) as ExerciseType[],
    []
  );

  const durationMin = Math.max(1, parseInt(duration, 10) || 30);

  const estCalories = useMemo(() => {
    return calculateWorkoutCalories(
      exerciseType,
      durationMin,
      latestWeight,
      intensity
    );
  }, [exerciseType, durationMin, latestWeight, intensity]);

  const handleSave = () => {
    logWorkout(exerciseType, durationMin, intensity);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <View
            className="max-h-[85%] w-full max-w-sm rounded-3xl p-5 shadow-2xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-950/60">
                  <Dumbbell size={20} color={isDark ? '#fb923c' : '#ea580c'} />
                </View>
                <Text className="ml-2.5 text-base font-bold text-stone-900 dark:text-stone-100">
                  {t('workout.logModalTitle')}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                className="h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800"
              >
                <X size={18} color={isDark ? '#9ca9a1' : '#64748b'} />
              </Pressable>
            </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Live Burn Banner */}
            <View className="mt-2 flex-row items-center justify-between rounded-2xl bg-orange-500/15 p-3.5 dark:bg-orange-950/40">
              <View className="flex-row items-center">
                <Flame size={20} color="#ea580c" />
                <Text className="ml-2 text-xs font-bold text-orange-800 dark:text-orange-200">
                  {t('workout.estBurn', { calories: estCalories })}
                </Text>
              </View>
              <Text className="text-lg font-extrabold text-orange-600 dark:text-orange-400">
                +{estCalories} kcal
              </Text>
            </View>

            {/* Exercise Selector */}
            <Text className="mb-2 mt-4 text-xs font-bold text-stone-700 dark:text-stone-300">
              {t('workout.exerciseLabel')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {exerciseKeys.map((key) => {
                const meta = EXERCISE_METAS[key];
                const active = exerciseType === key;
                const name = language === 'vi' ? meta.name_vi : meta.name_en;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setExerciseType(key)}
                    className="rounded-xl px-3 py-2"
                    style={{
                      backgroundColor: active
                        ? isDark
                          ? '#7c2d12'
                          : '#ffedd5'
                        : isDark
                        ? '#141718'
                        : '#f1f5f9',
                      borderWidth: 1,
                      borderColor: active ? '#ea580c' : colors.border,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{
                        color: active
                          ? isDark
                            ? '#fed7aa'
                            : '#9a3412'
                          : colors.textSecondary,
                      }}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Duration Input & Presets */}
            <Text className="mb-2 mt-4 text-xs font-bold text-stone-700 dark:text-stone-300">
              {t('workout.durationLabel')}
            </Text>
            <View className="flex-row gap-2">
              {DURATION_PRESETS.map((p) => {
                const active = duration === String(p);
                return (
                  <Pressable
                    key={p}
                    onPress={() => setDuration(String(p))}
                    className="flex-1 items-center rounded-xl py-2"
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
                      {p}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              className="mt-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
              placeholder="Duration in minutes..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            />

            {/* Intensity Selector */}
            <Text className="mb-2 mt-4 text-xs font-bold text-stone-700 dark:text-stone-300">
              {t('workout.intensityLabel')}
            </Text>
            <View className="flex-row gap-2">
              {INTENSITY_OPTIONS.map((opt) => {
                const active = intensity === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setIntensity(opt)}
                    className="flex-1 items-center rounded-xl py-2"
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
                      {t(`workout.intensity_${opt}` as any)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="mt-6 items-center justify-center rounded-2xl bg-orange-600 py-3.5 shadow-sm active:opacity-85"
            >
              <Text className="text-sm font-bold text-white">
                {t('workout.saveBtn', { calories: estCalories })}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>
);
}
