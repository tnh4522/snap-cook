import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  ListOrdered,
  PartyPopper,
  RotateCcw,
  Share2,
  ShoppingBasket,
} from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { InstructionList } from '@/components/InstructionList';
import { FavoriteButton } from '@/components/FavoriteButton';
import { RecipeMetaChips } from '@/components/RecipeMetaChips';
import { formatRecipeForShare } from '@/utils/recipe';
import { useI18n } from '@/i18n';

function toggleInSet(set: Set<number>, value: number): Set<number> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const { recipes, capturedImageUri } = useRecipes();
  const { favorites } = useLibrary();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { t, language } = useI18n();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isFavoriteSource = source === 'favorite';
  const favorite = isFavoriteSource ? favorites.find((f) => f.key === id) : undefined;
  const recipeIndex = Number(id ?? 0);
  const liveRecipe = isFavoriteSource ? favorite?.recipe : recipes[recipeIndex];
  // Keep showing the recipe even if it gets un-favorited / session reset while this screen is open.
  const snapshotRef = useRef(liveRecipe);
  if (liveRecipe) snapshotRef.current = liveRecipe;
  const recipe = liveRecipe ?? snapshotRef.current;
  const imageUri = isFavoriteSource ? favorite?.imageUri : capturedImageUri;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f8f9fa] px-6 dark:bg-[#121415]">
        <Text className="text-base font-bold text-stone-800 dark:text-stone-100">
          {t('recipeDetail.notFoundTitle')}
        </Text>
        <Text className="mt-2 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
          {t('recipeDetail.notFoundDesc')}
        </Text>
        <Pressable
          onPress={handleBack}
          className="mt-5 rounded-2xl bg-emerald-700 px-5 py-2.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
        >
          <Text className="text-xs font-bold text-white">{t('common.goBack')}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const totalSteps = recipe.instructions.length;
  const doneSteps = completedSteps.size;
  const progress = totalSteps ? doneSteps / totalSteps : 0;
  const allDone = totalSteps > 0 && doneSteps === totalSteps;

  const handleShare = async () => {
    try {
      await Share.share({ title: recipe.name, message: formatRecipeForShare(recipe, language) });
    } catch (err) {
      console.error('[RecipeDetail] Share failed:', err);
      showToast(t('recipeDetail.shareFailedTitle'), t('recipeDetail.shareFailedDesc'), 'error');
    }
  };

  const resetProgress = () => {
    setCheckedIngredients(new Set());
    setCompletedSteps(new Set());
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      {/* Top action bar */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={handleBack}
          accessibilityLabel={t('recipeDetail.goBackA11y')}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#edf2ee' : '#1c2420'} />
        </Pressable>
        <Text className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
          {isFavoriteSource
            ? t('recipeDetail.favoriteBadge')
            : t('recipeDetail.recipeBadge', { num: recipeIndex + 1 })}
        </Text>
        <View className="flex-row">
          <Pressable
            onPress={handleShare}
            accessibilityLabel={t('recipeDetail.shareRecipeA11y')}
            className="mr-2 h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <Share2 size={16} color={isDark ? '#edf2ee' : '#475569'} />
          </Pressable>
          <FavoriteButton recipe={recipe} imageUri={imageUri} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipe Title & Meta Header */}
        <View className="mb-5 rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
          <Text className="text-xl font-bold leading-7 text-stone-900 dark:text-stone-100">
            {recipe.name}
          </Text>
          <View className="mt-3.5">
            <RecipeMetaChips recipe={recipe} size="md" />
          </View>

          {/* Progress bar */}
          <View className="mt-5">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="text-xs font-medium text-stone-500 dark:text-stone-400">
                {t('recipeDetail.cookingProgress')}
              </Text>
              <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                {t('recipeDetail.stepsProgress', { done: doneSteps, total: totalSteps })}
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <View
                className="h-full rounded-full bg-emerald-700 dark:bg-emerald-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </View>
          </View>
        </View>

        {/* Ingredients section */}
        <View className="mb-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ShoppingBasket size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-base font-bold text-stone-900 dark:text-stone-100">
                {t('recipeDetail.ingredients')}
              </Text>
            </View>
            <Text className="text-xs text-stone-500 dark:text-stone-400">
              {t('recipeDetail.ingredientsReady', {
                ready: checkedIngredients.size,
                total: recipe.ingredients.length,
              })}
            </Text>
          </View>

          <View className="rounded-3xl border border-stone-200/90 bg-white p-4 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
            {recipe.ingredients.map((ingredient, idx) => {
              const checked = checkedIngredients.has(idx);
              return (
                <Pressable
                  key={`ing-${idx}`}
                  onPress={() => setCheckedIngredients((prev) => toggleInSet(prev, idx))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  className={`flex-row items-center py-2.5 active:opacity-70 ${
                    idx < recipe.ingredients.length - 1
                      ? 'border-b border-stone-100 dark:border-stone-800/70'
                      : ''
                  }`}
                >
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-md border ${
                      checked
                        ? 'border-emerald-700 bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {checked && <Check size={12} color="#ffffff" strokeWidth={2.5} />}
                  </View>
                  <Text
                    className={`ml-3 flex-1 text-xs font-medium leading-5 ${
                      checked
                        ? 'text-stone-400 line-through dark:text-stone-500'
                        : 'text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    {ingredient}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Steps section */}
        <View>
          <View className="mb-2.5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ListOrdered size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-base font-bold text-stone-900 dark:text-stone-100">
                {t('recipeDetail.instructions')}
              </Text>
            </View>
          </View>
          <Text className="mb-3 text-xs text-stone-400 dark:text-stone-500">
            {t('recipeDetail.tapStepHint')}
          </Text>
          <InstructionList
            instructions={recipe.instructions}
            completedSteps={completedSteps}
            onToggleStep={(idx) => setCompletedSteps((prev) => toggleInSet(prev, idx))}
          />
        </View>

        {/* Completion banner */}
        {allDone && (
          <View className="mt-2 items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm dark:border-emerald-800/40 dark:bg-emerald-950/30">
            <PartyPopper size={26} color={isDark ? '#52b788' : '#2d6a4f'} />
            <Text className="mt-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
              {t('recipeDetail.bonAppetit')}
            </Text>
            <Text className="mt-1 text-center text-xs text-emerald-700 dark:text-emerald-300">
              {t('recipeDetail.enjoyMeal')}
            </Text>
          </View>
        )}

        {/* Reset progress */}
        {(doneSteps > 0 || checkedIngredients.size > 0) && (
          <Pressable
            onPress={resetProgress}
            className="mt-4 flex-row items-center justify-center self-center rounded-2xl border border-stone-200/90 bg-white px-4 py-2.5 shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <RotateCcw size={14} color={isDark ? '#9ca9a1' : '#64748b'} />
            <Text className="ml-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
              {t('recipeDetail.resetProgress')}
            </Text>
          </Pressable>
        )}

        <Text className="mt-6 text-center text-[11px] text-stone-400 dark:text-stone-500">
          {t('recipeDetail.nutritionNotice')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
