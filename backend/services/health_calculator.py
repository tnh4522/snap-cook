"""
Deterministic Health & Nutrition Calculator for SnapCook AI.
Computes BMI, BMR (Mifflin-St Jeor), TDEE, Daily Calorie Target (with safety guardrails),
and Macronutrient breakdowns based on user goals and dietary styles.
"""
from typing import Dict, Tuple

ACTIVITY_MULTIPLIERS: Dict[str, float] = {
    "sedentary": 1.2,       # Little or no exercise
    "light": 1.375,         # Light exercise 1-3 days/week
    "moderate": 1.55,       # Moderate exercise 3-5 days/week
    "active": 1.725,        # Hard exercise 6-7 days/week
    "very_active": 1.9,     # Very hard exercise & physical job
}

# Macro splits (protein_pct, carbs_pct, fat_pct)
DIET_MACRO_SPLITS: Dict[str, Tuple[int, int, int]] = {
    "balanced": (30, 40, 30),
    "eat_clean": (30, 45, 25),
    "high_protein": (40, 35, 25),
    "low_carb": (35, 25, 40),
    "keto": (25, 5, 70),
    "vegetarian": (25, 45, 30),
    "vegan": (25, 50, 25),
}


def calculate_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
    """Calculate BMI and return (bmi_value, bmi_category)."""
    height_m = height_cm / 100.0
    if height_m <= 0:
        return 0.0, "normal"
    bmi = round(weight_kg / (height_m * height_m), 1)
    if bmi < 18.5:
        category = "underweight"
    elif bmi < 23.0:
        # WHO Asian-Pacific & international standard threshold
        category = "normal"
    elif bmi < 25.0:
        category = "overweight"
    else:
        category = "obese"
    return bmi, category


def calculate_bmr(gender: str, weight_kg: float, height_cm: float, age: int) -> int:
    """
    Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
    """
    base = 10.0 * weight_kg + 6.25 * height_cm - 5.0 * age
    if gender.strip().lower() == "male":
        bmr = base + 5.0
    else:
        bmr = base - 161.0
    return max(800, int(round(bmr)))


def calculate_tdee(bmr: int, activity_level: str) -> int:
    """Calculate Total Daily Energy Expenditure from BMR and activity level."""
    multiplier = ACTIVITY_MULTIPLIERS.get(activity_level.strip().lower(), 1.2)
    return int(round(bmr * multiplier))


def calculate_daily_calorie_target(
    tdee: int,
    gender: str,
    main_goal: str,
    current_weight_kg: float,
    target_weight_kg: float,
) -> Tuple[int, str]:
    """
    Compute safe daily calorie target based on user's goal.
    Applies medical safety floors (1200 kcal for female, 1500 kcal for male).
    """
    safety_floor = 1500 if gender.strip().lower() == "male" else 1200
    goal = main_goal.strip().lower()
    safety_note = ""

    if goal == "lose_weight":
        raw_target = tdee - 500
        if raw_target < safety_floor:
            target = safety_floor
            safety_note = (
                f"Calorie target adjusted to safe minimum ({safety_floor} kcal/day)."
            )
        else:
            target = raw_target
    elif goal == "gain_muscle":
        target = tdee + 300
    else:
        # maintain / keep fit
        if target_weight_kg < current_weight_kg - 1.5:
            target = max(safety_floor, tdee - 300)
        elif target_weight_kg > current_weight_kg + 1.5:
            target = tdee + 250
        else:
            target = tdee

    return int(round(target)), safety_note


def calculate_macro_targets(
    daily_calories: int,
    main_goal: str,
    diet_style: str = "balanced",
) -> Dict[str, int]:
    """
    Calculate daily macronutrient targets in grams and percentages.
    Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g.
    """
    style = diet_style.strip().lower()
    if style in DIET_MACRO_SPLITS:
        p_pct, c_pct, f_pct = DIET_MACRO_SPLITS[style]
    elif main_goal.strip().lower() == "gain_muscle":
        p_pct, c_pct, f_pct = (35, 40, 25)
    elif main_goal.strip().lower() == "lose_weight":
        p_pct, c_pct, f_pct = (35, 35, 30)
    else:
        p_pct, c_pct, f_pct = (30, 40, 30)

    protein_g = int(round((daily_calories * (p_pct / 100.0)) / 4.0))
    carbs_g = int(round((daily_calories * (c_pct / 100.0)) / 4.0))
    fat_g = int(round((daily_calories * (f_pct / 100.0)) / 9.0))
    fiber_g = max(20, int(round((daily_calories / 1000.0) * 14.0)))

    return {
        "protein_g": protein_g,
        "carbs_g": carbs_g,
        "fat_g": fat_g,
        "fiber_g": fiber_g,
        "protein_pct": p_pct,
        "carbs_pct": c_pct,
        "fat_pct": f_pct,
    }
