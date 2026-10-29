import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Scale, X } from 'lucide-react-native';
import { useHealth } from '@/context/HealthContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface LogWeightModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LogWeightModal({ visible, onClose }: LogWeightModalProps) {
  const { latestWeight, logWeight } = useHealth();
  const { isDark, colors } = useTheme();
  const { t } = useI18n();

  const [weight, setWeight] = useState(String(latestWeight || 60));
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    const val = parseFloat(weight);
    if (!isNaN(val) && val >= 20 && val <= 300) {
      logWeight(val, notes);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View
            className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3">
              <View className="flex-row items-center">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/60">
                  <Scale size={20} color={isDark ? '#52b788' : '#2d6a4f'} />
                </View>
                <Text className="ml-2.5 text-base font-bold text-stone-900 dark:text-stone-100">
                  {t('weight.logModalTitle')}
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                className="h-10 w-10 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800"
              >
                <X size={18} color={isDark ? '#9ca9a1' : '#64748b'} />
              </Pressable>
            </View>

            {/* Weight Input */}
            <View className="mt-3">
              <Text className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('weight.weightLabel')}
              </Text>
              <View className="mt-1.5 flex-row items-center rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-[#141718]">
                <TextInput
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                  className="flex-1 text-lg font-extrabold text-stone-900 dark:text-stone-100"
                  placeholder="60.0"
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                />
                <Text className="text-sm font-bold text-stone-500">kg</Text>
              </View>
            </View>

            {/* Notes Input */}
            <View className="mt-4">
              <Text className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {t('weight.notesLabel')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                className="mt-1.5 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-900 dark:border-stone-800 dark:bg-[#141718] dark:text-stone-100"
                placeholder={t('weight.notesPlaceholder')}
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              />
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="mt-6 items-center justify-center rounded-2xl bg-emerald-700 py-3.5 shadow-sm active:opacity-85 dark:bg-emerald-600"
            >
              <Text className="text-sm font-bold text-white">{t('weight.saveBtn')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
