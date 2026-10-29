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
import { CameraActionBar } from '@/components/CameraActionBar';
import { ScannerOverlay } from '@/components/ScannerOverlay';
import { DIET_OPTIONS, LANGUAGE_OPTIONS } from '@/utils/recipe';

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

  const prefSummary = [
    ...preferences.diet.map((d) => DIET_OPTIONS.find((o) => o.value === d)?.label ?? d),
    LANGUAGE_OPTIONS.find((l) => l.value === preferences.language)?.label,
    `${preferences.servings} servings`,
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
      showToast('Camera Starting', 'Please wait a moment for the camera to get ready.', 'info');
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
      showToast('Capture Failed', 'Could not take a photo. Please try again.', 'error');
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
      showToast('Gallery Error', 'Could not open the photo library.', 'error');
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
          <ActivityIndicator color="#34d399" />
        </View>
      );
    }

    const blocked = !permission.granted && !permission.canAskAgain;
    return (
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-slate-800">
          <ShieldAlert size={32} color="#34d399" />
        </View>
        <Text className="text-center text-lg font-bold text-white">Camera Access Needed</Text>
        <Text className="mt-2 text-center text-sm text-slate-400">
          {blocked
            ? 'Camera access was denied. Enable it in system settings, or pick an existing photo from your gallery.'
            : 'Grant camera access to snap photos of your fridge, or pick an existing photo from your gallery.'}
        </Text>
        <View className="mt-6 flex-row">
          <Pressable
            onPress={blocked ? () => Linking.openSettings() : requestPermission}
            className="rounded-2xl bg-emerald-500 px-5 py-3 active:opacity-85"
          >
            <Text className="text-sm font-bold text-slate-950">
              {blocked ? 'Open Settings' : 'Grant Camera'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handlePickGallery}
            className="ml-3 flex-row items-center rounded-2xl border border-slate-700 bg-slate-800 px-5 py-3 active:opacity-85"
          >
            <ImageIcon size={16} color="#e2e8f0" />
            <Text className="ml-2 text-sm font-semibold text-slate-200">Pick Photo</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <ScannerOverlay visible={isLoading} previewUri={previewUri} onCancel={cancelAnalysis} />

      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20">
            <ChefHat size={22} color="#34d399" />
          </View>
          <View>
            <Text className="text-xl font-extrabold tracking-tight text-white">SnapCook AI</Text>
            <Text className="text-xs text-slate-400">Snap your fridge, cook in minutes</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.navigate('/settings')}
          accessibilityLabel="Cooking preferences"
          className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 active:opacity-75"
        >
          <SlidersHorizontal size={18} color="#e2e8f0" />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.navigate('/settings')}
        className="mx-6 mb-3 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 active:opacity-80"
      >
        <Text className="text-xs font-semibold text-slate-400">Preferences: </Text>
        <Text className="flex-1 text-xs font-medium text-emerald-300" numberOfLines={1}>
          {prefSummary}
        </Text>
        <ChevronRight size={14} color="#64748b" />
      </Pressable>

      {error && (
        <View className="mx-6 mb-3 flex-row items-center rounded-2xl border border-red-500/40 bg-red-950/70 p-3.5">
          <AlertCircle size={18} color="#f87171" />
          <Text className="ml-2.5 flex-1 text-xs font-medium text-red-200">{error}</Text>
          <Pressable onPress={clearError} className="ml-2 rounded-lg bg-red-500/20 px-2.5 py-1">
            <Text className="text-xs font-bold text-red-300">Dismiss</Text>
          </Pressable>
        </View>
      )}

      <View className="mx-5 flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
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
                <View className="rounded-full bg-slate-950/70 px-4 py-1.5">
                  <Text className="text-xs font-medium text-slate-200">
                    Center your ingredients in frame
                  </Text>
                </View>
                {facing === 'back' && (
                  <Pressable
                    onPress={() => setTorchOn((v) => !v)}
                    accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
                    className={`h-9 w-9 items-center justify-center rounded-full ${
                      torchOn ? 'bg-amber-400' : 'bg-slate-950/70'
                    }`}
                  >
                    {torchOn ? (
                      <Zap size={16} color="#1c1917" />
                    ) : (
                      <ZapOff size={16} color="#e2e8f0" />
                    )}
                  </Pressable>
                )}
              </View>
              <View className="h-44 w-full self-center rounded-3xl border-2 border-dashed border-emerald-400/50" />
              {recipes.length > 0 ? (
                <Pressable
                  onPress={() => router.navigate('/recipes')}
                  className="flex-row items-center self-center rounded-full bg-emerald-500/90 px-4 py-2 active:opacity-80"
                >
                  <Text className="text-xs font-bold text-slate-950">View last results</Text>
                  <ChevronRight size={14} color="#022c22" />
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
