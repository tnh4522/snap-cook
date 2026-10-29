import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceSecondary: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  primarySubtle: string;
  primaryBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  cardShadow: string;
  chipCalBg: string;
  chipCalText: string;
  chipTimeBg: string;
  chipTimeText: string;
  chipServBg: string;
  chipServText: string;
  chipDiffBg: string;
  chipDiffText: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  warning: string;
  warningBg: string;
}

const LIGHT_COLORS: ThemeColors = {
  bg: '#f8f9fa',
  surface: '#ffffff',
  surfaceSecondary: '#f1f3f2',
  surfaceHover: '#e8ecea',
  border: '#e2e6e3',
  borderSubtle: '#edf1ee',
  text: '#1c2420',
  textSecondary: '#546359',
  textMuted: '#84948a',
  primary: '#2d6a4f',
  primaryText: '#ffffff',
  primarySubtle: '#eaf4ee',
  primaryBorder: '#bddcc9',
  tabBarBg: '#ffffff',
  tabBarBorder: '#e6eae7',
  tabBarActive: '#2d6a4f',
  tabBarInactive: '#84948a',
  cardShadow: 'rgba(28, 36, 32, 0.04)',
  chipCalBg: '#fdf3e7',
  chipCalText: '#9a4704',
  chipTimeBg: '#eef5fc',
  chipTimeText: '#1d5494',
  chipServBg: '#f5effa',
  chipServText: '#683594',
  chipDiffBg: '#eaf4ee',
  chipDiffText: '#23563f',
  danger: '#be123c',
  dangerBg: '#fff1f2',
  dangerBorder: '#fecdd3',
  dangerText: '#9f1239',
  warning: '#b45309',
  warningBg: '#fffbeb',
};

const DARK_COLORS: ThemeColors = {
  bg: '#121415',
  surface: '#1a1d1f',
  surfaceSecondary: '#24292b',
  surfaceHover: '#2d3336',
  border: '#2a3033',
  borderSubtle: '#1e2325',
  text: '#edf2ee',
  textSecondary: '#9ca9a1',
  textMuted: '#68746d',
  primary: '#52b788',
  primaryText: '#0d2319',
  primarySubtle: '#193325',
  primaryBorder: '#29543d',
  tabBarBg: '#151819',
  tabBarBorder: '#23282a',
  tabBarActive: '#52b788',
  tabBarInactive: '#68746d',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  chipCalBg: '#2d2015',
  chipCalText: '#f6ad55',
  chipTimeBg: '#152433',
  chipTimeText: '#90cdf4',
  chipServBg: '#251b33',
  chipServText: '#d6bcfa',
  chipDiffBg: '#193325',
  chipDiffText: '#86efac',
  danger: '#f43f5e',
  dangerBg: '#361118',
  dangerBorder: '#5f1626',
  dangerText: '#fda4af',
  warning: '#f59e0b',
  warningBg: '#302008',
};

const THEME_STORAGE_KEY = 'snapcook:theme_mode:v1';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);
  const systemScheme = useRNColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored);
          setColorScheme(stored);
        } else {
          setColorScheme('system');
        }
      } catch (err) {
        console.warn('[ThemeContext] Failed to load theme setting:', err);
      } finally {
        setIsReady(true);
      }
    })();
  }, [setColorScheme]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      setColorScheme(mode);
      AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((err) =>
        console.warn('[ThemeContext] Failed to save theme setting:', err)
      );
    },
    [setColorScheme]
  );

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => (isDark ? DARK_COLORS : LIGHT_COLORS), [isDark]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        colors,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
