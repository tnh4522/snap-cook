import { DietOption, RecipeDifficulty, RecipeItem, RecipeLanguage } from '@/types/recipe';
import { translate } from '@/i18n';

export const DIET_OPTIONS: { value: DietOption; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
  { value: 'low_carb', label: 'Low-carb' },
  { value: 'high_protein', label: 'High-protein' },
  { value: 'keto', label: 'Keto' },
  { value: 'halal', label: 'Halal' },
];

export function getDietOptions(lang: RecipeLanguage = 'en'): { value: DietOption; label: string }[] {
  return [
    { value: 'vegetarian', label: translate(lang, 'diet.vegetarian') },
    { value: 'vegan', label: translate(lang, 'diet.vegan') },
    { value: 'gluten_free', label: translate(lang, 'diet.gluten_free') },
    { value: 'dairy_free', label: translate(lang, 'diet.dairy_free') },
    { value: 'low_carb', label: translate(lang, 'diet.low_carb') },
    { value: 'high_protein', label: translate(lang, 'diet.high_protein') },
    { value: 'keto', label: translate(lang, 'diet.keto') },
    { value: 'halal', label: translate(lang, 'diet.halal') },
  ];
}

export const LANGUAGE_OPTIONS: { value: RecipeLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export function getDifficultyLabel(difficulty: RecipeDifficulty, lang: RecipeLanguage = 'en'): string {
  return translate(lang, `difficulty.${difficulty}`);
}

/** Stable identity for a recipe, used for favorites. */
export function recipeKey(recipe: RecipeItem): string {
  const base = `${recipe.name.trim().toLowerCase()}|${recipe.ingredients
    .map((i) => i.trim().toLowerCase())
    .join(',')}`;
  // djb2 hash -> short, URL-safe id
  let hash = 5381;
  for (let i = 0; i < base.length; i++) {
    hash = ((hash << 5) + hash + base.charCodeAt(i)) | 0;
  }
  return `r${(hash >>> 0).toString(36)}`;
}

export function generateId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function stripLeadingStepNumber(step: string): string {
  return step.replace(/^(?:step\s*\d+\s*[:.)\-]?\s*|\d+\s*[:.)\-]\s*|\d+\.\s*)/i, '').trim();
}

export function formatCookingTime(minutes?: number | null, lang: RecipeLanguage = 'en'): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) {
    return translate(lang, 'time.minutesOnly', { count: minutes });
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m
    ? translate(lang, 'time.hoursMinutes', { hours: h, minutes: m })
    : translate(lang, 'time.hoursOnly', { hours: h });
}

/** Plain-text representation used by the native share sheet. */
export function formatRecipeForShare(recipe: RecipeItem, lang: RecipeLanguage = 'en'): string {
  const servingsLabel = recipe.servings
    ? `${recipe.servings} ${translate(lang, recipe.servings === 1 ? 'common.person' : 'common.servings')}`
    : null;
  const difficultyLabel = recipe.difficulty ? getDifficultyLabel(recipe.difficulty, lang) : null;

  const meta = [
    `${recipe.calories} kcal`,
    formatCookingTime(recipe.cooking_time_minutes, lang),
    servingsLabel,
    difficultyLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const ingredients = recipe.ingredients.map((i) => `• ${i}`).join('\n');
  const steps = recipe.instructions
    .map((s, idx) => `${idx + 1}. ${stripLeadingStepNumber(s)}`)
    .join('\n');

  const ingredientsHeader = translate(lang, 'recipeDetail.shareIngredientsHeader');
  const instructionsHeader = translate(lang, 'recipeDetail.shareInstructionsHeader');
  const shareFooter = translate(lang, 'recipeDetail.shareFooter');

  return `🍳 ${recipe.name}\n${meta}\n\n${ingredientsHeader}\n${ingredients}\n\n${instructionsHeader}\n${steps}\n\n${shareFooter}`;
}

export function formatRelativeDate(
  timestamp: number,
  lang: RecipeLanguage = 'en',
  now = Date.now()
): string {
  const diffMs = now - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return translate(lang, 'time.justNow');
  if (minutes < 60) return translate(lang, 'time.minAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(lang, 'time.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return translate(lang, 'time.daysAgo', { count: days });
  return new Date(timestamp).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US');
}
