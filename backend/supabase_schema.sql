-- =============================================================================
-- SnapCook AI - Health, Nutrition & Calorie Tracking Schema (Supabase / Postgres)
-- Phase 1: Foundation (user_profiles & meal_logs)
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- 1. User Health Profiles table
create table if not exists public.user_profiles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references auth.users(id) on delete cascade,
    display_name text,
    gender text not null default 'female' check (gender in ('male', 'female')),
    age int not null default 25 check (age between 10 and 120),
    height_cm numeric(5,1) not null default 165.0 check (height_cm between 80 and 260),
    current_weight_kg numeric(5,1) not null default 60.0 check (current_weight_kg between 20 and 350),
    target_weight_kg numeric(5,1) not null default 55.0 check (target_weight_kg between 20 and 350),
    activity_level text not null default 'moderate' check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
    main_goal text not null default 'lose_weight' check (main_goal in ('lose_weight', 'maintain', 'gain_muscle')),
    diet_style text not null default 'balanced',
    bmi numeric(4,1),
    bmr int,
    tdee int,
    daily_calorie_target int not null default 1800,
    macro_ratio jsonb not null default '{"protein_pct": 30, "carbs_pct": 40, "fat_pct": 30}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Meal & Food Lens Logs table
create table if not exists public.meal_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    meal_type text not null default 'lunch' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name text not null,
    portion_description text,
    estimated_grams int default 300,
    calories int not null default 0,
    protein_g numeric(6,1) not null default 0,
    carbs_g numeric(6,1) not null default 0,
    fat_g numeric(6,1) not null default 0,
    fiber_g numeric(6,1) not null default 0,
    health_score int default 7 check (health_score between 1 and 10),
    ai_advice text,
    components jsonb default '[]'::jsonb,
    image_url text,
    logged_at timestamptz not null default now()
);

-- Indexes for fast daily lookups
create index if not exists idx_meal_logs_user_logged_at on public.meal_logs (user_id, logged_at desc);

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.meal_logs enable row level security;

-- RLS Policies for user_profiles
create policy "Users can view own profile"
    on public.user_profiles for select
    using (auth.uid() = user_id);

create policy "Users can insert own profile"
    on public.user_profiles for insert
    with check (auth.uid() = user_id);

create policy "Users can update own profile"
    on public.user_profiles for update
    using (auth.uid() = user_id);

-- RLS Policies for meal_logs
create policy "Users can view own meal logs"
    on public.meal_logs for select
    using (auth.uid() = user_id);

create policy "Users can insert own meal logs"
    on public.meal_logs for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own meal logs"
    on public.meal_logs for delete
    using (auth.uid() = user_id);

-- =============================================================================
-- Phase 2 & 3: Weight, Water, Workout Tracking & Weekly Meal Plans
-- =============================================================================

-- 3. Weight Logs table
create table if not exists public.weight_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    weight_kg numeric(5,1) not null check (weight_kg between 20 and 350),
    notes text,
    recorded_at timestamptz not null default now()
);
create index if not exists idx_weight_logs_user_date on public.weight_logs (user_id, recorded_at desc);

-- 4. Water Logs table
create table if not exists public.water_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    amount_ml int not null check (amount_ml > 0),
    recorded_date date not null default current_date,
    logged_at timestamptz not null default now()
);
create index if not exists idx_water_logs_user_date on public.water_logs (user_id, recorded_date);

-- 5. Workout & Burned Calories table
create table if not exists public.workout_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    exercise_type text not null,
    exercise_name text not null,
    duration_minutes int not null check (duration_minutes > 0),
    calories_burned int not null check (calories_burned >= 0),
    intensity text default 'moderate' check (intensity in ('low', 'moderate', 'high')),
    logged_at timestamptz not null default now()
);
create index if not exists idx_workout_logs_user_date on public.workout_logs (user_id, logged_at desc);

-- 6. Weekly Meal Plans table
create table if not exists public.meal_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    week_start date not null,
    diet_type text not null default 'eat_clean',
    daily_calorie_target int not null,
    days_plan jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_meal_plans_user_week on public.meal_plans (user_id, week_start desc);

-- Enable RLS
alter table public.weight_logs enable row level security;
alter table public.water_logs enable row level security;
alter table public.workout_logs enable row level security;
alter table public.meal_plans enable row level security;

-- Policies for weight_logs
create policy "Users can view own weight logs" on public.weight_logs for select using (auth.uid() = user_id);
create policy "Users can insert own weight logs" on public.weight_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own weight logs" on public.weight_logs for delete using (auth.uid() = user_id);

-- Policies for water_logs
create policy "Users can view own water logs" on public.water_logs for select using (auth.uid() = user_id);
create policy "Users can insert own water logs" on public.water_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own water logs" on public.water_logs for delete using (auth.uid() = user_id);

-- Policies for workout_logs
create policy "Users can view own workout logs" on public.workout_logs for select using (auth.uid() = user_id);
create policy "Users can insert own workout logs" on public.workout_logs for insert with check (auth.uid() = user_id);
create policy "Users can delete own workout logs" on public.workout_logs for delete using (auth.uid() = user_id);

-- Policies for meal_plans
create policy "Users can view own meal plans" on public.meal_plans for select using (auth.uid() = user_id);
create policy "Users can insert own meal plans" on public.meal_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own meal plans" on public.meal_plans for update using (auth.uid() = user_id);
create policy "Users can delete own meal plans" on public.meal_plans for delete using (auth.uid() = user_id);
    on public.meal_logs for delete
    using (auth.uid() = user_id);
