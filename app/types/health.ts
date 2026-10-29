export type Gender = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type HealthGoal = 'lose_weight' | 'maintain' | 'gain_muscle';

export type DietStyle =
  | 'balanced'
  | 'eat_clean'
  | 'high_protein'
  | 'low_carb'
  | 'keto'
  | 'vegetarian'
  | 'vegan';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type SnapCameraMode = 'fridge' | 'food_lens';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
  isCloudUser?: boolean;
}

export interface UserHealthProfile {
  gender: Gender;
  age: number;
  height_cm: number;
  current_weight_kg: number;
  target_weight_kg: number;
  activity_level: ActivityLevel;
  main_goal: HealthGoal;
  diet_style: DietStyle;
  updatedAt?: number;
}

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  protein_pct: number;
  carbs_pct: number;
  fat_pct: number;
}

export interface HealthMetrics {
  bmi: number;
  bmi_category: BmiCategory;
  bmr: number;
  tdee: number;
  daily_calorie_target: number;
  macros: MacroTargets;
  safety_note: string;
}

export interface FoodComponentItem {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodAnalysisResult {
  food_name: string;
  portion_description: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  health_score: number;
  health_tags: string[];
  ai_advice: string;
  components: FoodComponentItem[];
}

export interface AnalyzeFoodRequest {
  image_base64: string;
  language: 'en' | 'vi';
  meal_type: MealType;
  dietary_goal: HealthGoal;
  user_id?: string | null;
  image_url?: string | null;
}

export interface AnalyzeFoodResponse {
  analysis: FoodAnalysisResult;
  record_id?: string | null;
}

export interface MealLogItem {
  id: string;
  userId?: string | null;
  meal_type: MealType;
  food_name: string;
  portion_description: string;
  portion_multiplier: number;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  health_score: number;
  ai_advice: string;
  imageUri?: string | null;
  loggedAt: number;
}

// ---------------------------------------------------------------------------
// Phase 2: Weight, Water, Intermittent Fasting
// ---------------------------------------------------------------------------

export interface WeightLogItem {
  id: string;
  weight_kg: number;
  notes?: string;
  recordedAt: number;
}

export interface WaterLogItem {
  id: string;
  amount_ml: number;
  loggedAt: number;
}

export type FastingProtocol = '14_10' | '16_8' | '18_6' | '20_4';

export interface FastingState {
  isActive: boolean;
  protocol: FastingProtocol;
  targetFastingHours: number;
  startTime: number | null; // timestamp ms
  targetEndTime: number | null; // timestamp ms
}

// ---------------------------------------------------------------------------
// Phase 3: Workouts & 7-Day Meal Planner
// ---------------------------------------------------------------------------

export type ExerciseType =
  | 'walking'
  | 'running'
  | 'cycling'
  | 'hiit'
  | 'gym_weights'
  | 'swimming'
  | 'yoga_pilates'
  | 'jump_rope'
  | 'badminton'
  | 'boxing';

export type WorkoutIntensity = 'low' | 'moderate' | 'high';

export interface WorkoutLogItem {
  id: string;
  exercise_type: ExerciseType;
  exercise_name: string;
  duration_minutes: number;
  calories_burned: number;
  intensity: WorkoutIntensity;
  loggedAt: number;
}

export interface PlannedMealItem {
  id: string;
  meal_type: MealType;
  food_name: string;
  portion_desc: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  cooking_tip?: string;
  ingredients: string[];
  isEaten?: boolean;
}

export interface PlannedDay {
  day_index: number;
  day_name: string;
  meals: PlannedMealItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
}

export interface WeeklyMealPlan {
  id: string;
  createdAt: number;
  diet_style: DietStyle;
  daily_calorie_target: number;
  days: PlannedDay[];
  grocery_list: string[];
}

// ---------------------------------------------------------------------------
// Phase 4: AI Health Coach & Weekly Insights
// ---------------------------------------------------------------------------

export interface CoachChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface WeeklyHealthReport {
  id: string;
  generatedAt: number;
  summary_text: string;
  total_deficit_surplus_kcal: number;
  est_fat_change_kg: number;
  avg_daily_calories: number;
  avg_protein_g: number;
  adherence_score: number;
  recommendations: string[];
  safety_alerts: string[];
}
