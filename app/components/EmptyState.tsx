import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="mt-12 items-center justify-center rounded-3xl border border-stone-200/90 bg-white p-7 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
      <View className="mb-3.5 h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800/70">
        {icon}
      </View>
      <Text className="text-center text-base font-bold text-stone-800 dark:text-stone-100">{title}</Text>
      <Text className="mt-1.5 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-5 rounded-2xl bg-emerald-700 px-5 py-2.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
        >
          <Text className="text-xs font-bold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
