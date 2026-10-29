import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AlertCircle, ChefHat, Image as ImageIcon, ShieldAlert } from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { CameraActionBar } from '@/components/CameraActionBar';
import { ScannerOverlay } from '@/components/ScannerOverlay';

export default function HomeCameraScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const { isLoading, error, analyzeIngredientPhoto, clearError } = useRecipes();

  const handleProcessUri = async (uri: string) => {
    console.log('[HomeCameraScreen] Processing URI:', uri);
    setPreviewUri(uri);
    try {
      const ok = await analyzeIngredientPhoto(uri);
      console.log('[HomeCameraScreen] Analysis completed, success =', ok);
      if (ok) {
        console.log('[HomeCameraScreen] Navigating to /recipes...');
        try {
          router.navigate('/recipes');
        } catch {
          router.push('/recipes');
        }
      }
    } catch (processErr) {
      console.error('[HomeCameraScreen] Process URI error:', processErr);
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isLoading) return;
    clearError();
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        await handleProcessUri(photo.uri);
      }
    } catch (takeErr) {
      console.error('[HomeCameraScreen] Take photo failed:', takeErr);
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
    }
  };

  const toggleFacing = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScannerOverlay visible={isLoading} previewUri={previewUri} />

      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20">
            <ChefHat size={22} color="#34d399" />
          </View>
          <View>
            <Text className="text-xl font-extrabold tracking-tight text-white">
              SnapCook AI
            </Text>
            <Text className="text-xs text-slate-400">
              Snap your fridge, cook in minutes
            </Text>
          </View>
        </View>
      </View>

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
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing}>
            <View className="flex-1 justify-between p-5">
              <View className="self-center rounded-full bg-slate-950/70 px-4 py-1.5">
                <Text className="text-xs font-medium text-slate-200">
                  Center your ingredients in frame
                </Text>
              </View>
              <View className="h-44 w-full self-center rounded-3xl border-2 border-dashed border-emerald-400/50" />
              <View />
            </View>
          </CameraView>
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-slate-800">
              <ShieldAlert size={32} color="#34d399" />
            </View>
            <Text className="text-center text-lg font-bold text-white">
              Camera Access Needed
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Grant camera access to snap photos of your fridge, or pick an existing photo from your gallery.
            </Text>
            <View className="mt-6 flex-row space-x-3">
              <Pressable
                onPress={requestPermission}
                className=" rounded-2xl bg-emerald-500 px-5 py-3 active:opacity-85"
              >
                <Text className="text-sm font-bold text-slate-950">Grant Camera</Text>
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
        )}
      </View>

      <CameraActionBar
        onTakePhoto={handleTakePhoto}
        onPickGallery={handlePickGallery}
        onToggleFacing={toggleFacing}
        disabled={isLoading}
      />
    </SafeAreaView>
  );
}
