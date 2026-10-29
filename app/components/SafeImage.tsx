import React, { useState } from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';
import { ImageOff } from 'lucide-react-native';

interface SafeImageProps {
  uri?: string | null;
  className?: string;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
}

/**
 * Image that falls back to a placeholder when the URI is missing or no longer readable
 * (e.g. cached scan photos purged by the OS).
 */
export function SafeImage({ uri, className, style, iconSize = 20 }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!uri || failed) {
    return (
      <View className={`items-center justify-center bg-slate-800 ${className ?? ''}`} style={style}>
        <ImageOff size={iconSize} color="#64748b" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      className={className}
      style={style}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}
