import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Camera, Image as ImageIcon, RefreshCw } from 'lucide-react-native';

interface CameraActionBarProps {
  onTakePhoto: () => void;
  onPickGallery: () => void;
  onToggleFacing: () => void;
  disabled?: boolean;
}

export function CameraActionBar({
  onTakePhoto,
  onPickGallery,
  onToggleFacing,
  disabled = false,
}: CameraActionBarProps) {
  return (
    <View className="w-full px-6 pb-8 pt-4">
      <View className="flex-row items-center justify-around rounded-3xl border border-slate-800/80 bg-slate-950/85 px-6 py-5">
        <Pressable
          onPress={onPickGallery}
          disabled={disabled}
          className="items-center justify-center active:opacity-75"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
            <ImageIcon size={22} color="#e2e8f0" />
          </View>
          <Text className="mt-1.5 text-xs font-medium text-slate-300">Gallery</Text>
        </Pressable>

        <Pressable
          onPress={onTakePhoto}
          disabled={disabled}
          className="items-center justify-center active:scale-95"
        >
          <View className="h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-400 bg-emerald-500/20 p-1.5">
            <View className="h-full w-full items-center justify-center rounded-full bg-emerald-500">
              <Camera size={28} color="#022c22" />
            </View>
          </View>
          <Text className="mt-1.5 text-xs font-bold text-emerald-400">Snap Fridge</Text>
        </Pressable>

        <Pressable
          onPress={onToggleFacing}
          disabled={disabled}
          className="items-center justify-center active:opacity-75"
        >
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-800">
            <RefreshCw size={22} color="#e2e8f0" />
          </View>
          <Text className="mt-1.5 text-xs font-medium text-slate-300">Flip</Text>
        </Pressable>
      </View>
    </View>
  );
}
