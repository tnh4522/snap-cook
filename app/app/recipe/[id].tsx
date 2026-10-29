import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ListOrdered,
  Minus,
  PartyPopper,
  Plus,
  RotateCcw,
  Share2,
  ShoppingBasket,
  Users,
  Utensils,
} from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { useLibrary } from '@/context/LibraryContext';
import { useHealth } from '@/context/HealthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { InstructionList } from '@/components/InstructionList';
import { FavoriteButton } from '@/components/FavoriteButton';
import { RecipeMetaChips } from '@/components/RecipeMetaChips';
import { SafeImage } from '@/components/SafeImage';
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
  const { logMeal } = useHealth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const { t, language } = useI18n();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isMealLogged, setIsMealLogged] = useState(false);

  const isFavoriteSource = source === 'favorite';
  const favorite = isFavoriteSource ? favorites.find((f) => f.key === id) : undefined;
  const recipeIndex = Number(id ?? 0);
  const liveRecipe = isFavoriteSource ? favorite?.recipe : recipes[recipeIndex];
  // Keep showing the recipe even if it gets un-favorited / session reset while this screen is open.
  const snapshotRef = useRef(liveRecipe);
  if (liveRecipe) snapshotRef.current = liveRecipe;
  const recipe = liveRecipe ?? snapshotRef.current;
  const imageUri = isFavoriteSource ? favorite?.imageUri : capturedImageUri;

  const baseServings = Math.max(1, recipe?.servings || 2);
  const [servings, setServings] = useState(baseServings);
  const servingMultiplier = servings / baseServings;
  const scaledCalories = Math.round((recipe?.calories || 0) * servingMultiplier);

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
          hitSlop={8}
          accessibilityRole="button"
          className="mt-5 min-h-[44px] items-center justify-center rounded-2xl bg-emerald-700 px-5 py-2.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
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

  const allIngredientsChecked =
    recipe.ingredients.length > 0 && checkedIngredients.size === recipe.ingredients.length;

  const handleToggleAllIngredients = () => {
    if (allIngredientsChecked) {
      setCheckedIngredients(new Set());
    } else {
      setCheckedIngredients(new Set(recipe.ingredients.map((_, i) => i)));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({ title: recipe.name, message: formatRecipeForShare(recipe, language) });
    } catch (err) {
      console.error('[RecipeDetail] Share failed:', err);
      showToast(t('recipeDetail.shareFailedTitle'), t('recipeDetail.shareFailedDesc'), 'error');
    }
  };

  const handleLogToDiary = () => {
    if (isMealLogged) return;
    logMeal({
      meal_type: 'lunch',
      food_name: recipe.name,
      portion_description: `${servings} ${
        servings === 1 ? t('common.person') : t('common.servings')
      }`,
      portion_multiplier: servingMultiplier,
      estimated_grams: Math.round(350 * servingMultiplier),
      calories: scaledCalories,
      protein_g: Math.round((scaledCalories * 0.22) / 4),
      carbs_g: Math.round((scaledCalories * 0.5) / 4),
      fat_g: Math.round((scaledCalories * 0.28) / 9),
      fiber_g: Math.round(4 * servingMultiplier),
      health_score: 85,
      ai_advice: 'Cooked from fresh kitchen ingredients.',
      imageUri: imageUri ?? undefined,
    });
    setIsMealLogged(true);
    showToast(
      t('recipeDetail.mealLoggedTitle'),
      t('recipeDetail.mealLoggedDesc', { name: recipe.name, calories: scaledCalories }),
      'success'
    );
  };

  const resetProgress = () => {
    setCheckedIngredients(new Set());
    setCompletedSteps(new Set());
    setServings(baseServings);
    setIsMealLogged(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      {/* Top action bar */}
      <View className="flex-row items-center justify-between px-6 py-3.5">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityLabel={t('recipeDetail.goBackA11y')}
          accessibilityRole="button"
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#edf2ee' : '#1c2420'} />
        </Pressable>
        <Text className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
          {isFavoriteSource
            ? t('recipeDetail.favoriteBadge')
            : t('recipeDetail.recipeBadge', { num: recipeIndex + 1 })}
        </Text>
        <View className="flex-row items-center">
          <Pressable
            onPress={handleShare}
            hitSlop={8}
            accessibilityLabel={t('recipeDetail.shareRecipeA11y')}
            accessibilityRole="button"
            className="mr-2 h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <Share2 size={16} color={isDark ? '#edf2ee' : '#475569'} />
          </Pressable>
          <FavoriteButton recipe={recipe} imageUri={imageUri} />
        </View>
      </View>

      {/* Sticky cooking progress bar */}
      <View className="h-1 w-full bg-stone-200/50 dark:bg-stone-800/50">
        <View
          className="h-full bg-emerald-600 dark:bg-emerald-500"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Scanned Recipe Hero Photo Banner */}
        {imageUri && (
          <View className="mb-4 overflow-hidden rounded-3xl border border-stone-200/90 bg-stone-100 shadow-sm dark:border-stone-800 dark:bg-stone-900">
            <SafeImage uri={imageUri} className="h-44 w-full" />
            <View className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md">
              <Text className="text-[11px] font-medium text-white">
                {t('recipes.scannedPhoto')}
              </Text>
            </View>
          </View>
        )}

        {/* Recipe Title & Meta Header */}
        <View className="mb-5 rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
          <Text className="text-xl font-bold leading-7 text-stone-900 dark:text-stone-100">
            {recipe.name}
          </Text>
          <View className="mt-3.5">
            <RecipeMetaChips recipe={recipe} size="md" />
          </View>

          {/* Servings Scaler */}
          <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-stone-200/80 bg-stone-50/80 px-3.5 py-2.5 dark:border-stone-800 dark:bg-stone-800/40">
            <View className="flex-row items-center">
              <Users size={15} color={isDark ? '#86efac' : '#2d6a4f'} />
              <Text className="ml-2 text-xs font-semibold text-stone-700 dark:text-stone-200">
                {servings === 1 ? `1 ${t('common.person')}` : `${servings} ${t('common.servings')}`}
                {servingMultiplier !== 1 && (
                  <Text className="text-[11px] font-normal text-stone-500 dark:text-stone-400">
                    {` · ${scaledCalories} kcal (${servingMultiplier.toFixed(1)}x)`}
                  </Text>
                )}
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <Pressable
                onPress={() => setServings((s) => Math.max(1, s - 1))}
                disabled={servings <= 1}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Decrease servings"
                className="h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-30 active:opacity-75 dark:border-stone-700 dark:bg-[#1a1d1f]"
              >
                <Minus size={13} color={isDark ? '#edf2ee' : '#1c2420'} />
              </Pressable>
              <Text className="w-5 text-center text-xs font-bold text-stone-800 dark:text-stone-100">
                {servings}
              </Text>
              <Pressable
                onPress={() => setServings((s) => Math.min(12, s + 1))}
                disabled={servings >= 12}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Increase servings"
                className="h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white disabled:opacity-30 active:opacity-75 dark:border-stone-700 dark:bg-[#1a1d1f]"
              >
                <Plus size={13} color={isDark ? '#edf2ee' : '#1c2420'} />
              </Pressable>
            </View>
          </View>

          {/* Progress bar card */}
          <View className="mt-4">
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
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-stone-500 dark:text-stone-400">
                {t('recipeDetail.ingredientsReady', {
                  ready: checkedIngredients.size,
                  total: recipe.ingredients.length,
                })}
              </Text>
              {recipe.ingredients.length > 1 && (
                <Pressable
                  onPress={handleToggleAllIngredients}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={
                    allIngredientsChecked
                      ? t('recipeDetail.unselectAll')
                      : t('recipeDetail.selectAll')
                  }
                  className="flex-row items-center rounded-xl border border-stone-200/90 bg-stone-50 px-2.5 py-1 active:opacity-75 dark:border-stone-800 dark:bg-stone-800/70"
                >
                  <CheckCheck size={12} color={isDark ? '#86efac' : '#2d6a4f'} />
                  <Text className="ml-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    {allIngredientsChecked
                      ? t('recipeDetail.unselectAll')
                      : t('recipeDetail.selectAll')}
                  </Text>
                </Pressable>
              )}
            </View>
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
                  accessibilityLabel={`${ingredient}, ${
                    checked ? 'ready' : 'not ready'
                  }`}
                  hitSlop={6}
                  className={`flex-row items-center min-h-[46px] py-2.5 px-1 rounded-xl active:bg-stone-50 dark:active:bg-stone-800/40 ${
                    idx < recipe.ingredients.length - 1
                      ? 'border-b border-stone-100 dark:border-stone-800/70'
                      : ''
                  }`}
                >
                  <View
                    className={`h-5.5 w-5.5 items-center justify-center rounded-lg border ${
                      checked
                        ? 'border-emerald-700 bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500'
                        : 'border-stone-300 dark:border-stone-600'
                    }`}
                  >
                    {checked && <Check size={13} color="#ffffff" strokeWidth={2.5} />}
                  </View>
                  <Text
                    className={`ml-3.5 flex-1 text-sm font-medium leading-6 ${
                      checked
                        ? 'text-stone-400 line-through dark:text-stone-500'
                        : 'text-stone-800 dark:text-stone-200'
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
          <Text className="mb-3 text-xs text-stone-500 dark:text-stone-400">
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
          <View className="mt-3 items-center rounded-3xl border border-emerald-300/80 bg-emerald-50/80 p-5 shadow-sm dark:border-emerald-700/50 dark:bg-emerald-950/40">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/60">
              <PartyPopper size={26} color={isDark ? '#52b788' : '#2d6a4f'} />
            </View>
            <Text className="mt-2.5 text-base font-extrabold text-emerald-900 dark:text-emerald-100">
              {t('recipeDetail.bonAppetit')}
            </Text>
            <Text className="mt-1 text-center text-xs leading-5 text-emerald-800/90 dark:text-emerald-300">
              {t('recipeDetail.enjoyMeal')}
            </Text>

            {/* Quick Completion Actions: Log Meal & Share */}
            <View className="mt-4 flex-row w-full gap-2.5">
              <Pressable
                onPress={handleLogToDiary}
                disabled={isMealLogged}
                hitSlop={6}
                accessibilityRole="button"
                className={`flex-1 flex-row items-center justify-center rounded-2xl py-3 px-3 shadow-sm active:opacity-85 ${
                  isMealLogged
                    ? 'bg-emerald-200/80 dark:bg-emerald-900/40'
                    : 'bg-emerald-700 dark:bg-emerald-600'
                }`}
              >
                {isMealLogged ? (
                  <Check size={15} color={isDark ? '#86efac' : '#064e3b'} strokeWidth={2.2} />
                ) : (
                  <Utensils size={15} color="#ffffff" strokeWidth={2.2} />
                )}
                <Text
                  className={`ml-1.5 text-xs font-bold ${
                    isMealLogged
                      ? 'text-emerald-900 dark:text-emerald-200'
                      : 'text-white'
                  }`}
                >
                  {isMealLogged ? t('recipeDetail.mealLoggedBadge') : t('recipeDetail.logMealButton')}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleShare}
                hitSlop={6}
                accessibilityRole="button"
                className="flex-row items-center justify-center rounded-2xl border border-emerald-600/30 bg-white/90 px-4 py-3 active:opacity-75 dark:border-emerald-500/30 dark:bg-[#1a1d1f]"
              >
                <Share2 size={15} color={isDark ? '#86efac' : '#2d6a4f'} />
                <Text className="ml-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {t('common.share')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Reset progress */}
        {(doneSteps > 0 || checkedIngredients.size > 0) && (
          <Pressable
            onPress={resetProgress}
            hitSlop={8}
            accessibilityRole="button"
            className="mt-4 flex-row items-center justify-center self-center min-h-[44px] rounded-2xl border border-stone-200/90 bg-white px-5 py-2.5 shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
          >
            <RotateCcw size={14} color={isDark ? '#9ca9a1' : '#64748b'} />
            <Text className="ml-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
              {t('recipeDetail.resetProgress')}
            </Text>
          </Pressable>
        )}

        <Text className="mt-6 text-center text-[11px] text-stone-500 dark:text-stone-400">
          {t('recipeDetail.nutritionNotice')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
