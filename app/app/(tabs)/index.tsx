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
  Flame,
  Image as ImageIcon,
  ShieldAlert,
  SlidersHorizontal,
  Zap,
  ZapOff,
} from 'lucide-react-native';
import { SnapCameraMode } from '@/types/health';
import { useRecipes } from '@/context/RecipeContext';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
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
  const [cameraMode, setCameraMode] = useState<SnapCameraMode>('fridge');
  const [facing, setFacing] = useState<CameraType>('back');
  const [torchOn, setTorchOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const {
    recipes,
    isLoading: isRecipeLoading,
    error: recipeError,
    analyzeIngredientPhoto,
    cancelAnalysis,
    clearError: clearRecipeError,
  } = useRecipes();

  const {
    metrics,
    todayNutrition,
    lastFoodAnalysis,
    isAnalyzingFood,
    foodError,
    analyzeFoodPhoto,
    cancelFoodAnalysis,
    clearFoodError,
  } = useHealth();

  const { isAuthenticated } = useAuth();
  const { preferences } = useLibrary();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { t, language } = useI18n();

  const isLoading = isRecipeLoading || isAnalyzingFood;
  const activeError = cameraMode === 'food_lens' ? foodError : recipeError;
  const [lastFailedUri, setLastFailedUri] = useState<string | null>(null);

  const handleClearError = () => {
    clearRecipeError();
    clearFoodError();
    setLastFailedUri(null);
  };

  const handleCancelScan = () => {
    if (cameraMode === 'food_lens') cancelFoodAnalysis();
    else cancelAnalysis();
  };

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
    setLastFailedUri(null);
    if (cameraMode === 'food_lens') {
      const ok = await analyzeFoodPhoto(uri);
      if (ok) {
        router.navigate('/food-analysis');
      } else {
        setLastFailedUri(uri);
      }
    } else {
      const ok = await analyzeIngredientPhoto(uri);
      if (ok) {
        router.navigate('/recipes');
      } else {
        setLastFailedUri(uri);
      }
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isLoading) return;
    if (!cameraReady) {
      showToast(t('home.cameraStartingTitle'), t('home.cameraStartingDesc'), 'info');
      return;
    }
    handleClearError();
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
    handleClearError();
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
      <ScannerOverlay
        visible={isLoading}
        previewUri={previewUri}
        onCancel={handleCancelScan}
        title={cameraMode === 'food_lens' ? t('foodLens.scanningFoodTitle') : t('home.scanningTitle')}
        description={
          cameraMode === 'food_lens' ? t('foodLens.scanningFoodDesc') : t('home.scanningDesc')
        }
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-3">
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
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <SlidersHorizontal size={17} color={isDark ? '#e2e8f0' : '#475569'} />
        </Pressable>
      </View>

      {/* Camera Mode Switcher: Fridge -> Recipes vs Food Lens -> Calo */}
      <View className="mx-6 mb-2.5 flex-row rounded-2xl border border-stone-200/90 bg-stone-200/70 p-1 dark:border-stone-800 dark:bg-[#1a1d1f]">
        <Pressable
          onPress={() => setCameraMode('fridge')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2"
          style={{
            backgroundColor:
              cameraMode === 'fridge'
                ? isDark
                  ? '#272b2e'
                  : '#ffffff'
                : 'transparent',
          }}
        >
          <ChefHat
            size={14}
            color={
              cameraMode === 'fridge'
                ? isDark
                  ? '#52b788'
                  : '#2d6a4f'
                : isDark
                ? '#84948a'
                : '#64748b'
            }
          />
          <Text
            className="ml-1.5 text-xs font-bold"
            style={{
              color:
                cameraMode === 'fridge'
                  ? isDark
                    ? '#edf2ee'
                    : '#1c2420'
                  : isDark
                  ? '#84948a'
                  : '#64748b',
            }}
          >
            {t('foodLens.modeFridge')}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setCameraMode('food_lens')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2"
          style={{
            backgroundColor:
              cameraMode === 'food_lens'
                ? isDark
                  ? '#272b2e'
                  : '#ffffff'
                : 'transparent',
          }}
        >
          <Flame
            size={14}
            color={
              cameraMode === 'food_lens'
                ? '#f97316'
                : isDark
                ? '#84948a'
                : '#64748b'
            }
          />
          <Text
            className="ml-1.5 text-xs font-bold"
            style={{
              color:
                cameraMode === 'food_lens'
                  ? isDark
                    ? '#edf2ee'
                    : '#1c2420'
                  : isDark
                  ? '#84948a'
                  : '#64748b',
            }}
          >
            {t('foodLens.modeFood')}
          </Text>
        </Pressable>
      </View>

      {/* Contextual Summary Pill (Preferences for Fridge, Calorie Budget for Food Lens) */}
      {cameraMode === 'fridge' ? (
        <Pressable
          onPress={() => router.navigate('/settings')}
          className="mx-6 mb-3 flex-row items-center rounded-2xl border border-stone-200/90 bg-white px-3.5 py-2.5 shadow-sm active:opacity-80 dark:border-stone-800/80 dark:bg-[#1a1d1f]"
        >
          <Text className="text-xs font-medium text-stone-400 dark:text-stone-500">
            {t('home.preferencesPrefix')}
          </Text>
          <Text
            className="flex-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300"
            numberOfLines={1}
          >
            {prefSummary}
          </Text>
          <ChevronRight size={14} color={isDark ? '#64748b' : '#94a3b8'} />
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.navigate('/(tabs)/health')}
          className="mx-6 mb-3 flex-row items-center rounded-2xl border border-emerald-600/20 bg-emerald-50/70 px-3.5 py-2.5 shadow-sm active:opacity-80 dark:border-emerald-500/20 dark:bg-emerald-950/30"
        >
          <Flame size={14} color={isDark ? '#86efac' : '#2d6a4f'} />
          <Text
            className="ml-2 flex-1 text-xs font-semibold text-emerald-900 dark:text-emerald-200"
            numberOfLines={1}
          >
            {isAuthenticated
              ? `${t('health.eaten')}: ${todayNutrition.calories} / ${metrics.daily_calorie_target} kcal · BMI ${metrics.bmi}`
              : t('auth.loginRequiredTitle')}
          </Text>
          <ChevronRight size={14} color={isDark ? '#86efac' : '#2d6a4f'} />
        </Pressable>
      )}

      {/* Error notification */}
      {activeError && (
        <View className="mx-6 mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 dark:border-rose-900/40 dark:bg-rose-950/40">
          <View className="flex-row items-center">
            <AlertCircle size={17} color={isDark ? '#f43f5e' : '#be123c'} />
            <Text className="ml-2.5 flex-1 text-xs font-medium text-rose-800 dark:text-rose-200">
              {activeError}
            </Text>
          </View>
          <View className="mt-2.5 flex-row justify-end gap-2">
            {lastFailedUri && (
              <Pressable
                onPress={() => handleProcessUri(lastFailedUri)}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel={t('home.retryScan')}
                className="rounded-xl bg-rose-600 px-3 py-1.5 active:opacity-85 dark:bg-rose-700"
              >
                <Text className="text-xs font-bold text-white">
                  {t('home.retryScan')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleClearError}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('common.dismiss')}
              className="rounded-xl bg-rose-100 px-3 py-1.5 active:opacity-85 dark:bg-rose-900/50"
            >
              <Text className="text-xs font-bold text-rose-700 dark:text-rose-200">
                {t('common.dismiss')}
              </Text>
            </Pressable>
          </View>
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
                    {cameraMode === 'food_lens'
                      ? t('foodLens.centerFood')
                      : t('home.centerIngredients')}
                  </Text>
                </View>
                {facing === 'back' && (
                  <Pressable
                    onPress={() => setTorchOn((v) => !v)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      torchOn ? t('home.turnFlashlightOff') : t('home.turnFlashlightOn')
                    }
                    className={`h-10 w-10 items-center justify-center rounded-full ${
                      torchOn ? 'bg-amber-400' : 'bg-black/60'
                    }`}
                  >
                    {torchOn ? (
                      <Zap size={17} color="#1c1917" />
                    ) : (
                      <ZapOff size={17} color="#ffffff" />
                    )}
                  </Pressable>
                )}
              </View>

              {/* Viewfinder reticle with precision corner brackets */}
              <View className="relative h-48 w-full max-w-[270px] self-center">
                {/* Top-left corner */}
                <View className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-2 border-t-2 border-white/80" />
                {/* Top-right corner */}
                <View className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-2 border-t-2 border-white/80" />
                {/* Bottom-left corner */}
                <View className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-2 border-l-2 border-white/80" />
                {/* Bottom-right corner */}
                <View className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-2 border-r-2 border-white/80" />
                {/* Center focus indicator */}
                <View className="absolute inset-0 items-center justify-center">
                  <View className="h-1.5 w-1.5 rounded-full bg-white/50" />
                </View>
              </View>

              {cameraMode === 'fridge' && recipes.length > 0 ? (
                <Pressable
                  onPress={() => router.navigate('/recipes')}
                  className="flex-row items-center self-center rounded-full bg-emerald-700/90 px-4 py-2 shadow-sm active:opacity-80 dark:bg-emerald-600/90"
                >
                  <Text className="text-xs font-bold text-white">{t('home.viewLastResults')}</Text>
                  <ChevronRight size={14} color="#ffffff" />
                </Pressable>
              ) : cameraMode === 'food_lens' && lastFoodAnalysis ? (
                <Pressable
                  onPress={() => router.navigate('/food-analysis')}
                  className="flex-row items-center self-center rounded-full bg-orange-600/90 px-4 py-2 shadow-sm active:opacity-80 dark:bg-orange-500/90"
                >
                  <Text className="text-xs font-bold text-white">
                    {lastFoodAnalysis.food_name} ({lastFoodAnalysis.calories} kcal)
                  </Text>
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
        accentColor={cameraMode === 'food_lens' ? 'orange' : 'emerald'}
        snapLabel={cameraMode === 'food_lens' ? t('foodLens.snapFood') : t('home.snapFridge')}
      />
    </SafeAreaView>
  );
}
