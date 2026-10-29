import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { stripLeadingStepNumber } from '@/utils/recipe';
import { useI18n } from '@/i18n';

interface InstructionListProps {
  instructions: string[];
  /** Indices of steps the user marked as done. When provided, steps become tappable. */
  completedSteps?: Set<number>;
  onToggleStep?: (index: number) => void;
}

export function InstructionList({ instructions, completedSteps, onToggleStep }: InstructionListProps) {
  const { t } = useI18n();
  const activeStepIndex = instructions.findIndex((_, idx) => !completedSteps?.has(idx));

  return (
    <View>
      {instructions.map((rawStep, idx) => {
        const cleanStep = stripLeadingStepNumber(rawStep);
        const isDone = completedSteps?.has(idx) ?? false;
        const isCurrent = !isDone && idx === activeStepIndex;

        const containerStyle = isDone
          ? 'border-emerald-600/30 bg-emerald-50/50 dark:border-emerald-800/30 dark:bg-emerald-950/20'
          : isCurrent
            ? 'border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:bg-[#1a1d1f]'
            : 'border-stone-200/90 bg-white shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]';

        return (
          <Pressable
            key={`step-${idx}`}
            disabled={!onToggleStep}
            onPress={() => onToggleStep?.(idx)}
            hitSlop={6}
            accessibilityRole={onToggleStep ? 'checkbox' : undefined}
            accessibilityState={onToggleStep ? { checked: isDone } : undefined}
            accessibilityLabel={`${t('recipeDetail.stepPrefix', { num: idx + 1 })}: ${cleanStep}. ${
              isDone ? 'Done' : isCurrent ? 'Current' : 'Upcoming'
            }`}
            className={`mb-3 flex-row items-start rounded-2xl border p-4 active:opacity-80 ${containerStyle}`}
          >
            <View
              className={`mr-3.5 mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
                isDone
                  ? 'bg-emerald-700 dark:bg-emerald-600'
                  : isCurrent
                    ? 'bg-emerald-700 dark:bg-emerald-500'
                    : 'bg-stone-100 dark:bg-stone-800'
              }`}
            >
              {isDone ? (
                <Check size={13} color="#ffffff" strokeWidth={2.5} />
              ) : (
                <Text
                  className={`text-[11px] font-bold ${
                    isCurrent
                      ? 'text-white'
                      : 'text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {idx + 1}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Text
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDone
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-emerald-800 dark:text-emerald-300'
                        : 'text-stone-400 dark:text-stone-500'
                  }`}
                >
                  {t('recipeDetail.stepPrefix', { num: idx + 1 })}
                  {isDone ? t('recipeDetail.doneSuffix') : ''}
                </Text>
                {isCurrent && (
                  <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/70">
                    <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      {t('recipeDetail.currentStepBadge')}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className={`text-sm leading-6 ${
                  isDone
                    ? 'text-stone-400 line-through dark:text-stone-500'
                    : isCurrent
                      ? 'font-medium text-stone-900 dark:text-stone-100'
                      : 'text-stone-800 dark:text-stone-200'
                }`}
              >
                {cleanStep}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
