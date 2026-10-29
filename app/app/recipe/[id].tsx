import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, Flame, ListOrdered, ShoppingBasket } from 'lucide-react-native';
import { useRecipes } from '@/context/RecipeContext';
import { InstructionList } from '@/components/InstructionList';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recipes } = useRecipes();

  const recipeIndex = Number(id ?? 0);
  const recipe = recipes[recipeIndex];

  if (!recipe) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-lg font-bold text-white">Recipe not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 rounded-2xl bg-emerald-500 px-5 py-2.5"
        >
          <Text className="font-bold text-slate-950">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 active:opacity-75"
        >
          <ArrowLeft size={20} color="#f8fafc" />
        </Pressable>
        <Text className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          Recipe #{recipeIndex + 1}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Text className="text-2xl font-extrabold leading-8 text-white">
            {recipe.name}
          </Text>

          <View className="mt-4 flex-row items-center space-x-3">
            <View className="flex-row items-center rounded-full bg-amber-500/15 px-3.5 py-1.5">
              <Flame size={15} color="#fbbf24" />
              <Text className="ml-1.5 text-xs font-bold text-amber-300">
                {recipe.calories} Calories
              </Text>
            </View>
            <View className="ml-2 flex-row items-center rounded-full bg-emerald-500/15 px-3.5 py-1.5">
              <ShoppingBasket size={15} color="#34d399" />
              <Text className="ml-1.5 text-xs font-bold text-emerald-300">
                {recipe.ingredients.length} Ingredients
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center">
            <ShoppingBasket size={18} color="#34d399" />
            <Text className="ml-2 text-lg font-bold text-white">Ingredients</Text>
          </View>

          <View className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            {recipe.ingredients.map((ingredient, idx) => (
              <View
                key={`ing-${idx}`}
                className={`flex-row items-center py-2.5 ${
                  idx < recipe.ingredients.length - 1 ? 'border-b border-slate-800/80' : ''
                }`}
              >
                <CheckCircle2 size={16} color="#34d399" />
                <Text className="ml-3 flex-1 text-sm font-medium text-slate-200">
                  {ingredient}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <View className="mb-3 flex-row items-center">
            <ListOrdered size={18} color="#34d399" />
            <Text className="ml-2 text-lg font-bold text-white">
              Step-by-Step Instructions
            </Text>
          </View>
          <InstructionList instructions={recipe.instructions} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
