import '../global.css';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertOctagon, RotateCcw } from 'lucide-react-native';
import { ToastProvider } from '@/context/ToastContext';
import { RecipeProvider } from '@/context/RecipeContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-6">
      <View className="w-full max-w-sm items-center rounded-3xl border border-red-500/30 bg-slate-900 p-6">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-red-500/15">
          <AlertOctagon size={32} color="#f87171" />
        </View>
        <Text className="text-center text-xl font-extrabold text-white">
          Navigation Error
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
          {error.message || 'An unexpected error occurred in this screen.'}
        </Text>
        <Pressable
          onPress={retry}
          className="mt-6 flex-row items-center rounded-2xl bg-emerald-500 px-6 py-3 active:opacity-85"
        >
          <RotateCcw size={16} color="#022c22" />
          <Text className="ml-2 text-sm font-bold text-slate-950">Retry Screen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <RecipeProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#020617' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="recipes" options={{ headerShown: false }} />
            <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
          </Stack>
        </RecipeProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}
