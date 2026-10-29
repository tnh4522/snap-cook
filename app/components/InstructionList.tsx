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

  return (
    <View>
      {instructions.map((rawStep, idx) => {
        const cleanStep = stripLeadingStepNumber(rawStep);
        const done = completedSteps?.has(idx) ?? false;
        return (
          <Pressable
            key={`step-${idx}`}
            disabled={!onToggleStep}
            onPress={() => onToggleStep?.(idx)}
            accessibilityRole={onToggleStep ? 'checkbox' : undefined}
            accessibilityState={onToggleStep ? { checked: done } : undefined}
            className={`mb-3 flex-row items-start rounded-2xl border p-4 active:opacity-80 ${
              done
                ? 'border-emerald-600/30 bg-emerald-50/70 dark:border-emerald-700/30 dark:bg-emerald-950/30'
                : 'border-stone-200/90 bg-white shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]'
            }`}
          >
            <View
              className={`mr-3.5 mt-0.5 h-6 w-6 items-center justify-center rounded-full ${
                done
                  ? 'bg-emerald-700 dark:bg-emerald-600'
                  : 'bg-stone-100 dark:bg-stone-800'
              }`}
            >
              {done ? (
                <Check size={13} color="#ffffff" strokeWidth={2.5} />
              ) : (
                <Text className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
                  {idx + 1}
                </Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                {t('recipeDetail.stepPrefix', { num: idx + 1 })}
                {done ? t('recipeDetail.doneSuffix') : ''}
              </Text>
              <Text
                className={`text-xs leading-5 ${
                  done
                    ? 'text-stone-400 line-through dark:text-stone-500'
                    : 'text-stone-800 dark:text-stone-100'
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
