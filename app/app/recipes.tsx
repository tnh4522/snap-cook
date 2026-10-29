import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Carrot, Sparkles } from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { RecipeCard } from '@/components/RecipeCard';
import { EmptyState } from '@/components/EmptyState';
import { SafeImage } from '@/components/SafeImage';

export default function RecipesResultsScreen() {
  const router = useRouter();
  const { recipes, detectedIngredients, capturedImageUri, resetSession } = useRecipes();

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleScanAgain = () => {
    resetSession();
    router.dismissTo('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={handleBack}
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 active:opacity-75"
        >
          <ArrowLeft size={20} color="#f8fafc" />
        </Pressable>
        <View className="flex-row items-center">
          <Sparkles size={18} color="#34d399" />
          <Text className="ml-2 text-lg font-bold text-white">AI Chef Suggestions</Text>
        </View>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {recipes.length > 0 && (
          <View className="mb-4 flex-row items-center rounded-3xl border border-slate-800 bg-slate-900/70 p-3.5">
            <SafeImage uri={capturedImageUri} className="h-16 w-16 rounded-2xl" />
            <View className="ml-4 flex-1">
              <Text className="text-sm font-bold text-white">Scanned Ingredients Photo</Text>
              <Text className="mt-0.5 text-xs text-slate-400">
                Found {recipes.length} custom recipes tailored to your kitchen
              </Text>
            </View>
            <Pressable
              onPress={handleScanAgain}
              className="rounded-xl bg-emerald-500/15 px-3 py-2 active:opacity-75"
            >
              <Text className="text-xs font-bold text-emerald-400">Rescan</Text>
            </Pressable>
          </View>
        )}

        {detectedIngredients.length > 0 && (
          <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/50 p-4">
            <View className="mb-3 flex-row items-center">
              <Carrot size={16} color="#fb923c" />
              <Text className="ml-2 text-sm font-bold text-white">
                Detected ingredients ({detectedIngredients.length})
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {detectedIngredients.map((item, idx) => (
                <View
                  key={`det-${idx}`}
                  className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1"
                >
                  <Text className="text-xs font-medium text-orange-200">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {recipes.length === 0 ? (
          <EmptyState
            icon={<Camera size={40} color="#64748b" />}
            title="No Recipes Loaded Yet"
            message="Take a photo of your fridge or pantry ingredients to generate AI recipes."
            actionLabel="Take a Photo"
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
