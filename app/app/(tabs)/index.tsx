import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  AlertCircle,
  ChefHat,
  ChevronRight,
  Image as ImageIcon,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { CameraActionBar } from '@/components/CameraActionBar';
import { ScannerOverlay } from '@/components/ScannerOverlay';
import { getDietOptions, LANGUAGE_OPTIONS } from '@/utils/recipe';
import { useI18n } from '@/i18n';

export default function HomeCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { recipes, isLoading, error, analyzeIngredientPhoto, cancelAnalysis, clearError } =
    useRecipes();
  const { preferences } = useLibrary();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { t, language } = useI18n();

  const prefSummary = [
    ...preferences.diet.map(
      (d) => getDietOptions(language).find((o) => o.value === d)?.label ?? d
    ),
    LANGUAGE_OPTIONS.find((l) => l.value === preferences.language)?.label,
    preferences.servings === 1
      ? `1 ${t('common.person')}`
      : `${preferences.servings} ${t('common.servings')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleProcessUri = async (uri: string) => {
    setPreviewUri(uri);
    const ok = await analyzeIngredientPhoto(uri);
    if (ok) {
      router.navigate('/recipes');
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isLoading) return;
    if (!cameraReady) {
      showToast(t('home.cameraStartingTitle'), t('home.cameraStartingDesc'), 'info');
      return;
    }
    clearError();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        await handleProcessUri(photo.uri);
      }
    } catch (takeErr) {
      console.error('[HomeCameraScreen] Take photo failed:', takeErr);
      showToast(t('home.captureFailedTitle'), t('home.captureFailedDesc'), 'error');
    }
  };

  const handlePickGallery = async () => {
    if (isLoading) return;
    clearError();
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await handleProcessUri(result.assets[0].uri);
      }
    } catch (pickErr) {
      console.error('[HomeCameraScreen] Pick gallery failed:', pickErr);
      showToast(t('home.galleryErrorTitle'), t('home.galleryErrorDesc'), 'error');
    }
  };

  const toggleFacing = () => {
    setCameraReady(false);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const renderPermissionState = () => {
    if (!permission) {
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDark ? '#52b788' : '#2d6a4f'} />
        </View>
      );
    }

    const blocked = !permission.granted && !permission.canAskAgain;
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/40">
          <ShieldAlert size={30} color={isDark ? '#52b788' : '#2d6a4f'} />
        </View>
        <Text className="text-center text-lg font-bold text-stone-800 dark:text-stone-100">
          {t('home.cameraAccessNeeded')}
        </Text>
        <Text className="mt-2 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
          {blocked ? t('home.cameraAccessDenied') : t('home.cameraAccessRequest')}
        </Text>
        <View className="mt-6 flex-row">
          <Pressable
            onPress={blocked ? () => Linking.openSettings() : requestPermission}
            className="rounded-2xl bg-emerald-700 px-5 py-3 shadow-sm active:opacity-85 dark:bg-emerald-600"
          >
            <Text className="text-xs font-bold text-white">
              {blocked ? t('home.openSettings') : t('home.grantCamera')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handlePickGallery}
            className="ml-3 flex-row items-center rounded-2xl border border-stone-200 bg-white px-5 py-3 shadow-sm active:opacity-85 dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <ImageIcon size={16} color={isDark ? '#9ca9a1' : '#546359'} />
            <Text className="ml-2 text-xs font-semibold text-stone-700 dark:text-stone-200">
              {t('home.pickPhoto')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]" edges={['top', 'left', 'right']}>
      <ScannerOverlay visible={isLoading} previewUri={previewUri} onCancel={cancelAnalysis} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-emerald-600/15 bg-emerald-50 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-950/40">
            <ChefHat size={20} color={isDark ? '#52b788' : '#2d6a4f'} />
          </View>
          <View>
            <Text className="text-xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              SnapCook AI
            </Text>
            <Text className="text-xs text-stone-500 dark:text-stone-400">{t('home.tagline')}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.navigate('/settings')}
          accessibilityLabel={t('settings.title')}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <SlidersHorizontal size={17} color={isDark ? '#e2e8f0' : '#475569'} />
        </Pressable>
      </View>

      {/* Preferences summary pill */}
      <Pressable
        onPress={() => router.navigate('/settings')}
        className="mx-6 mb-3 flex-row items-center rounded-2xl border border-stone-200/90 bg-white px-3.5 py-2.5 shadow-sm active:opacity-80 dark:border-stone-800/80 dark:bg-[#1a1d1f]"
      >
        <Text className="text-xs font-medium text-stone-400 dark:text-stone-500">
          {t('home.preferencesPrefix')}
        </Text>
        <Text className="flex-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300" numberOfLines={1}>
          {prefSummary}
        </Text>
        <ChevronRight size={14} color={isDark ? '#64748b' : '#94a3b8'} />
      </Pressable>

      {/* Error notification */}
      {error && (
        <View className="mx-6 mb-3 flex-row items-center rounded-2xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/40">
          <AlertCircle size={17} color={isDark ? '#f43f5e' : '#be123c'} />
          <Text className="ml-2.5 flex-1 text-xs font-medium text-rose-800 dark:text-rose-200">{error}</Text>
          <Pressable onPress={clearError} className="ml-2 rounded-lg bg-rose-100 px-2.5 py-1 dark:bg-rose-900/50">
            <Text className="text-xs font-bold text-rose-700 dark:text-rose-200">{t('common.dismiss')}</Text>
          </Pressable>
        </View>
      )}

      {/* Camera Viewfinder */}
      <View className="mx-5 flex-1 overflow-hidden rounded-3xl border border-stone-200/80 bg-stone-900 shadow-sm dark:border-stone-800 dark:bg-[#1a1d1f]">
        {permission?.granted ? (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            enableTorch={torchOn && facing === 'back'}
            onCameraReady={() => setCameraReady(true)}
          >
            <View className="flex-1 justify-between p-5">
              <View className="flex-row items-center justify-between">
                <View className="rounded-full bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
                  <Text className="text-[11px] font-medium text-stone-200">
                    {t('home.centerIngredients')}
                  </Text>
                </View>
                {facing === 'back' && (
                  <Pressable
                    onPress={() => setTorchOn((v) => !v)}
                    accessibilityLabel={
                      torchOn ? t('home.turnFlashlightOff') : t('home.turnFlashlightOn')
                    }
                    className={`h-9 w-9 items-center justify-center rounded-full ${
                      torchOn ? 'bg-amber-400' : 'bg-black/60'
                    }`}
                  >
                    {torchOn ? (
                      <Zap size={16} color="#1c1917" />
                    ) : (
                      <ZapOff size={16} color="#ffffff" />
                    )}
                  </Pressable>
                )}
              </View>

              {/* Guide border */}
              <View className="h-44 w-full self-center rounded-3xl border-2 border-dashed border-white/40" />

              {recipes.length > 0 ? (
                <Pressable
                  onPress={() => router.navigate('/recipes')}
                  className="flex-row items-center self-center rounded-full bg-emerald-700/90 px-4 py-2 shadow-sm active:opacity-80 dark:bg-emerald-600/90"
                >
                  <Text className="text-xs font-bold text-white">{t('home.viewLastResults')}</Text>
                  <ChevronRight size={14} color="#ffffff" />
                </Pressable>
              ) : (
                <View />
              )}
            </View>
          </CameraView>
        ) : (
          renderPermissionState()
        )}
      </View>

      <CameraActionBar
        onTakePhoto={handleTakePhoto}
        onPickGallery={handlePickGallery}
        onToggleFacing={toggleFacing}
        disabled={isLoading}
        cameraAvailable={Boolean(permission?.granted)}
      />
    </SafeAreaView>
  );
}
