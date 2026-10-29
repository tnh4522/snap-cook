import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronRight, ListChecks, UtensilsCrossed } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { RecipeMetaChips } from '@/components/RecipeMetaChips';
import { FavoriteButton } from '@/components/FavoriteButton';

interface RecipeCardProps {
  recipe: RecipeItem;
  index?: number;
  imageUri?: string | null;
  onPress: () => void;
}

export function RecipeCard({ recipe, index, imageUri, onPress }: RecipeCardProps) {
  const previewIngredients = recipe.ingredients.slice(0, 3);
  const extraCount = Math.max(0, recipe.ingredients.length - 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open recipe ${recipe.name}`}
      className="mb-4 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 active:opacity-85"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          {index !== undefined && (
            <View className="mb-2 self-start rounded-full bg-emerald-500/20 px-3 py-1">
              <Text className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recipe #{index + 1}
              </Text>
            </View>
          )}
          <Text className="text-xl font-bold text-white">{recipe.name}</Text>
        </View>

        <FavoriteButton recipe={recipe} imageUri={imageUri} size={18} />
      </View>

      <View className="mt-3">
        <RecipeMetaChips recipe={recipe} />
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {previewIngredients.map((item, idx) => (
          <View
            key={`${recipe.name}-ing-${idx}`}
            className="rounded-xl border border-slate-700/80 bg-slate-800/70 px-3 py-1.5"
          >
            <Text className="text-xs font-medium text-slate-200" numberOfLines={1}>
              {item}
            </Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View className="rounded-xl bg-emerald-500/15 px-3 py-1.5">
            <Text className="text-xs font-semibold text-emerald-300">
              +{extraCount} more
            </Text>
          </View>
        )}
      </View>

      <View className="mt-4 flex-row items-center justify-between border-t border-slate-800/80 pt-3">
        <View className="flex-row items-center">
          <UtensilsCrossed size={14} color="#94a3b8" />
          <Text className="ml-1.5 text-xs text-slate-400">
            {recipe.ingredients.length} ingredients
          </Text>
        </View>
        <View className="flex-row items-center">
          <ListChecks size={14} color="#94a3b8" />
          <Text className="ml-1.5 text-xs text-slate-400">
            {recipe.instructions.length} steps
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="mr-1 text-xs font-semibold text-emerald-400">View</Text>
          <ChevronRight size={16} color="#34d399" />
        </View>
      </View>
    </Pressable>
  );
}
