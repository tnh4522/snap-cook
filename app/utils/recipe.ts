import { DietOption, RecipeDifficulty, RecipeItem, RecipeLanguage } from '@/types/recipe';

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

export const LANGUAGE_OPTIONS: { value: RecipeLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

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

export function formatCookingTime(minutes?: number | null): string | null {
  if (minutes == null || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Plain-text representation used by the native share sheet. */
export function formatRecipeForShare(recipe: RecipeItem): string {
  const meta = [
    `${recipe.calories} kcal`,
    formatCookingTime(recipe.cooking_time_minutes),
    recipe.servings ? `${recipe.servings} servings` : null,
    recipe.difficulty ? DIFFICULTY_LABELS[recipe.difficulty] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const ingredients = recipe.ingredients.map((i) => `• ${i}`).join('\n');
  const steps = recipe.instructions
    .map((s, idx) => `${idx + 1}. ${stripLeadingStepNumber(s)}`)
    .join('\n');

  return `🍳 ${recipe.name}\n${meta}\n\nIngredients:\n${ingredients}\n\nInstructions:\n${steps}\n\n— Generated with SnapCook AI`;
}

export function formatRelativeDate(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
