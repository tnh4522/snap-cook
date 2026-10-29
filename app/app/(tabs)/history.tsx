import React from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, History as HistoryIcon, Trash2 } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useRecipes } from '@/context/RecipeContext';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/EmptyState';
import { SafeImage } from '@/components/SafeImage';
import { ScanSession } from '@/types/recipe';
import { formatRelativeDate } from '@/utils/recipe';
import { useI18n } from '@/i18n';

export default function HistoryScreen() {
  const router = useRouter();
  const { history, removeHistorySession, clearHistory } = useLibrary();
  const { openSession } = useRecipes();
  const { isDark } = useTheme();
  const { t, language } = useI18n();

  const handleOpen = (session: ScanSession) => {
    openSession(session);
    router.push('/recipes');
  };

  const confirmDelete = (session: ScanSession) => {
    Alert.alert(t('history.deleteTitle'), t('history.deleteDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => removeHistorySession(session.id),
      },
    ]);
  };

  const confirmClearAll = () => {
    Alert.alert(t('history.clearAllTitle'), t('history.clearAllDesc'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.clear'), style: 'destructive', onPress: clearHistory },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t('history.title')}
          </Text>
          <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {t('history.savedScans', {
              count: history.length,
              unit: history.length === 1 ? t('common.scan') : t('common.scans'),
            })}
          </Text>
        </View>
        {history.length > 0 && (
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

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon={<HistoryIcon size={38} color={isDark ? '#68746d' : '#84948a'} />}
            title={t('history.emptyTitle')}
            message={t('history.emptyDesc')}
            actionLabel={t('history.emptyAction')}
            onAction={() => router.navigate('/')}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleOpen(item)}
            onLongPress={() => confirmDelete(item)}
            className="mb-3 flex-row items-center rounded-3xl border border-stone-200/90 bg-white p-3.5 shadow-sm active:opacity-85 dark:border-stone-800/80 dark:bg-[#1a1d1f]"
          >
            <SafeImage uri={item.imageUri} className="h-16 w-16 rounded-2xl" />
            <View className="ml-3.5 flex-1">
              <Text className="text-sm font-bold text-stone-800 dark:text-stone-100" numberOfLines={1}>
                {item.recipes.map((r) => r.name).join(' · ')}
              </Text>
              <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400" numberOfLines={1}>
                {item.detectedIngredients.length > 0
                  ? item.detectedIngredients.join(', ')
                  : `${item.recipes.length} ${t('common.recipes')}`}
              </Text>
              <Text className="mt-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                {formatRelativeDate(item.createdAt, language)}
              </Text>
            </View>
            <Pressable
              onPress={() => confirmDelete(item)}
              hitSlop={8}
              accessibilityLabel={t('history.deleteA11y')}
              className="ml-2 h-9 w-9 items-center justify-center rounded-xl bg-stone-100 active:opacity-75 dark:bg-stone-800"
            >
              <Trash2 size={15} color={isDark ? '#f87171' : '#be123c'} />
            </Pressable>
            <ChevronRight size={17} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginLeft: 6 }} />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
