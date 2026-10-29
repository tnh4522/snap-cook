import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

interface ScannerOverlayProps {
  visible: boolean;
  previewUri?: string | null;
}

export function ScannerOverlay({ visible, previewUri }: ScannerOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
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
  }, [visible, pulseAnim, scanLineAnim]);

  if (!visible) return null;

  return (
    <View className="absolute inset-0 z-50 flex-1 items-center justify-center bg-slate-950/90 px-6">
      <View className="relative h-64 w-64 overflow-hidden rounded-3xl border-2 border-emerald-400/70 bg-slate-900 shadow-2xl">
        {previewUri ? (
          <Image
            source={{ uri: previewUri }}
            className="h-full w-full opacity-55"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-slate-800" />
        )}

        <Animated.View
          style={{
            transform: [{ translateY: scanLineAnim }],
            opacity: pulseAnim,
          }}
          className="absolute left-0 right-0 h-1.5 bg-emerald-400 shadow-lg"
        />

        <View className="absolute inset-0 items-center justify-center">
          <Animated.View
            style={{ opacity: pulseAnim }}
            className="rounded-full bg-emerald-500/20 p-5"
          >
            <Sparkles size={36} color="#34d399" />
          </Animated.View>
        </View>
      </View>

      <Text className="mt-6 text-center text-xl font-bold tracking-tight text-white">
        Scanning Your Fridge...
      </Text>
      <Text className="mt-2 max-w-xs text-center text-sm text-slate-300">
        SnapCook AI is identifying fresh ingredients and crafting 3 custom recipes for you.
      </Text>
    </View>
  );
}
