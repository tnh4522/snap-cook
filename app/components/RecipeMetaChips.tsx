import React from 'react';
import { Text, View } from 'react-native';
import { BarChart3, Clock, Flame, Users } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { formatCookingTime, getDifficultyLabel } from '@/utils/recipe';
import { useTheme } from '@/context/ThemeContext';
import { useI18n } from '@/i18n';

interface RecipeMetaChipsProps {
  recipe: RecipeItem;
  size?: 'sm' | 'md';
}

/** Calories / time / servings / difficulty badges with refined, eye-friendly pastel tones. */
export function RecipeMetaChips({ recipe, size = 'sm' }: RecipeMetaChipsProps) {
  const { isDark } = useTheme();
  const { t, language } = useI18n();
  const iconSize = size === 'sm' ? 12 : 13;
  const textClass = size === 'sm' ? 'text-[11px]' : 'text-xs font-semibold';
  const time = formatCookingTime(recipe.cooking_time_minutes, language);

  const chips: { key: string; icon: React.ReactNode; label: string; bg: string; border: string; text: string }[] = [
    {
      key: 'cal',
      icon: <Flame size={iconSize} color={isDark ? '#fbbf24' : '#b45309'} />,
      label: `${recipe.calories} kcal`,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200/80 dark:border-amber-900/40',
      text: 'text-amber-900 dark:text-amber-200',
    },
  ];

  if (time) {
    chips.push({
      key: 'time',
      icon: <Clock size={iconSize} color={isDark ? '#60a5fa' : '#2563eb'} />,
      label: time,
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      border: 'border-sky-200/80 dark:border-sky-900/40',
      text: 'text-sky-900 dark:text-sky-200',
    });
  }

  if (recipe.servings) {
    chips.push({
      key: 'serv',
      icon: <Users size={iconSize} color={isDark ? '#c084fc' : '#7c3aed'} />,
      label: `${recipe.servings} ${recipe.servings === 1 ? t('common.person') : t('common.servings')}`,
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200/80 dark:border-purple-900/40',
      text: 'text-purple-900 dark:text-purple-200',
    });
  }

  if (recipe.difficulty) {
    const isEasy = recipe.difficulty === 'easy';
    const isHard = recipe.difficulty === 'hard';

    const diffIconColor = isEasy
      ? isDark ? '#52b788' : '#2d6a4f'
      : isHard
        ? isDark ? '#fb923c' : '#c2410c'
        : isDark ? '#fbbf24' : '#b45309';

    const diffBg = isEasy
      ? 'bg-emerald-50 dark:bg-emerald-950/30'
      : isHard
        ? 'bg-orange-50 dark:bg-orange-950/30'
        : 'bg-amber-50 dark:bg-amber-950/30';

    const diffBorder = isEasy
      ? 'border-emerald-200/80 dark:border-emerald-900/40'
      : isHard
        ? 'border-orange-200/80 dark:border-orange-900/40'
        : 'border-amber-200/80 dark:border-amber-900/40';

    const diffText = isEasy
      ? 'text-emerald-900 dark:text-emerald-200'
      : isHard
        ? 'text-orange-900 dark:text-orange-200'
        : 'text-amber-900 dark:text-amber-200';

    chips.push({
      key: 'diff',
      icon: <BarChart3 size={iconSize} color={diffIconColor} />,
      label: getDifficultyLabel(recipe.difficulty, language),
      bg: diffBg,
      border: diffBorder,
      text: diffText,
    });
  }

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {chips.map((chip) => (
        <View
          key={chip.key}
          className={`flex-row items-center rounded-full border px-2.5 py-0.5 ${chip.bg} ${chip.border}`}
        >
          {chip.icon}
          <Text className={`ml-1 font-medium ${textClass} ${chip.text}`}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}
