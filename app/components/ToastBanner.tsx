import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, Info, WifiOff, X } from 'lucide-react-native';

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
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 15,
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
    ? 'border-red-500/50 bg-red-950/95'
    : isWarning
      ? 'border-amber-500/50 bg-amber-950/95'
      : isSuccess
        ? 'border-emerald-500/50 bg-emerald-950/95'
        : 'border-slate-700 bg-slate-900/95';

  const renderIcon = () => {
    if (isError) return <WifiOff size={20} color="#f87171" />;
    if (isWarning) return <AlertTriangle size={20} color="#fbbf24" />;
    if (isSuccess) return <CheckCircle2 size={20} color="#34d399" />;
    return <Info size={20} color="#60a5fa" />;
  };

  return (
    <Animated.View
      style={{ transform: [{ translateY }], opacity }}
      className="absolute left-4 right-4 top-14 z-50"
    >
      <View
        className={`flex-row items-start rounded-2xl border p-4 shadow-2xl ${containerStyle}`}
      >
        <View className="mt-0.5">{renderIcon()}</View>
        <View className="ml-3 flex-1 pr-2">
          <Text className="text-sm font-bold text-white">{toast.title}</Text>
          <Text className="mt-0.5 text-xs leading-4 text-slate-200">
            {toast.message}
          </Text>
        </View>
        <Pressable
          onPress={onDismiss}
          className="h-7 w-7 items-center justify-center rounded-full bg-white/10 active:opacity-70"
        >
          <X size={14} color="#f8fafc" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
