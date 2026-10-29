import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, WifiOff, X } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

export type ToastType = 'error' | 'warning' | 'success' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

interface ToastBannerProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
  const { isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 16,
        stiffness: 140,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onDismiss());
    }, 4500);

    return () => clearTimeout(timer);
  }, [toast, translateY, opacity, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isWarning = toast.type === 'warning';
  const isSuccess = toast.type === 'success';

  const containerStyle = isError
    ? 'border-rose-200 bg-white dark:border-rose-900/60 dark:bg-[#251518]'
    : isWarning
      ? 'border-amber-200 bg-white dark:border-amber-900/60 dark:bg-[#2b1f14]'
      : isSuccess
        ? 'border-emerald-200 bg-white dark:border-emerald-800/60 dark:bg-[#16271e]'
        : 'border-stone-200 bg-white dark:border-stone-700/60 dark:bg-[#1e2325]';

  const titleColor = isError
    ? 'text-rose-900 dark:text-rose-200'
    : isWarning
      ? 'text-amber-900 dark:text-amber-200'
      : isSuccess
        ? 'text-emerald-950 dark:text-emerald-200'
        : 'text-stone-900 dark:text-stone-100';

  const descColor = isError
    ? 'text-rose-700 dark:text-rose-300'
    : isWarning
      ? 'text-amber-700 dark:text-amber-300'
      : isSuccess
        ? 'text-emerald-800 dark:text-emerald-300'
        : 'text-stone-500 dark:text-stone-400';

  const renderIcon = () => {
    if (isError) return <WifiOff size={18} color={isDark ? '#fb7185' : '#e11d48'} />;
    if (isWarning) return <AlertTriangle size={18} color={isDark ? '#fbbf24' : '#d97706'} />;
    if (isSuccess) return <CheckCircle2 size={18} color={isDark ? '#52b788' : '#2d6a4f'} />;
    return <Info size={18} color={isDark ? '#60a5fa' : '#2563eb'} />;
  };

  return (
    <Animated.View
      style={{ transform: [{ translateY }], opacity }}
      className="absolute left-4 right-4 top-14 z-50"
    >
      <View
        className={`flex-row items-start rounded-2xl border p-3.5 shadow-lg ${containerStyle}`}
      >
        <View className="mt-0.5">{renderIcon()}</View>
        <View className="ml-3 flex-1 pr-2">
          <Text className={`text-xs font-bold ${titleColor}`}>{toast.title}</Text>
          <Text className={`mt-0.5 text-[11px] leading-4 ${descColor}`}>
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          className="h-6 w-6 items-center justify-center rounded-full bg-stone-100 active:opacity-70 dark:bg-white/10"
        >
          <X size={13} color={isDark ? '#edf2ee' : '#64748b'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
