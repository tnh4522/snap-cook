import React from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, Sparkles } from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { RecipeCard } from '@/components/RecipeCard';

export default function RecipesResultsScreen() {
  const router = useRouter();
  const { recipes, capturedImageUri, resetSession } = useRecipes();

  const handleScanAgain = () => {
    resetSession();
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
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
        {capturedImageUri && (
          <View className="mb-6 flex-row items-center rounded-3xl border border-slate-800 bg-slate-900/70 p-3.5">
            <Image
              source={{ uri: capturedImageUri }}
              className="h-16 w-16 rounded-2xl"
              resizeMode="cover"
            />
            <View className="ml-4 flex-1">
              <Text className="text-sm font-bold text-white">
                Scanned Ingredients Photo
              </Text>
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

        {recipes.length === 0 ? (
          <View className="mt-16 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <Camera size={40} color="#64748b" />
            <Text className="mt-4 text-center text-lg font-bold text-white">
              No Recipes Loaded Yet
            </Text>
            <Text className="mt-2 text-center text-sm text-slate-400">
              Take a photo of your fridge or pantry ingredients to generate AI recipes.
            </Text>
            <Pressable
              onPress={handleScanAgain}
              className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3"
            >
              <Text className="text-sm font-bold text-slate-950">Take a Photo</Text>
            </Pressable>
          </View>
        ) : (
          recipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.name}-${index}`}
              recipe={recipe}
              index={index}
              onPress={() => router.push(`/recipe/${index}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
