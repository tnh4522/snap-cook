import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { stripLeadingStepNumber } from '@/utils/recipe';

interface InstructionListProps {
  instructions: string[];
  /** Indices of steps the user marked as done. When provided, steps become tappable. */
  completedSteps?: Set<number>;
  onToggleStep?: (index: number) => void;
}

export function InstructionList({ instructions, completedSteps, onToggleStep }: InstructionListProps) {
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
              done ? 'border-emerald-500/40 bg-emerald-950/40' : 'border-slate-800 bg-slate-900/80'
            }`}
          >
            <View
              className={`mr-3.5 mt-0.5 h-7 w-7 items-center justify-center rounded-full ${
                done ? 'bg-emerald-500' : 'bg-emerald-500/20'
              }`}
            >
              {done ? (
                <Check size={14} color="#022c22" />
              ) : (
                <Text className="text-xs font-bold text-emerald-400">{idx + 1}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step {idx + 1}
                {done ? ' · Done' : ''}
              </Text>
              <Text
                className={`text-base leading-6 ${done ? 'text-slate-400 line-through' : 'text-slate-100'}`}
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
