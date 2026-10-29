import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Heart, History, Settings } from 'lucide-react-native';
import { useLibrary } from '@/context/LibraryContext';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { favorites } = useLibrary();
  const { colors, isDark } = useTheme();
  const { t } = useI18n();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          height: 52 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.snapAndCook'),
          tabBarIcon: ({ color, size }) => <Camera size={size} color={color} strokeWidth={2.1} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => <History size={size} color={color} strokeWidth={2.1} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} strokeWidth={2.1} />,
          tabBarBadge: favorites.length > 0 ? favorites.length : undefined,
          tabBarBadgeStyle: {
            backgroundColor: isDark ? '#e11d48' : '#be123c',
            color: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} strokeWidth={2.1} />,
        }}
      />
    </Tabs>
  );
}
