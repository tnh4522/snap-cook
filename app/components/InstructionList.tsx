import React from 'react';
import { Text, View } from 'react-native';

interface InstructionListProps {
  instructions: string[];
}

function stripLeadingStepNumber(step: string): string {
  return step.replace(/^(step\s*\d+[:.)\-]?\s*|\d+[:.)\-]\s*)/i, '').trim();
}

export function InstructionList({ instructions }: InstructionListProps) {
  return (
    <View className="space-y-4">
      {instructions.map((rawStep, idx) => {
        const cleanStep = stripLeadingStepNumber(rawStep);
        return (
          <View
            key={`step-${idx}`}
            className="mb-3 flex-row items-start rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
          >
            <View className="mr-3.5 mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
              <Text className="text-xs font-bold text-emerald-400">{idx + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Step {idx + 1}
              </Text>
              <Text className="text-base leading-6 text-slate-100">{cleanStep}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
