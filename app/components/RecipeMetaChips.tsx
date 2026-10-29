import React from 'react';
import { Text, View } from 'react-native';
import { BarChart3, Clock, Flame, Users } from 'lucide-react-native';
import { RecipeItem } from '@/types/recipe';
import { DIFFICULTY_LABELS, formatCookingTime } from '@/utils/recipe';

interface RecipeMetaChipsProps {
  recipe: RecipeItem;
  size?: 'sm' | 'md';
}

/** Calories / time / servings / difficulty badges. Optional fields are hidden when missing. */
export function RecipeMetaChips({ recipe, size = 'sm' }: RecipeMetaChipsProps) {
  const iconSize = size === 'sm' ? 12 : 14;
  const textClass = size === 'sm' ? 'text-xs' : 'text-xs font-bold';
  const time = formatCookingTime(recipe.cooking_time_minutes);

  const chips: { key: string; icon: React.ReactNode; label: string; bg: string; text: string }[] = [
    {
      key: 'cal',
      icon: <Flame size={iconSize} color="#fbbf24" />,
      label: `${recipe.calories} kcal`,
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
    },
  ];
  if (time) {
    chips.push({
      key: 'time',
      icon: <Clock size={iconSize} color="#60a5fa" />,
      label: time,
      bg: 'bg-sky-500/15',
      text: 'text-sky-300',
    });
  }
  if (recipe.servings) {
    chips.push({
      key: 'serv',
      icon: <Users size={iconSize} color="#c084fc" />,
      label: `${recipe.servings} servings`,
      bg: 'bg-purple-500/15',
      text: 'text-purple-300',
    });
  }
  if (recipe.difficulty) {
    chips.push({
      key: 'diff',
      icon: <BarChart3 size={iconSize} color="#34d399" />,
      label: DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty,
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
    });
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {chips.map((chip) => (
        <View key={chip.key} className={`flex-row items-center rounded-full px-3 py-1 ${chip.bg}`}>
          {chip.icon}
          <Text className={`ml-1 font-semibold ${textClass} ${chip.text}`}>{chip.label}</Text>
        </View>
      ))}
    </View>
  );
}
