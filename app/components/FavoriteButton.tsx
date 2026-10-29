import React from 'react';
import { Pressable } from 'react-native';
import { Heart } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';

interface FavoriteButtonProps {
  recipe: RecipeItem;
  imageUri?: string | null;
  size?: number;
}

export function FavoriteButton({ recipe, imageUri, size = 20 }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useLibrary();
  const { showToast } = useToast();
  const active = isFavorite(recipe);

  const handlePress = () => {
    const added = toggleFavorite(recipe, imageUri);
    showToast(
      added ? 'Saved to Favorites' : 'Removed from Favorites',
      recipe.name,
      added ? 'success' : 'info'
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from favorites' : 'Save to favorites'}
      accessibilityState={{ selected: active }}
      className={`h-10 w-10 items-center justify-center rounded-2xl border active:opacity-75 ${
        active ? 'border-rose-500/40 bg-rose-500/15' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <Heart size={size} color={active ? '#fb7185' : '#cbd5e1'} fill={active ? '#fb7185' : 'transparent'} />
    </Pressable>
  );
}
