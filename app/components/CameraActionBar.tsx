import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon, RefreshCw } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface CameraActionBarProps {
  onTakePhoto: () => void;
  onPickGallery: () => void;
  onToggleFacing: () => void;
  disabled?: boolean;
  /** When false (no camera permission) only the gallery action is enabled. */
  cameraAvailable?: boolean;
  snapLabel?: string;
  accentColor?: 'emerald' | 'orange';
}

export function CameraActionBar({
  onTakePhoto,
  onPickGallery,
  onToggleFacing,
  disabled = false,
  cameraAvailable = true,
  snapLabel,
  accentColor = 'emerald',
}: CameraActionBarProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const cameraDisabled = disabled || !cameraAvailable;
  const isOrange = accentColor === 'orange';

  return (
    <View className="w-full px-6 pb-4 pt-3">
      <View className="flex-row items-center justify-around rounded-3xl border border-stone-200/90 bg-white/95 px-6 py-3.5 shadow-sm dark:border-stone-800/80 dark:bg-[#151819]/95">
        {/* Gallery button */}
        <Pressable
          onPress={onPickGallery}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('home.pickPhoto')}
          className={`items-center justify-center active:opacity-75 ${disabled ? 'opacity-35' : ''}`}
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
            <ImageIcon size={20} color={isDark ? '#e2e8f0' : '#475569'} />
          </View>
          <Text className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">
            {t('home.gallery')}
          </Text>
        </Pressable>

        {/* Snap button */}
        <Pressable
          onPress={onTakePhoto}
          disabled={cameraDisabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={snapLabel || t('home.snapFridge')}
          className={`items-center justify-center active:scale-95 ${cameraDisabled ? 'opacity-35' : ''}`}
        >
          <View
            className={`h-20 w-20 items-center justify-center rounded-full border-4 p-1 ${
              isOrange
                ? 'border-orange-500/30 bg-orange-50 dark:border-orange-500/40 dark:bg-orange-950/40'
                : 'border-emerald-600/30 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-950/40'
            }`}
          >
            <View
              className={`h-14 w-14 items-center justify-center rounded-full shadow-sm ${
                isOrange
                  ? 'bg-orange-600 dark:bg-orange-500'
                  : 'bg-emerald-700 dark:bg-emerald-600'
              }`}
            >
              <Camera size={24} color="#ffffff" strokeWidth={2.2} />
            </View>
          </View>
          <Text
            className={`mt-1 text-xs font-bold ${
              isOrange
                ? 'text-orange-800 dark:text-orange-300'
                : 'text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {snapLabel || t('home.snapFridge')}
          </Text>
        </Pressable>

        {/* Flip button */}
        <Pressable
          onPress={onToggleFacing}
          disabled={cameraDisabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('home.flip')}
          className={`items-center justify-center active:opacity-75 ${cameraDisabled ? 'opacity-35' : ''}`}
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-stone-800">
            <RefreshCw size={20} color={isDark ? '#e2e8f0' : '#475569'} />
          </View>
          <Text className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">
            {t('home.flip')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
