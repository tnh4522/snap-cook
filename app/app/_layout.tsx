import '../global.css';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBoundaryProps, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AlertOctagon, RotateCcw } from 'lucide-react-native';
import { ToastProvider } from '@/context/ToastContext';
import { RecipeProvider } from '@/context/RecipeContext';
import { LibraryProvider } from '@/context/LibraryContext';
import { AuthProvider } from '@/context/AuthContext';
import { HealthProvider } from '@/context/HealthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-stone-50 px-6 dark:bg-[#121415]">
      <View className="w-full max-w-sm items-center rounded-3xl border border-rose-200 bg-white p-6 shadow-sm dark:border-rose-900/40 dark:bg-[#1a1d1f]">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40">
          <AlertOctagon size={30} color="#e11d48" />
        </View>
        <Text className="text-center text-xl font-bold text-stone-800 dark:text-stone-100">
          Navigation Error
        </Text>
        <Text className="mt-2 text-center text-sm leading-5 text-stone-500 dark:text-stone-400">
          {error.message || 'An unexpected error occurred in this screen.'}
        </Text>
        <Pressable
          onPress={retry}
          className="mt-6 flex-row items-center rounded-2xl bg-emerald-700 px-6 py-3 active:opacity-85 dark:bg-emerald-600"
        >
          <RotateCcw size={16} color="#ffffff" />
          <Text className="ml-2 text-sm font-bold text-white">Retry Screen</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function NavigationRoot() {
  const { isDark, colors } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipes" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="food-analysis" options={{ headerShown: false }} />
        <Stack.Screen name="meal-planner" options={{ headerShown: false }} />
        <Stack.Screen name="coach" options={{ headerShown: false }} />
        <Stack.Screen name="weekly-report" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <LibraryProvider>
            <AuthProvider>
              <HealthProvider>
                <RecipeProvider>
                  <NavigationRoot />
                </RecipeProvider>
              </HealthProvider>
            </AuthProvider>
          </LibraryProvider>
        </ToastProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
}
