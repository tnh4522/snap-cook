import { ExerciseType, WorkoutIntensity } from '@/types/health';

export interface ExerciseMeta {
  type: ExerciseType;
  name_en: string;
  name_vi: string;
  base_met: number;
  category: 'cardio' | 'strength' | 'flexibility' | 'sports';
  icon: string;
}

export const EXERCISE_METAS: Record<ExerciseType, ExerciseMeta> = {
  walking: {
    type: 'walking',
    name_en: 'Brisk Walking',
    name_vi: 'Đi bộ nhanh',
    base_met: 3.8,
    category: 'cardio',
    icon: 'Footprints',
  },
  running: {
    type: 'running',
    name_en: 'Running / Jogging',
    name_vi: 'Chạy bộ',
    base_met: 9.5,
    category: 'cardio',
    icon: 'Flame',
  },
  cycling: {
    type: 'cycling',
    name_en: 'Cycling',
    name_vi: 'Đạp xe',
    base_met: 7.5,
    category: 'cardio',
    icon: 'Bike',
  },
  hiit: {
    type: 'hiit',
    name_en: 'HIIT / Tabata',
    name_vi: 'Tập HIIT / Đốt mỡ',
    base_met: 8.5,
    category: 'cardio',
    icon: 'Zap',
  },
  gym_weights: {
    type: 'gym_weights',
    name_en: 'Weight Training / Gym',
    name_vi: 'Tập Gym / Tạ',
    base_met: 5.0,
    category: 'strength',
    icon: 'Dumbbell',
  },
  swimming: {
    type: 'swimming',
    name_en: 'Swimming',
    name_vi: 'Bơi lội',
    base_met: 7.0,
    category: 'cardio',
    icon: 'Waves',
  },
  yoga_pilates: {
    type: 'yoga_pilates',
    name_en: 'Yoga & Pilates',
    name_vi: 'Yoga & Pilates',
    base_met: 3.0,
    category: 'flexibility',
    icon: 'Smile',
  },
  jump_rope: {
    type: 'jump_rope',
    name_en: 'Jump Rope',
    name_vi: 'Nhảy dây',
    base_met: 11.0,
    category: 'cardio',
    icon: 'Activity',
  },
  badminton: {
    type: 'badminton',
    name_en: 'Badminton / Tennis',
    name_vi: 'Cầu lông / Tennis',
    base_met: 6.5,
    category: 'sports',
    icon: 'Trophy',
  },
  boxing: {
    type: 'boxing',
    name_en: 'Boxing / Kickfit',
    name_vi: 'Boxing / Kickfit',
    base_met: 9.0,
    category: 'cardio',
    icon: 'Shield',
  },
};

const INTENSITY_MODIFIERS: Record<WorkoutIntensity, number> = {
  low: 0.85,
  moderate: 1.0,
  high: 1.2,
};

export function calculateWorkoutCalories(
  exerciseType: ExerciseType,
  durationMinutes: number,
  weightKg: number,
  intensity: WorkoutIntensity = 'moderate'
): number {
  const meta = EXERCISE_METAS[exerciseType] || EXERCISE_METAS.walking;
  const modifier = INTENSITY_MODIFIERS[intensity] ?? 1.0;
  const effectiveMet = meta.base_met * modifier;
  const hours = Math.max(1, durationMinutes) / 60;
  const safeWeight = Math.max(30, Math.min(250, weightKg));
  return Math.round(effectiveMet * safeWeight * hours);
}
