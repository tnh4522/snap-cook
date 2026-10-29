import {
  ActivityLevel,
  BmiCategory,
  DietStyle,
  FoodAnalysisResult,
  HealthGoal,
  HealthMetrics,
  MacroTargets,
  UserHealthProfile,
} from '@/types/health';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const DIET_MACRO_SPLITS: Record<DietStyle, [number, number, number]> = {
  balanced: [30, 40, 30],
  eat_clean: [30, 45, 25],
  high_protein: [40, 35, 25],
  low_carb: [35, 25, 40],
  keto: [25, 5, 70],
  vegetarian: [25, 45, 30],
  vegan: [25, 50, 25],
};

export const DEFAULT_HEALTH_PROFILE: UserHealthProfile = {
  gender: 'female',
  age: 25,
  height_cm: 162,
  current_weight_kg: 58,
  target_weight_kg: 52,
  activity_level: 'moderate',
  main_goal: 'lose_weight',
  diet_style: 'eat_clean',
};

export function calculateBmi(
  weightKg: number,
  heightCm: number
): { bmi: number; category: BmiCategory } {
  const heightM = heightCm / 100;
  if (heightM <= 0) return { bmi: 0, category: 'normal' };
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  let category: BmiCategory = 'normal';
  if (bmi < 18.5) category = 'underweight';
  else if (bmi < 23.0) category = 'normal';
  else if (bmi < 25.0) category = 'overweight';
  else category = 'obese';
  return { bmi, category };
}

export function calculateHealthMetrics(profile: UserHealthProfile): HealthMetrics {
  const { bmi, category } = calculateBmi(profile.current_weight_kg, profile.height_cm);

  // Mifflin-St Jeor BMR
  const baseBmr =
    10 * profile.current_weight_kg + 6.25 * profile.height_cm - 5 * profile.age;
  const bmr = Math.max(
    800,
    Math.round(profile.gender === 'male' ? baseBmr + 5 : baseBmr - 161)
  );

  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] ?? 1.55;
  const tdee = Math.round(bmr * multiplier);

  const safetyFloor = profile.gender === 'male' ? 1500 : 1200;
  let dailyCalorieTarget = tdee;
  let safetyNote = '';

  if (profile.main_goal === 'lose_weight') {
    const rawTarget = tdee - 500;
    if (rawTarget < safetyFloor) {
      dailyCalorieTarget = safetyFloor;
      safetyNote = `Adjusted to safe minimum (${safetyFloor} kcal/day).`;
    } else {
      dailyCalorieTarget = rawTarget;
    }
  } else if (profile.main_goal === 'gain_muscle') {
    dailyCalorieTarget = tdee + 300;
  } else {
    if (profile.target_weight_kg < profile.current_weight_kg - 1.5) {
      dailyCalorieTarget = Math.max(safetyFloor, tdee - 300);
    } else if (profile.target_weight_kg > profile.current_weight_kg + 1.5) {
      dailyCalorieTarget = tdee + 250;
    } else {
      dailyCalorieTarget = tdee;
    }
  }

  const [proteinPct, carbsPct, fatPct] =
    DIET_MACRO_SPLITS[profile.diet_style] ?? [30, 40, 30];

  const macros: MacroTargets = {
    protein_g: Math.round((dailyCalorieTarget * (proteinPct / 100)) / 4),
    carbs_g: Math.round((dailyCalorieTarget * (carbsPct / 100)) / 4),
    fat_g: Math.round((dailyCalorieTarget * (fatPct / 100)) / 9),
    fiber_g: Math.max(20, Math.round((dailyCalorieTarget / 1000) * 14)),
    protein_pct: proteinPct,
    carbs_pct: carbsPct,
    fat_pct: fatPct,
  };

  return {
    bmi,
    bmi_category: category,
    bmr,
    tdee,
    daily_calorie_target: dailyCalorieTarget,
    macros,
    safety_note: safetyNote,
  };
}

/**
 * Scale an analyzed food result by a portion multiplier (e.g., 0.5x, 0.75x, 1x, 1.25x, 1.5x).
 */
export function scaleFoodAnalysis(
  analysis: FoodAnalysisResult,
  multiplier: number
): FoodAnalysisResult {
  const m = Math.max(0.25, Math.min(3, multiplier));
  const round1 = (n: number) => Math.round(n * m * 10) / 10;
  return {
    ...analysis,
    estimated_grams: Math.round(analysis.estimated_grams * m),
    calories: Math.round(analysis.calories * m),
    protein_g: round1(analysis.protein_g),
    carbs_g: round1(analysis.carbs_g),
    fat_g: round1(analysis.fat_g),
    fiber_g: round1(analysis.fiber_g),
    sugar_g: round1(analysis.sugar_g),
    sodium_mg: Math.round(analysis.sodium_mg * m),
    components: analysis.components.map((c) => ({
      ...c,
      estimated_grams: Math.round(c.estimated_grams * m),
      calories: Math.round(c.calories * m),
      protein_g: round1(c.protein_g),
      carbs_g: round1(c.carbs_g),
      fat_g: round1(c.fat_g),
    })),
  };
}

export function isSameLocalDay(tsA: number, tsB: number = Date.now()): boolean {
  const a = new Date(tsA);
  const b = new Date(tsB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
