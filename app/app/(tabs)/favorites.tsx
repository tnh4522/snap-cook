import React, { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Search, X } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/EmptyState';
import { RecipeCard } from '@/components/RecipeCard';
import { useI18n } from '@/i18n';

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, clearFavorites } = useLibrary();
  const { isDark } = useTheme();
  const { t } = useI18n();
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
    Alert.alert(t('favorites.clearAllTitle'), t('favorites.clearAllDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.clear'), style: 'destructive', onPress: clearFavorites },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t('favorites.title')}
          </Text>
          <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {t('favorites.savedRecipes', {
              count: favorites.length,
              unit: favorites.length === 1 ? t('common.recipe') : t('common.recipes'),
            })}
          </Text>
        </View>
        {favorites.length > 0 && (
          <Pressable
            onPress={confirmClearAll}
            className="rounded-xl border border-rose-200/90 bg-rose-50 px-3.5 py-2 active:opacity-75 dark:border-rose-900/40 dark:bg-rose-950/40"
          >
            <Text className="text-xs font-semibold text-rose-700 dark:text-rose-300">
              {t('common.clearAll')}
            </Text>
          </Pressable>
        )}
      </View>

      {favorites.length > 0 && (
        <View className="mx-6 mb-4 flex-row items-center rounded-2xl border border-stone-200/90 bg-white px-3.5 shadow-sm dark:border-stone-800/80 dark:bg-[#1a1d1f]">
          <Search size={16} color={isDark ? '#68746d' : '#84948a'} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('favorites.searchPlaceholder')}
            placeholderTextColor={isDark ? '#68746d' : '#84948a'}
            className="ml-2 flex-1 py-3 text-xs text-stone-800 dark:text-stone-100"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={15} color={isDark ? '#9ca9a1' : '#64748b'} />
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
              icon={<Heart size={38} color={isDark ? '#68746d' : '#84948a'} />}
              title={t('favorites.emptyTitle')}
              message={t('favorites.emptyDesc')}
              actionLabel={t('favorites.emptyAction')}
              onAction={() => router.navigate('/')}
            />
          ) : (
            <Text className="mt-10 text-center text-xs text-stone-400 dark:text-stone-500">
              {t('favorites.noMatch', { query })}
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
