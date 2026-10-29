import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, History as HistoryIcon, Trash2 } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useRecipes } from '@/context/RecipeContext';
import { EmptyState } from '@/components/EmptyState';
import { SafeImage } from '@/components/SafeImage';
import { ScanSession } from '@/types/recipe';
import { formatRelativeDate } from '@/utils/recipe';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, removeHistorySession, clearHistory } = useLibrary();
  const { openSession } = useRecipes();

  const handleOpen = (session: ScanSession) => {
    openSession(session);
    router.push('/recipes');
  };

  const confirmDelete = (session: ScanSession) => {
    Alert.alert('Delete scan?', 'This scan and its recipes will be removed from history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeHistorySession(session.id) },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert('Clear all history?', 'Favorited recipes will be kept.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-2xl font-extrabold text-white">Scan History</Text>
          <Text className="text-xs text-slate-400">
            {history.length} saved {history.length === 1 ? 'scan' : 'scans'}
          </Text>
        </View>
        {history.length > 0 && (
          <Pressable
            onPress={confirmClearAll}
            className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 active:opacity-75"
          >
            <Text className="text-xs font-bold text-red-300">Clear all</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<HistoryIcon size={40} color="#64748b" />}
            title="No scans yet"
            message="Every photo you analyze is saved here so you can revisit the recipes anytime."
            actionLabel="Snap your fridge"
            onAction={() => router.navigate('/')}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpen(item)}
            onLongPress={() => confirmDelete(item)}
            className="mb-3 flex-row items-center rounded-3xl border border-slate-800 bg-slate-900/80 p-3.5 active:opacity-85"
          >
            <SafeImage uri={item.imageUri} className="h-16 w-16 rounded-2xl" />
            <View className="ml-4 flex-1">
              <Text className="text-sm font-bold text-white" numberOfLines={1}>
                {item.recipes.map((r) => r.name).join(' · ')}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-400" numberOfLines={1}>
                {item.detectedIngredients.length > 0
                  ? item.detectedIngredients.join(', ')
                  : `${item.recipes.length} recipes`}
              </Text>
              <Text className="mt-1 text-[11px] font-medium text-emerald-400">
                {formatRelativeDate(item.createdAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={8}
              accessibilityLabel="Delete scan"
              className="ml-2 h-9 w-9 items-center justify-center rounded-xl bg-slate-800 active:opacity-75"
            >
              <Trash2 size={16} color="#f87171" />
            </Pressable>
            <ChevronRight size={18} color="#64748b" style={{ marginLeft: 6 }} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
