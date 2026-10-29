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
    <View className="mt-16 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-8">
      {icon}
      <Text className="mt-4 text-center text-lg font-bold text-white">{title}</Text>
      <Text className="mt-2 text-center text-sm text-slate-400">{message}</Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 active:opacity-85"
        >
          <Text className="text-sm font-bold text-slate-950">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
