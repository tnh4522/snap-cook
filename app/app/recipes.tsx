import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Camera,
  Carrot,
  Check,
  Plus,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { useTheme } from '@/context/ThemeContext';
import { RecipeCard } from '@/components/RecipeCard';
import { EmptyState } from '@/components/EmptyState';
import { SafeImage } from '@/components/SafeImage';
import { useI18n } from '@/i18n';

export default function RecipesResultsScreen() {
  const router = useRouter();
  const {
    recipes,
    detectedIngredients,
    capturedImageUri,
    resetSession,
    addDetectedIngredient,
  } = useRecipes();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const [sortBy, setSortBy] = useState<'default' | 'time' | 'calories'>('default');
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [newIngredientText, setNewIngredientText] = useState('');

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleScanAgain = () => {
    resetSession();
    router.dismissTo('/');
  };

  const handleToggleSort = () => {
    setSortBy((prev) => {
      if (prev === 'default') return 'time';
      if (prev === 'time') return 'calories';
      return 'default';
    });
  };

  const handleAddIngredient = () => {
    const trimmed = newIngredientText.trim();
    if (trimmed) {
      addDetectedIngredient(trimmed);
      setNewIngredientText('');
      setIsAddingIngredient(false);
    }
  };

  const sortedRecipes = useMemo(() => {
    if (sortBy === 'time') {
      return [...recipes].sort(
        (a, b) => (a.cooking_time_minutes ?? 999) - (b.cooking_time_minutes ?? 999)
      );
    }
    if (sortBy === 'calories') {
      return [...recipes].sort((a, b) => (a.calories ?? 0) - (b.calories ?? 0));
    }
    return recipes;
  }, [recipes, sortBy]);

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={handleBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('recipeDetail.goBackA11y')}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#edf2ee' : '#1c2420'} />
        </Pressable>
        <View className="flex-row items-center">
          <Sparkles size={17} color={isDark ? '#52b788' : '#2d6a4f'} />
          <Text className="ml-2 text-base font-bold text-stone-900 dark:text-stone-100">
            {t('recipes.title')}
          </Text>
        </View>
        <Pressable
          onPress={handleToggleSort}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('recipes.sortAndFilter')}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200/90 bg-white shadow-sm active:opacity-75 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <SlidersHorizontal size={18} color={sortBy !== 'default' ? '#2d6a4f' : isDark ? '#edf2ee' : '#1c2420'} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {sortBy !== 'default' && (
          <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-50/80 px-3.5 py-2 dark:border-emerald-500/30 dark:bg-emerald-950/40">
            <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              {sortBy === 'time'
                ? t('recipes.sortedByTime')
                : t('recipes.sortedByCalories')}
            </Text>
            <Pressable
              onPress={() => setSortBy('default')}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={t('recipes.resetSort')}
            >
              <Text className="text-xs font-bold text-emerald-700 underline dark:text-emerald-400">
                {t('recipes.resetSort')}
              </Text>
            </Pressable>
          </View>
        )}

        {recipes.length > 0 && (
          <View className="mb-4 flex-row items-center rounded-3xl border border-stone-200/90 bg-white p-3.5 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
            <SafeImage uri={capturedImageUri} className="h-16 w-16 rounded-2xl" />
            <View className="ml-3.5 flex-1">
              <Text className="text-xs font-bold text-stone-800 dark:text-stone-100">
                {t('recipes.scannedPhoto')}
              </Text>
              <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                {t('recipes.foundCustomRecipes', { count: recipes.length })}
              </Text>
            </View>
            <Pressable
              onPress={handleScanAgain}
              className="rounded-xl border border-emerald-600/20 bg-emerald-50 px-3 py-2 active:opacity-75 dark:border-emerald-500/30 dark:bg-emerald-950/40"
            >
              <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t('common.rescan')}
              </Text>
            </Pressable>
          </View>
        )}

        {detectedIngredients.length > 0 && (
          <View className="mb-5 rounded-3xl border border-stone-200/90 bg-white p-4 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
            <View className="mb-3 flex-row items-center">
              <Carrot size={16} color={isDark ? '#fb923c' : '#c2410c'} />
              <Text className="ml-2 text-xs font-bold text-stone-800 dark:text-stone-100">
                {t('recipes.detectedIngredients', { count: detectedIngredients.length })}
              </Text>
            </View>
            <View className="flex-row flex-wrap items-center gap-2">
              {detectedIngredients.map((item, idx) => (
                <View
                  key={`det-${idx}`}
                  className="rounded-full border border-amber-200 bg-amber-50/80 px-3 py-1 dark:border-amber-900/40 dark:bg-amber-950/30"
                >
                  <Text className="text-xs font-medium text-amber-900 dark:text-amber-200">
                    {item}
                  </Text>
                </View>
              ))}

              {isAddingIngredient ? (
                <View className="flex-row items-center rounded-full border border-emerald-500/40 bg-emerald-50/80 px-2 py-0.5 dark:border-emerald-500/30 dark:bg-emerald-950/50">
                  <TextInput
                    value={newIngredientText}
                    onChangeText={setNewIngredientText}
                    onSubmitEditing={handleAddIngredient}
                    returnKeyType="done"
                    autoFocus
                    placeholder={t('recipes.addIngredientPlaceholder')}
                    placeholderTextColor={isDark ? '#78909c' : '#94a3b8'}
                    className="h-7 text-xs font-semibold text-stone-900 dark:text-stone-100"
                    style={{ minWidth: 90 }}
                  />
                  <Pressable
                    onPress={handleAddIngredient}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t('recipes.addIngredient')}
                    className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-emerald-700 dark:bg-emerald-600"
                  >
                    <Check size={12} color="#ffffff" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setIsAddingIngredient(false);
                      setNewIngredientText('');
                    }}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.cancel')}
                    className="ml-1 h-6 w-6 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700"
                  >
                    <X size={12} color={isDark ? '#e2e8f0' : '#475569'} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setIsAddingIngredient(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={t('recipes.addIngredient')}
                  className="flex-row items-center rounded-full border border-dashed border-stone-300 bg-stone-50 px-3 py-1 active:opacity-75 dark:border-stone-700 dark:bg-stone-800/60"
                >
                  <Plus size={12} color={isDark ? '#9ca9a1' : '#64748b'} />
                  <Text className="ml-1 text-xs font-semibold text-stone-600 dark:text-stone-400">
                    {t('recipes.addIngredient')}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {recipes.length === 0 ? (
          <EmptyState
            icon={<Camera size={38} color={isDark ? '#68746d' : '#84948a'} />}
            title={t('recipes.emptyTitle')}
            message={t('recipes.emptyDesc')}
            actionLabel={t('recipes.emptyAction')}
            onAction={handleScanAgain}
          />
        ) : (
          sortedRecipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.name}-${index}`}
              recipe={recipe}
              index={index}
              imageUri={capturedImageUri}
              detectedIngredients={detectedIngredients}
              onPress={() => router.push(`/recipe/${index}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
