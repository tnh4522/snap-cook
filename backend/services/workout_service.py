"""
Workout & Exercise MET Service for SnapCook AI.
Computes estimated calories burned from duration, body weight, exercise type, and intensity.
"""
from typing import Any, Dict, List

EXERCISE_CATALOG: Dict[str, Dict[str, Any]] = {
    "walking": {
        "name_en": "Brisk Walking",
        "name_vi": "Đi bộ nhanh",
        "base_met": 3.8,
        "category": "cardio",
    },
    "running": {
        "name_en": "Running / Jogging",
        "name_vi": "Chạy bộ",
        "base_met": 9.5,
        "category": "cardio",
    },
    "cycling": {
        "name_en": "Cycling",
        "name_vi": "Đạp xe",
        "base_met": 7.5,
        "category": "cardio",
    },
    "hiit": {
        "name_en": "HIIT / Circuit Training",
        "name_vi": "Tập HIIT / Đốt mỡ nhanh",
        "base_met": 8.5,
        "category": "cardio",
    },
    "gym_weights": {
        "name_en": "Weightlifting / Gym Resistance",
        "name_vi": "Tập Gym / Nâng tạ",
        "base_met": 5.0,
        "category": "strength",
    },
    "swimming": {
        "name_en": "Swimming",
        "name_vi": "Bơi lội",
        "base_met": 7.0,
        "category": "cardio",
    },
    "yoga_pilates": {
        "name_en": "Yoga & Pilates",
        "name_vi": "Yoga & Giãn cơ",
        "base_met": 3.0,
        "category": "flexibility",
    },
    "jump_rope": {
        "name_en": "Jump Rope",
        "name_vi": "Nhảy dây",
        "base_met": 11.0,
        "category": "cardio",
    },
    "badminton": {
        "name_en": "Badminton / Tennis",
        "name_vi": "Cầu lông / Tennis",
        "base_met": 6.5,
        "category": "sports",
    },
    "boxing": {
        "name_en": "Boxing / Kickboxing",
        "name_vi": "Boxing / Kickfit",
        "base_met": 9.0,
        "category": "cardio",
    },
}

INTENSITY_MULTIPLIERS = {
    "low": 0.85,
    "moderate": 1.0,
    "high": 1.2,
}


def calculate_calories_burned(
    exercise_type: str,
    duration_minutes: int,
    weight_kg: float,
    intensity: str = "moderate",
) -> int:
    """
    Standard formula: Calories = MET * weight_kg * (duration_minutes / 60) * intensity_factor
    """
    normalized_type = exercise_type.strip().lower()
    exercise = EXERCISE_CATALOG.get(normalized_type)
    base_met = exercise["base_met"] if exercise else 5.0

    intensity_mult = INTENSITY_MULTIPLIERS.get(intensity.strip().lower(), 1.0)
    effective_met = base_met * intensity_mult

    hours = max(1, duration_minutes) / 60.0
    safe_weight = max(30.0, min(300.0, weight_kg))

    burned = effective_met * safe_weight * hours
    return int(round(burned))


def get_exercise_list(language: str = "vi") -> List[Dict[str, Any]]:
    is_vi = language.strip().lower() == "vi"
    result = []
    for key, item in EXERCISE_CATALOG.items():
        result.append(
            {
                "id": key,
                "name": item["name_vi"] if is_vi else item["name_en"],
                "base_met": item["base_met"],
                "category": item["category"],
            }
        )
    return result
