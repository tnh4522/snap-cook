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
import { InstructionList } from '@/components/InstructionList';
import { FavoriteButton } from '@/components/FavoriteButton';
import { RecipeMetaChips } from '@/components/RecipeMetaChips';
import { formatRecipeForShare } from '@/utils/recipe';

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
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950 px-6">
        <Text className="text-lg font-bold text-white">Recipe not found</Text>
        <Text className="mt-2 text-center text-sm text-slate-400">
          It may have been removed from your favorites or the session was reset.
        </Text>
        <Pressable onPress={handleBack} className="mt-4 rounded-2xl bg-emerald-500 px-5 py-2.5">
          <Text className="font-bold text-slate-950">Go Back</Text>
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
      await Share.share({ title: recipe.name, message: formatRecipeForShare(recipe) });
    } catch (err) {
      console.error('[RecipeDetail] Share failed:', err);
      showToast('Share Failed', 'Unable to open the share sheet.', 'error');
    }
  };

  const resetProgress = () => {
    setCheckedIngredients(new Set());
    setCompletedSteps(new Set());
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
        <Text className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
          {isFavoriteSource ? 'Favorite Recipe' : `Recipe #${recipeIndex + 1}`}
        </Text>
        <View className="flex-row">
          <Pressable
            onPress={handleShare}
            accessibilityLabel="Share recipe"
            className="mr-2 h-10 w-10 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 active:opacity-75"
          >
            <Share2 size={18} color="#e2e8f0" />
          </Pressable>
          <FavoriteButton recipe={recipe} imageUri={imageUri} />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <Text className="text-2xl font-extrabold leading-8 text-white">{recipe.name}</Text>
          <View className="mt-4">
            <RecipeMetaChips recipe={recipe} size="md" />
          </View>

          <View className="mt-5">
            <View className="mb-1.5 flex-row justify-between">
              <Text className="text-xs font-semibold text-slate-400">Cooking progress</Text>
              <Text className="text-xs font-bold text-emerald-400">
                {doneSteps}/{totalSteps} steps
              </Text>
            </View>
            <View className="h-2 overflow-hidden rounded-full bg-slate-800">
              <View
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </View>
          </View>
        </View>

        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ShoppingBasket size={18} color="#34d399" />
              <Text className="ml-2 text-lg font-bold text-white">Ingredients</Text>
            </View>
            <Text className="text-xs text-slate-400">
              {checkedIngredients.size}/{recipe.ingredients.length} ready
            </Text>
          </View>

          <View className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
            {recipe.ingredients.map((ingredient, idx) => {
              const checked = checkedIngredients.has(idx);
              return (
                <Pressable
                  key={`ing-${idx}`}
                  onPress={() => setCheckedIngredients((prev) => toggleInSet(prev, idx))}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked }}
                  className={`flex-row items-center py-2.5 active:opacity-70 ${
                    idx < recipe.ingredients.length - 1 ? 'border-b border-slate-800/80' : ''
                  }`}
                >
                  <View
                    className={`h-5 w-5 items-center justify-center rounded-md border ${
                      checked ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                    }`}
                  >
                    {checked && <Check size={12} color="#022c22" />}
                  </View>
                  <Text
                    className={`ml-3 flex-1 text-sm font-medium ${
                      checked ? 'text-slate-500 line-through' : 'text-slate-200'
                    }`}
                  >
                    {ingredient}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <ListOrdered size={18} color="#34d399" />
              <Text className="ml-2 text-lg font-bold text-white">Step-by-Step Instructions</Text>
            </View>
          </View>
          <Text className="mb-3 text-xs text-slate-500">Tap a step to mark it as done.</Text>
          <InstructionList
            instructions={recipe.instructions}
            completedSteps={completedSteps}
            onToggleStep={(idx) => setCompletedSteps((prev) => toggleInSet(prev, idx))}
          />
        </View>

        {allDone && (
          <View className="mt-2 items-center rounded-3xl border border-emerald-500/40 bg-emerald-950/40 p-5">
            <PartyPopper size={28} color="#34d399" />
            <Text className="mt-2 text-base font-bold text-white">Bon appétit!</Text>
            <Text className="mt-1 text-center text-xs text-slate-300">
              You finished every step. Enjoy your meal!
            </Text>
          </View>
        )}

        {(doneSteps > 0 || checkedIngredients.size > 0) && (
          <Pressable
            onPress={resetProgress}
            className="mt-4 flex-row items-center justify-center self-center rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 active:opacity-75"
          >
            <RotateCcw size={14} color="#94a3b8" />
            <Text className="ml-2 text-xs font-semibold text-slate-300">Reset progress</Text>
          </Pressable>
        )}

        <Text className="mt-6 text-center text-[11px] text-slate-600">
          Nutrition values are AI estimates. Check for allergens before cooking.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
