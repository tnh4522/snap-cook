import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, CheckCircle2, ChevronRight, ListChecks, UtensilsCrossed } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { RecipeMetaChips } from '@/components/RecipeMetaChips';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface RecipeCardProps {
  recipe: RecipeItem;
  index?: number;
  imageUri?: string | null;
  detectedIngredients?: string[];
  onPress: () => void;
}

export function RecipeCard({
  recipe,
  index,
  imageUri,
  detectedIngredients,
  onPress,
}: RecipeCardProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const previewIngredients = recipe.ingredients.slice(0, 3);
  const extraCount = Math.max(0, recipe.ingredients.length - 3);

  const stats = useMemo(() => {
    if (!detectedIngredients || detectedIngredients.length === 0) return null;
    const detectedLower = detectedIngredients.map((d) => d.toLowerCase().trim());
    let matchedCount = 0;
    recipe.ingredients.forEach((ing) => {
      const ingLower = ing.toLowerCase();
      const isMatched = detectedLower.some(
        (det) => ingLower.includes(det) || det.includes(ingLower)
      );
      if (isMatched) matchedCount++;
    });
    const missingCount = Math.max(0, recipe.ingredients.length - matchedCount);
    return { matchedCount, missingCount, allOnHand: missingCount === 0 };
  }, [recipe.ingredients, detectedIngredients]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t('recipes.openRecipeA11y', { name: recipe.name })}
      className="mb-4 rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm active:opacity-85 dark:border-stone-800/80 dark:bg-[#1a1d1f]"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <View className="mb-2 flex-row flex-wrap items-center gap-1.5 self-start">
            {index !== undefined && (
              <View className="rounded-full border border-emerald-600/15 bg-emerald-50 px-2.5 py-0.5 dark:border-emerald-500/20 dark:bg-emerald-950/40">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  {t('recipes.recipeBadge', { num: index + 1 })}
                </Text>
              </View>
            )}
            {stats && (
              stats.allOnHand ? (
                <View className="flex-row items-center rounded-full border border-emerald-500/20 bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/40">
                  <CheckCircle2 size={11} color={isDark ? '#52b788' : '#059669'} />
                  <Text className="ml-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    {t('recipes.allIngredientsOnHand')}
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center rounded-full border border-amber-500/20 bg-amber-50 px-2 py-0.5 dark:bg-amber-950/40">
                  <AlertTriangle size={11} color={isDark ? '#fbbf24' : '#d97706'} />
                  <Text className="ml-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    {stats.missingCount === 1
                      ? t('recipes.missingIngredients', { count: stats.missingCount })
                      : t('recipes.missingIngredientsPlural', { count: stats.missingCount })}
                  </Text>
                </View>
              )
            )}
          </View>
          <Text className="text-lg font-bold leading-6 text-stone-900 dark:text-stone-100">
            {recipe.name}
          </Text>
        </View>

        <FavoriteButton recipe={recipe} imageUri={imageUri} size={17} />
      </View>

      <View className="mt-3">
        <RecipeMetaChips recipe={recipe} />
      </View>

      <View className="mt-3.5 flex-row flex-wrap gap-1.5">
        {previewIngredients.map((item, idx) => (
          <View
            key={`${recipe.name}-ing-${idx}`}
            className="rounded-xl border border-stone-200/80 bg-stone-50 px-2.5 py-1 dark:border-stone-700/60 dark:bg-[#252a2d]"
          >
            <Text className="text-[11px] font-medium text-stone-700 dark:text-stone-300" numberOfLines={1}>
              {item}
            </Text>
          </View>
        ))}
        {extraCount > 0 && (
          <View className="rounded-xl border border-stone-200/70 bg-stone-100/70 px-2.5 py-1 dark:border-stone-700/50 dark:bg-stone-800/80">
            <Text className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
              {t('common.moreIngredients', { count: extraCount })}
            </Text>
          </View>
        )}
      </View>

      <View className="mt-3.5 flex-row items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800/80">
        <View className="flex-row items-center">
          <UtensilsCrossed size={13} color={isDark ? '#9ca9a1' : '#64748b'} />
          <Text className="ml-1.5 text-xs text-stone-500 dark:text-stone-400">
            {recipe.ingredients.length} {t('common.ingredients')}
          </Text>
        </View>
        <View className="flex-row items-center">
          <ListChecks size={13} color={isDark ? '#9ca9a1' : '#64748b'} />
          <Text className="ml-1.5 text-xs text-stone-500 dark:text-stone-400">
            {recipe.instructions.length} {t('common.steps')}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Text className="mr-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
            {t('common.view')}
          </Text>
          <ChevronRight size={15} color={isDark ? '#52b788' : '#2d6a4f'} />
        </View>
      </View>
    </Pressable>
  );
}
