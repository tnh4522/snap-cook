import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Carrot, Sparkles } from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { useTheme } from '@/context/ThemeContext';
import { RecipeCard } from '@/components/RecipeCard';
import { EmptyState } from '@/components/EmptyState';
import { SafeImage } from '@/components/SafeImage';
import { useI18n } from '@/i18n';

export default function RecipesResultsScreen() {
  const router = useRouter();
  const { recipes, detectedIngredients, capturedImageUri, resetSession } = useRecipes();
  const { isDark } = useTheme();
  const { t } = useI18n();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleScanAgain = () => {
    resetSession();
    router.dismissTo('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      {/* Header bar */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={handleBack}
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
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
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
            <View className="flex-row flex-wrap gap-2">
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
          recipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.name}-${index}`}
              recipe={recipe}
              index={index}
              imageUri={capturedImageUri}
              onPress={() => router.push(`/recipe/${index}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
