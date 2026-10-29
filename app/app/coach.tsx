import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bot,
  Droplets,
  Flame,
  Send,
  Sparkles,
  Target,
  Trash2,
  User,
} from 'lucide-react-native';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';
import { CoachChatMessage } from '@/types/health';

export default function CoachChatScreen() {
  const router = useRouter();
  const {
    profile,
    metrics,
    todayNutrition,
    todayWaterMl,
    coachMessages,
    isCoachReplying,
    sendMessageToCoach,
    clearCoachChat,
  } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<CoachChatMessage>>(null);

  // Auto-scroll on new messages or typing state change
  useEffect(() => {
    if (coachMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [coachMessages.length, isCoachReplying]);

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend ?? inputText).trim();
    if (!content || isCoachReplying) return;
    setInputText('');
    await sendMessageToCoach(content);
  };

  const handleClearConfirm = () => {
    Alert.alert(t('coach.clearChat'), t('coach.clearChatConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.clear'),
        style: 'destructive',
        onPress: () => clearCoachChat(),
      },
    ]);
  };

  const quickPrompts = [
    t('coach.chip1'),
    t('coach.chip2'),
    t('coach.chip3'),
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]"
      edges={['top', 'left', 'right']}
    >
      {/* Top Header */}
      <View
        className="flex-row items-center justify-between border-b px-5 py-3.5 shadow-sm"
        style={{
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
        </Pressable>

        <View className="flex-1 items-center px-2">
          <View className="flex-row items-center">
            <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
              <Bot size={16} color={isDark ? '#4ade80' : '#059669'} />
            </View>
            <Text className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Dr. SnapCook AI
            </Text>
            <View className="ml-2 h-2 w-2 rounded-full bg-emerald-500" />
          </View>
          <Text className="text-[10px] text-stone-500 dark:text-stone-400">
            {t('coach.subtitle')}
          </Text>
        </View>

        <Pressable
          onPress={handleClearConfirm}
          disabled={coachMessages.length === 0}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white opacity-90 disabled:opacity-30 dark:border-stone-800 dark:bg-[#1a1d1f]"
        >
          <Trash2 size={16} color={isDark ? '#f43f5e' : '#e11d48'} />
        </Pressable>
      </View>

      {/* Health Context Strip (Personalized Snapshot) */}
      <View
        className="flex-row items-center justify-around border-b px-4 py-2"
        style={{
          backgroundColor: isDark ? '#141819' : '#f1f5f9',
          borderBottomColor: colors.border,
        }}
      >
        <View className="flex-row items-center">
          <Flame size={13} color="#f97316" />
          <Text className="ml-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            {todayNutrition.calories} / {metrics.daily_calorie_target} kcal
          </Text>
        </View>
        <View className="h-3 w-[1px] bg-stone-300 dark:bg-stone-700" />
        <View className="flex-row items-center">
          <Droplets size={13} color="#0ea5e9" />
          <Text className="ml-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            {todayWaterMl} ml
          </Text>
        </View>
        <View className="h-3 w-[1px] bg-stone-300 dark:bg-stone-700" />
        <View className="flex-row items-center">
          <Target size={13} color="#10b981" />
          <Text className="ml-1 text-[11px] font-semibold text-stone-600 dark:text-stone-400">
            {t(`onboarding.goal_${profile.main_goal}` as any)}
          </Text>
        </View>
      </View>

      {/* Main Chat Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={coachMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="items-center py-6">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-emerald-50 shadow-sm dark:bg-emerald-950/60">
                <Sparkles size={32} color={isDark ? '#4ade80' : '#059669'} />
              </View>
              <Text className="mt-4 text-center text-base font-extrabold text-stone-900 dark:text-stone-100">
                {t('coach.title')}
              </Text>
              <Text className="mt-2 px-4 text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
                {t('coach.greeting')}
              </Text>

              {/* Suggestion Chips */}
              <View className="mt-6 w-full gap-2.5">
                <Text className="px-1 text-xs font-bold text-stone-700 dark:text-stone-300">
                  Gợi ý câu hỏi phổ biến:
                </Text>
                {quickPrompts.map((prompt, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => handleSend(prompt)}
                    className="flex-row items-center rounded-2xl border p-3 active:opacity-75"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    }}
                  >
                    <View className="mr-2.5 h-6 w-6 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60">
                      <Sparkles size={12} color={isDark ? '#4ade80' : '#059669'} />
                    </View>
                    <Text className="flex-1 text-xs font-medium text-stone-800 dark:text-stone-200">
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isUser = item.role === 'user';
            return (
              <View
                className={`mb-3.5 flex-row ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <View className="mr-2 mt-1 h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60">
                    <Bot size={16} color={isDark ? '#4ade80' : '#059669'} />
                  </View>
                )}

                <View
                  className={`max-w-[82%] rounded-3xl px-4 py-3 shadow-sm ${
                    isUser
                      ? 'rounded-tr-xs bg-emerald-700 dark:bg-emerald-600'
                      : 'rounded-tl-xs'
                  }`}
                  style={
                    !isUser
                      ? {
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-xs leading-5 ${
                      isUser
                        ? 'font-medium text-white'
                        : 'text-stone-800 dark:text-stone-100'
                    }`}
                  >
                    {item.content}
                  </Text>
                  <Text
                    className={`mt-1 text-[10px] ${
                      isUser
                        ? 'text-emerald-100/70 text-right'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                {isUser && (
                  <View className="ml-2 mt-1 h-8 w-8 items-center justify-center rounded-2xl bg-stone-200 dark:bg-stone-800">
                    <User size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                  </View>
                )}
              </View>
            );
          }}
          ListFooterComponent={
            isCoachReplying ? (
              <View className="mb-3.5 flex-row items-center justify-start">
                <View className="mr-2 h-8 w-8 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60">
                  <Bot size={16} color={isDark ? '#4ade80' : '#059669'} />
                </View>
                <View
                  className="rounded-3xl rounded-tl-xs px-4 py-2.5 shadow-sm"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text className="text-xs italic text-stone-500 dark:text-stone-400">
                    {t('coach.typing')}
                  </Text>
                </View>
              </View>
            ) : undefined
          }
        />

        {/* Quick prompt strip if history exists */}
        {coachMessages.length > 0 && !isCoachReplying && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="max-h-10 px-4 mb-2"
          >
            {quickPrompts.map((prompt, idx) => (
              <Pressable
                key={idx}
                onPress={() => handleSend(prompt)}
                className="mr-2 rounded-full border px-3 py-1.5 active:opacity-75"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }}
              >
                <Text className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Bottom Input Field */}
        <View
          className="border-t px-4 py-3"
          style={{
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          }}
        >
          <View
            className="flex-row items-center rounded-2xl border px-3 py-1.5"
            style={{
              backgroundColor: isDark ? '#1a1d1f' : '#f8f9fa',
              borderColor: colors.border,
            }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('coach.placeholder')}
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              multiline
              maxLength={500}
              className="flex-1 py-1 text-xs text-stone-900 dark:text-stone-100"
              style={{ maxHeight: 80 }}
            />
            <Pressable
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isCoachReplying}
              className="ml-2 h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 disabled:opacity-40 active:opacity-85 dark:bg-emerald-600"
            >
              <Send size={15} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
