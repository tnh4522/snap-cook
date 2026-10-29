import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Search, X } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, clearFavorites } = useLibrary();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter(
      (f) =>
        f.recipe.name.toLowerCase().includes(q) ||
        f.recipe.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }, [favorites, query]);

  const confirmClearAll = () => {
    Alert.alert('Remove all favorites?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: clearFavorites },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-2xl font-extrabold text-white">Favorites</Text>
          <Text className="text-xs text-slate-400">
            {favorites.length} saved {favorites.length === 1 ? 'recipe' : 'recipes'}
          </Text>
        </View>
        {favorites.length > 0 && (
          <Pressable
            onPress={confirmClearAll}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 active:opacity-75"
          >
            <Text className="text-xs font-bold text-red-300">Clear all</Text>
          </Pressable>
        )}
      </View>

      {favorites.length > 0 && (
        <View className="mx-6 mb-4 flex-row items-center rounded-2xl border border-slate-800 bg-slate-900 px-3.5">
          <Search size={16} color="#64748b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name or ingredient"
            placeholderTextColor="#64748b"
            className="ml-2 flex-1 py-3 text-sm text-white"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.key}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          favorites.length === 0 ? (
            <EmptyState
              icon={<Heart size={40} color="#64748b" />}
              title="No favorites yet"
              message="Tap the heart on any recipe to keep it here for later."
              actionLabel="Find recipes"
              onAction={() => router.navigate('/')}
            />
          ) : (
            <Text className="mt-10 text-center text-sm text-slate-400">
              No favorites match “{query}”.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item.recipe}
            imageUri={item.imageUri}
            onPress={() =>
              router.push({
                pathname: '/recipe/[id]',
                params: { id: item.key, source: 'favorite' },
              })
            }
          />
        )}
      />
    </SafeAreaView>
  );
}
