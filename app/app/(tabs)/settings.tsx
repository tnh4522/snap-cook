import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Check, Globe, Leaf, Minus, Plus, Server, Trash2, Users } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useToast } from '@/context/ToastContext';
import { API_BASE_URL, BackendHealth, checkBackendHealth } from '@/services/api';
import { DietOption } from '@/types/recipe';
import { DIET_OPTIONS, LANGUAGE_OPTIONS } from '@/utils/recipe';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <View className="mb-3 mt-6">
      <View className="flex-row items-center">
        {icon}
        <Text className="ml-2 text-base font-bold text-white">{title}</Text>
      </View>
      {subtitle && <Text className="mt-1 text-xs text-slate-400">{subtitle}</Text>}
    </View>
  );
}

export default function SettingsScreen() {
  const { preferences, updatePreferences, history, favorites, clearHistory, clearFavorites } =
    useLibrary();
  const { showToast } = useToast();
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [checking, setChecking] = useState(false);

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
      isHistory ? 'Clear scan history?' : 'Remove all favorites?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            if (isHistory) clearHistory();
            else clearFavorites();
            showToast('Cleared', isHistory ? 'Scan history removed.' : 'Favorites removed.', 'success');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="py-4">
          <Text className="text-2xl font-extrabold text-white">Settings</Text>
          <Text className="text-xs text-slate-400">
            Preferences are applied to every new scan.
          </Text>
        </View>

        {/* Diet */}
        <SectionHeader
          icon={<Leaf size={18} color="#34d399" />}
          title="Dietary preferences"
          subtitle="AI will only suggest recipes that respect these."
        />
        <View className="flex-row flex-wrap gap-2">
          {DIET_OPTIONS.map((opt) => {
            const active = preferences.diet.includes(opt.value);
            return (
              <Pressable
                key={opt.value}
                onPress={() => toggleDiet(opt.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
                className={`flex-row items-center rounded-2xl border px-3.5 py-2 active:opacity-80 ${
                  active ? 'border-emerald-500/60 bg-emerald-500/20' : 'border-slate-800 bg-slate-900'
                }`}
              >
                {active && <Check size={14} color="#34d399" />}
                <Text
                  className={`text-sm font-semibold ${active ? 'ml-1.5 text-emerald-300' : 'text-slate-300'}`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Language */}
        <SectionHeader
          icon={<Globe size={18} color="#60a5fa" />}
          title="Recipe language"
          subtitle="Language used for recipe names, ingredients and steps."
        />
        <View className="flex-row rounded-2xl border border-slate-800 bg-slate-900 p-1">
          {LANGUAGE_OPTIONS.map((opt) => {
            const active = preferences.language === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => updatePreferences({ language: opt.value })}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                className={`flex-1 items-center rounded-xl py-2.5 ${active ? 'bg-emerald-500' : ''}`}
              >
                <Text className={`text-sm font-bold ${active ? 'text-slate-950' : 'text-slate-300'}`}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Servings */}
        <SectionHeader icon={<Users size={18} color="#c084fc" />} title="Servings per recipe" />
        <View className="flex-row items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-2">
          <Pressable
            onPress={() => changeServings(-1)}
            disabled={preferences.servings <= MIN_SERVINGS}
            accessibilityLabel="Decrease servings"
            className={`h-11 w-11 items-center justify-center rounded-xl bg-slate-800 ${
              preferences.servings <= MIN_SERVINGS ? 'opacity-40' : ''
            }`}
          >
            <Minus size={18} color="#e2e8f0" />
          </Pressable>
          <Text className="text-lg font-extrabold text-white">
            {preferences.servings} {preferences.servings === 1 ? 'person' : 'people'}
          </Text>
          <Pressable
            onPress={() => changeServings(1)}
            disabled={preferences.servings >= MAX_SERVINGS}
            accessibilityLabel="Increase servings"
            className={`h-11 w-11 items-center justify-center rounded-xl bg-slate-800 ${
              preferences.servings >= MAX_SERVINGS ? 'opacity-40' : ''
            }`}
          >
            <Plus size={18} color="#e2e8f0" />
          </Pressable>
        </View>

        {/* Backend status */}
        <SectionHeader icon={<Server size={18} color="#fbbf24" />} title="AI server status" />
        <View className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          <Text className="text-xs text-slate-500" numberOfLines={1}>
            {API_BASE_URL}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            {checking || !health ? (
              <ActivityIndicator color="#34d399" />
            ) : (
              <View className="flex-1">
                <View className="flex-row items-center">
                  <View
                    className={`h-2.5 w-2.5 rounded-full ${health.online ? 'bg-emerald-400' : 'bg-red-400'}`}
                  />
                  <Text className="ml-2 text-sm font-bold text-white">
                    {health.online ? `Online (${health.latencyMs} ms)` : 'Unreachable'}
                  </Text>
                </View>
                {health.online && (
                  <Text className="mt-1 text-xs text-slate-400">
                    AI model: {health.geminiConfigured ? 'configured' : 'missing API key'} · Cloud
                    sync: {health.supabaseConfigured ? 'on' : 'off'}
                  </Text>
                )}
              </View>
            )}
            <Pressable
              onPress={runHealthCheck}
              disabled={checking}
              className="ml-3 rounded-xl bg-slate-800 px-3 py-2 active:opacity-75"
            >
              <Text className="text-xs font-bold text-slate-200">Check</Text>
            </Pressable>
          </View>
        </View>

        {/* Data */}
        <SectionHeader icon={<Trash2 size={18} color="#f87171" />} title="Data" />
        <View className="rounded-2xl border border-slate-800 bg-slate-900">
          <Pressable
            onPress={() => confirmClear('history')}
            disabled={history.length === 0}
            className={`flex-row items-center justify-between border-b border-slate-800 p-4 ${
              history.length === 0 ? 'opacity-40' : ''
            }`}
          >
            <Text className="text-sm font-semibold text-slate-200">Clear scan history</Text>
            <Text className="text-xs text-slate-500">{history.length} items</Text>
          </Pressable>
          <Pressable
            onPress={() => confirmClear('favorites')}
            disabled={favorites.length === 0}
            className={`flex-row items-center justify-between p-4 ${
              favorites.length === 0 ? 'opacity-40' : ''
            }`}
          >
            <Text className="text-sm font-semibold text-slate-200">Remove all favorites</Text>
            <Text className="text-xs text-slate-500">{favorites.length} items</Text>
          </Pressable>
        </View>

        <Text className="mt-8 text-center text-xs text-slate-600">
          SnapCook AI v{Constants.expoConfig?.version ?? '1.0.0'} · Calorie values are AI estimates.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
