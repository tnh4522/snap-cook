import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import {
  Check,
  Globe,
  Laptop,
  Leaf,
  Minus,
  Moon,
  Palette,
  Plus,
  Server,
  Sun,
  Trash2,
  Users,
} from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { ThemeMode, useTheme } from '@/context/ThemeContext';
import { API_BASE_URL, BackendHealth, checkBackendHealth } from '@/services/api';
import { DietOption } from '@/types/recipe';
import { getDietOptions, LANGUAGE_OPTIONS } from '@/utils/recipe';
import { useI18n } from '@/i18n';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-3 mt-6">
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-2.5 text-base font-bold text-stone-800 dark:text-stone-100">{title}</Text>
      </View>
      {subtitle && (
        <Text className="mt-1 text-xs text-stone-500 dark:text-stone-400">{subtitle}</Text>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, updatePreferences, history, favorites, clearHistory, clearFavorites } =
    useLibrary();
  const { themeMode, setThemeMode, isDark, colors } = useTheme();
  const { showToast } = useToast();
  const { t, language } = useI18n();
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [checking, setChecking] = useState(false);

  const dietOptions = getDietOptions(language);

  const runHealthCheck = useCallback(async () => {
    setChecking(true);
    setHealth(await checkBackendHealth());
    setChecking(false);
  }, []);

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const toggleDiet = (value: DietOption) => {
    const next = preferences.diet.includes(value)
      ? preferences.diet.filter((d) => d !== value)
      : [...preferences.diet, value];
    updatePreferences({ diet: next });
  };

  const changeServings = (delta: number) => {
    const next = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, preferences.servings + delta));
    updatePreferences({ servings: next });
  };

  const confirmClear = (what: 'history' | 'favorites') => {
    const isHistory = what === 'history';
    Alert.alert(
      isHistory ? t('settings.clearHistoryConfirmTitle') : t('settings.clearFavoritesConfirmTitle'),
      t('settings.cannotBeUndone'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: () => {
            if (isHistory) clearHistory();
            else clearFavorites();
            showToast(
              t('settings.clearedTitle'),
              isHistory ? t('settings.historyClearedDesc') : t('settings.favoritesClearedDesc'),
              'success'
            );
          },
        },
      ]
    );
  };

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
    { value: 'system', label: t('settings.themeSystem') },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          <Text className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {t('settings.title')}
          </Text>
          <Text className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {t('settings.subtitle')}
          </Text>
        </View>

        {/* Theme mode selection */}
        <SectionHeader
          icon={<Palette size={18} color={isDark ? '#60a5fa' : '#2563eb'} />}
          title={t('settings.themeTitle')}
          subtitle={t('settings.themeSubtitle')}
        />
        <View
          className="flex-row rounded-2xl p-1"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? '#1a1d1f' : '#f1f3f2',
          }}
        >
          {themeOptions.map((opt) => {
            const active = themeMode === opt.value;
            const iconColor = active
              ? isDark ? '#52b788' : '#2d6a4f'
              : isDark ? '#9ca9a1' : '#64748b';

            return (
              <Pressable
                key={opt.value}
                onPress={() => setThemeMode(opt.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 active:opacity-80"
                style={{
                  backgroundColor: active ? (isDark ? '#272b2e' : '#ffffff') : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? (isDark ? '#3d4447' : '#e2e6e3') : 'transparent',
                  shadowColor: active ? '#000' : 'transparent',
                  shadowOpacity: active ? (isDark ? 0.3 : 0.05) : 0,
                  shadowRadius: 2,
                  elevation: active ? 1 : 0,
                }}
              >
                {opt.value === 'light' && <Sun size={15} color={iconColor} />}
                {opt.value === 'dark' && <Moon size={15} color={iconColor} />}
                {opt.value === 'system' && <Laptop size={15} color={iconColor} />}
                <Text
                  className="ml-1.5 text-xs font-semibold"
                  style={{
                    color: active
                      ? isDark ? '#edf2ee' : '#1c2420'
                      : isDark ? '#84948a' : '#546359',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* App Language */}
        <SectionHeader
          icon={<Globe size={18} color={isDark ? '#5eead4' : '#0d9488'} />}
          title={t('settings.appLanguageTitle')}
          subtitle={t('settings.appLanguageSubtitle')}
        />
        <View
          className="flex-row rounded-2xl p-1"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: isDark ? '#1a1d1f' : '#f1f3f2',
          }}
        >
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = preferences.language === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => updatePreferences({ language: opt.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className="flex-1 items-center justify-center rounded-xl py-2.5 active:opacity-80"
                style={{
                  backgroundColor: active ? (isDark ? '#272b2e' : '#ffffff') : 'transparent',
                  borderWidth: 1,
                  borderColor: active ? (isDark ? '#3d4447' : '#e2e6e3') : 'transparent',
                  shadowColor: active ? '#000' : 'transparent',
                  shadowOpacity: active ? (isDark ? 0.3 : 0.05) : 0,
                  shadowRadius: 2,
                  elevation: active ? 1 : 0,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active
                      ? isDark ? '#edf2ee' : '#1c2420'
                      : isDark ? '#84948a' : '#546359',
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dietary preferences */}
        <SectionHeader
          icon={<Leaf size={18} color={isDark ? '#52b788' : '#2d6a4f'} />}
          title={t('settings.dietTitle')}
          subtitle={t('settings.dietSubtitle')}
        />
        <View className="flex-row flex-wrap gap-2">
          {dietOptions.map((opt) => {
            const active = preferences.diet.includes(opt.value);
            return (
              <Pressable
                key={opt.value}
                onPress={() => toggleDiet(opt.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                className="flex-row items-center rounded-2xl px-3.5 py-2 active:opacity-80"
                style={{
                  backgroundColor: active
                    ? (isDark ? '#193325' : '#eaf4ee')
                    : (isDark ? '#1a1d1f' : '#ffffff'),
                  borderWidth: 1,
                  borderColor: active
                    ? (isDark ? '#29543d' : '#bddcc9')
                    : colors.border,
                }}
              >
                {active && (
                  <Check size={14} color={isDark ? '#52b788' : '#2d6a4f'} />
                )}
                <Text
                  className="text-xs font-semibold"
                  style={{
                    marginLeft: active ? 6 : 0,
                    color: active
                      ? (isDark ? '#86efac' : '#23563f')
                      : colors.textSecondary,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Servings */}
        <SectionHeader
          icon={<Users size={18} color={isDark ? '#c084fc' : '#7c3aed'} />}
          title={t('settings.servingsTitle')}
        />
        <View
          className="flex-row items-center justify-between rounded-2xl p-2.5 shadow-sm"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => changeServings(-1)}
            disabled={preferences.servings <= MIN_SERVINGS}
            accessibilityLabel={t('settings.decreaseServings')}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: isDark ? '#24292b' : '#f1f3f2',
              opacity: preferences.servings <= MIN_SERVINGS ? 0.35 : 1,
            }}
          >
            <Minus size={16} color={colors.text} />
          </Pressable>
          <Text
            className="text-base font-extrabold"
            style={{ color: colors.text }}
          >
            {preferences.servings}{' '}
            {preferences.servings === 1 ? t('common.person') : t('common.people')}
          </Text>
          <Pressable
            onPress={() => changeServings(1)}
            disabled={preferences.servings >= MAX_SERVINGS}
            accessibilityLabel={t('settings.increaseServings')}
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-75"
            style={{
              backgroundColor: isDark ? '#24292b' : '#f1f3f2',
              opacity: preferences.servings >= MAX_SERVINGS ? 0.35 : 1,
            }}
          >
            <Plus size={16} color={colors.text} />
          </Pressable>
        </View>

        {/* Backend status */}
        <SectionHeader
          icon={<Server size={18} color={isDark ? '#fbbf24' : '#b45309'} />}
          title={t('settings.serverStatusTitle')}
        />
        <View
          className="rounded-2xl p-4 shadow-sm"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text className="text-xs" style={{ color: colors.textMuted }} numberOfLines={1}>
            {API_BASE_URL}
          </Text>
          <View className="mt-2.5 flex-row items-center justify-between">
            {checking || !health ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: health.online
                        ? (isDark ? '#52b788' : '#2d6a4f')
                        : colors.danger,
                    }}
                  />
                  <Text className="ml-2 text-xs font-bold" style={{ color: colors.text }}>
                    {health.online
                      ? t('settings.onlineWithLatency', { latency: health.latencyMs ?? 0 })
                      : t('settings.unreachable')}
                  </Text>
                </View>
                {health.online && (
                  <Text className="mt-1 text-xs" style={{ color: colors.textSecondary }}>
                    {t('settings.serverDetails', {
                      ai: health.geminiConfigured
                        ? t('settings.aiConfigured')
                        : t('settings.aiMissing'),
                      sync: health.supabaseConfigured
                        ? t('settings.cloudSyncOn')
                        : t('settings.cloudSyncOff'),
                    })}
                  </Text>
                )}
              </View>
            )}
            <Pressable
              onPress={runHealthCheck}
              disabled={checking}
              className="ml-3 rounded-xl px-3.5 py-2 active:opacity-75"
              style={{ backgroundColor: isDark ? '#24292b' : '#f1f3f2' }}
            >
              <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                {t('settings.check')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Data */}
        <SectionHeader
          icon={<Trash2 size={18} color={colors.danger} />}
          title={t('settings.dataTitle')}
        />
        <View
          className="rounded-2xl shadow-sm overflow-hidden"
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable
            onPress={() => confirmClear('history')}
            disabled={history.length === 0}
            className="flex-row items-center justify-between p-4"
            style={{
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
              opacity: history.length === 0 ? 0.35 : 1,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {t('settings.clearHistory')}
            </Text>
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {history.length} {t('common.items')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => confirmClear('favorites')}
            disabled={favorites.length === 0}
            className="flex-row items-center justify-between p-4"
            style={{
              opacity: favorites.length === 0 ? 0.35 : 1,
            }}
          >
            <Text className="text-xs font-semibold" style={{ color: colors.text }}>
              {t('settings.clearFavorites')}
            </Text>
            <Text className="text-xs" style={{ color: colors.textMuted }}>
              {favorites.length} {t('common.items')}
            </Text>
          </Pressable>
        </View>

        <Text className="mt-8 text-center text-[11px]" style={{ color: colors.textMuted }}>
          {t('settings.footer', { version: Constants.expoConfig?.version ?? '1.0.0' })}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
