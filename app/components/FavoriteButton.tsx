import React from 'react';
import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface FavoriteButtonProps {
  recipe: RecipeItem;
  imageUri?: string | null;
  size?: number;
}

export function FavoriteButton({ recipe, imageUri, size = 18 }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { language } = useI18n();
  const active = isFavorite(recipe);

  const handlePress = () => {
    const added = toggleFavorite(recipe, imageUri);
    const addedTitle = language === 'vi' ? 'Đã lưu vào Yêu thích' : 'Saved to Favorites';
    const removedTitle = language === 'vi' ? 'Đã xóa khỏi Yêu thích' : 'Removed from Favorites';
    showToast(added ? addedTitle : removedTitle, recipe.name, added ? 'success' : 'info');
  };

  const heartColor = active
    ? isDark
      ? '#fb7185'
      : '#e11d48'
    : isDark
      ? '#68746d'
      : '#94a3b8';

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        active
          ? language === 'vi'
            ? 'Xóa khỏi yêu thích'
            : 'Remove from favorites'
          : language === 'vi'
            ? 'Lưu vào yêu thích'
            : 'Save to favorites'
      }
      accessibilityState={{ selected: active }}
      className={`h-9 w-9 items-center justify-center rounded-2xl border active:opacity-75 ${
        active
          ? 'border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/40'
          : 'border-stone-200/90 bg-stone-50 shadow-sm dark:border-stone-800/80 dark:bg-stone-800/80'
      }`}
    >
      <Heart size={size} color={heartColor} fill={active ? heartColor : 'transparent'} strokeWidth={2} />
    </Pressable>
  );
}
