import React, { useState } from 'react';
import {
  ActivityIndicator,
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
  Cloud,
  HeartPulse,
  Lock,
  Mail,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

export default function AuthScreen() {
  const router = useRouter();
  const { signIn, signUp, signInDemo, isCloudAuth } = useAuth();
  const { hasCustomProfile } = useHealth();
  const { showToast } = useToast();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res =
        mode === 'login'
          ? await signIn(email, password)
          : await signUp(displayName, email, password);

      if (!res.ok) {
        let errText = res.error || t('toasts.unexpectedErrorDesc');
        if (res.error === 'INVALID_EMAIL') errText = t('auth.invalidEmail');
        else if (res.error === 'SHORT_PASSWORD') errText = t('auth.shortPassword');
        else if (res.error === 'MISSING_NAME') errText = t('auth.missingName');
        showToast(t('toasts.unexpectedErrorTitle'), errText, 'error');
        return;
      }

      if (mode === 'register' || !hasCustomProfile) {
        showToast(t('auth.registerTitle'), t('auth.accountCreated'), 'success');
        router.replace('/onboarding');
      } else {
        showToast(
          t('auth.loginTitle'),
          t('auth.welcomeBack', { name: email.split('@')[0] }),
          'success'
        );
        router.replace('/(tabs)/health');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async () => {
    await signInDemo();
    showToast(
      t('auth.loginTitle'),
      t('auth.welcomeBack', { name: 'Minh Anh' }),
      'success'
    );
    if (!hasCustomProfile) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/health');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8f9fa] dark:bg-[#121415]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top navigation */}
          <View className="flex-row items-center justify-between py-4">
            <Pressable
              onPress={() => router.back()}
              accessibilityLabel={t('common.goBack')}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-[#1a1d1f]"
            >
              <ArrowLeft size={18} color={isDark ? '#e2e8f0' : '#334155'} />
            </Pressable>

            <View className="flex-row items-center rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 dark:border-emerald-500/25 dark:bg-emerald-950/40">
              {isCloudAuth ? (
                <Cloud size={13} color={isDark ? '#52b788' : '#2d6a4f'} />
              ) : (
                <Smartphone size={13} color={isDark ? '#52b788' : '#2d6a4f'} />
              )}
              <Text className="ml-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                {isCloudAuth ? t('auth.cloudMode') : t('auth.localMode')}
              </Text>
            </View>
          </View>

          {/* Hero Icon & Title */}
          <View className="mt-4 items-center">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-emerald-600 shadow-sm">
              <HeartPulse size={32} color="#ffffff" />
            </View>
            <Text className="text-center text-2xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </Text>
            <Text className="mt-2 max-w-xs text-center text-xs leading-5 text-stone-500 dark:text-stone-400">
              {t('auth.subtitle')}
            </Text>
          </View>

          {/* Form Card */}
          <View
            className="mt-7 rounded-3xl p-5 shadow-sm"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {mode === 'register' && (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                  {t('auth.nameLabel')}
                </Text>
                <View className="flex-row items-center rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 dark:border-stone-800 dark:bg-[#141718]">
                  <User size={17} color={isDark ? '#9ca9a1' : '#64748b'} />
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder={t('auth.namePlaceholder')}
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    className="ml-2.5 flex-1 text-sm text-stone-900 dark:text-stone-100"
                  />
                </View>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('auth.emailLabel')}
              </Text>
              <View className="flex-row items-center rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 dark:border-stone-800 dark:bg-[#141718]">
                <Mail size={17} color={isDark ? '#9ca9a1' : '#64748b'} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder={t('auth.emailPlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="ml-2.5 flex-1 text-sm text-stone-900 dark:text-stone-100"
                />
              </View>
            </View>

            <View className="mb-5">
              <Text className="mb-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('auth.passwordLabel')}
              </Text>
              <View className="flex-row items-center rounded-2xl border border-stone-200 bg-stone-50 px-3.5 py-3 dark:border-stone-800 dark:bg-[#141718]">
                <Lock size={17} color={isDark ? '#9ca9a1' : '#64748b'} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder={t('auth.passwordPlaceholder')}
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  className="ml-2.5 flex-1 text-sm text-stone-900 dark:text-stone-100"
                />
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              className="items-center justify-center rounded-2xl bg-emerald-700 py-3.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  {mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleQuickDemo}
              className="mt-3 flex-row items-center justify-center rounded-2xl border border-emerald-600/30 bg-emerald-50/70 py-3 active:opacity-80 dark:border-emerald-500/30 dark:bg-emerald-950/30"
            >
              <Sparkles size={16} color={isDark ? '#52b788' : '#2d6a4f'} />
              <Text className="ml-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {t('auth.quickDemoBtn')}
              </Text>
            </Pressable>
          </View>

          {/* Toggle Mode */}
          <Pressable
            onPress={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
            className="mt-5 items-center py-2"
          >
            <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
