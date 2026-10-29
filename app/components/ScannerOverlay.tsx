import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Sparkles, X } from 'lucide-react-native';
import { useI18n } from '@/i18n';

interface ScannerOverlayProps {
  visible: boolean;
  previewUri?: string | null;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function ScannerOverlay({
  visible,
  previewUri,
  onCancel,
  title,
  description,
}: ScannerOverlayProps) {
  const { t } = useI18n();
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => {
      sub?.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (reduceMotion) {
      pulseAnim.setValue(0.8);
      scanLineAnim.setValue(110);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 220,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    scanLoop.start();

    return () => {
      pulseLoop.stop();
      scanLoop.stop();
    };
  }, [visible, reduceMotion, pulseAnim, scanLineAnim]);

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-black/80 px-6 backdrop-blur-md">
      <View className="relative h-64 w-64 overflow-hidden rounded-3xl border-2 border-emerald-400/60 bg-stone-900 shadow-2xl">
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            className="h-full w-full opacity-60"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-stone-800" />
        )}

        <Animated.View
          style={{
            transform: [{ translateY: scanLineAnim }],
            opacity: pulseAnim,
          }}
          className="absolute left-0 right-0 h-1 bg-emerald-400"
        />

        <View className="absolute inset-0 items-center justify-center">
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="rounded-full bg-emerald-500/20 p-4"
          >
            <Sparkles size={32} color="#52b788" />
          </Animated.View>
        </View>
      </View>

      <Text className="mt-6 text-center text-lg font-bold tracking-tight text-white">
        {title || t('home.scanningTitle')}
      </Text>
      <Text className="mt-2 max-w-xs text-center text-xs leading-5 text-stone-300">
        {description || t('home.scanningDesc')}
      </Text>

      {onCancel && (
        <Pressable
          onPress={onCancel}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
          className="mt-7 flex-row items-center rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 active:opacity-75"
        >
          <X size={15} color="#ffffff" />
          <Text className="ml-2 text-xs font-semibold text-white">{t('common.cancel')}</Text>
        </Pressable>
      )}
    </View>
  );
}
