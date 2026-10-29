import base64
import io
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple
from google import genai
from google.genai import types
from PIL import Image
from pydantic import TypeAdapter, ValidationError

from models import (
    ChatMessage,
    FoodAnalysisResult,
    FoodComponentItem,
    HealthProfileInput,
    PlannedDay,
    PlannedMealItem,
    RecipeItem,
    RecipePreferences,
    WeeklyMealPlanResponse,
    WeeklyReportResponse,
)

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

SYSTEM_PROMPT = """You are an expert culinary AI assistant for SnapCook AI.
Analyze the provided image of a fridge, pantry, or food ingredients.
1. Identify all edible ingredients visible in the image.
2. Create 3 delicious, practical recipes that primarily use the detected ingredients (common pantry staples like salt, pepper, cooking oil, and water may be assumed).
3. Return ONLY a valid JSON object matching this exact schema:
{
  "detected_ingredients": ["eggs", "spinach", "tomato"],
  "recipes": [
    {
      "name": "Recipe Title",
      "ingredients": ["2 eggs", "1 cup spinach", "1 tbsp olive oil"],
      "instructions": ["Step 1...", "Step 2...", "Step 3..."],
      "calories": 400,
      "cooking_time_minutes": 20,
      "difficulty": "easy",
      "servings": 2
    }
  ]
}
Rules:
- "calories" is an integer estimate per serving.
- "cooking_time_minutes" is an integer for total prep + cook time.
- "difficulty" must be exactly one of: "easy", "medium", "hard" (always in English).
- "servings" is an integer.
If no food or ingredients can be reasonably identified in the image, return: {"detected_ingredients": [], "recipes": []}
Do not include markdown code fences or any extra commentary outside the JSON object."""

DIET_LABELS = {
    "vegetarian": "vegetarian (no meat or fish)",
    "vegan": "vegan (no animal products at all)",
    "gluten_free": "gluten-free",
    "dairy_free": "dairy-free",
    "low_carb": "low-carb",
    "high_protein": "high-protein",
    "keto": "keto",
    "halal": "halal",
}

LANGUAGE_LABELS = {
    "en": "English",
    "vi": "Vietnamese (Tiếng Việt)",
}


class AIServiceError(Exception):
    """Raised when the AI service fails or input validation fails."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "AI_SERVICE_ERROR",
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


def _decode_base64_image(base64_str: str) -> bytes:
    """Strip optional data URI header, decode Base64, enforce size limit, and validate image via Pillow."""
    cleaned = base64_str.strip()
    if "," in cleaned and cleaned.startswith("data:"):
        cleaned = cleaned.split(",", 1)[1]

    # Quick pre-check on Base64 length before decoding (~1.37x decoded bytes)
    if len(cleaned) > int(MAX_IMAGE_BYTES * 1.4):
        raise AIServiceError(
            "Image payload exceeds the 10MB maximum allowed size.",
            status_code=413,
            error_code="IMAGE_TOO_LARGE",
        )

    try:
        image_bytes = base64.b64decode(cleaned, validate=False)
    except Exception as exc:
        raise AIServiceError(
            "Invalid Base64 image string.",
            status_code=400,
            error_code="INVALID_IMAGE",
        ) from exc

    if not image_bytes:
        raise AIServiceError(
            "Empty image payload received.",
            status_code=400,
            error_code="INVALID_IMAGE",
        )

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise AIServiceError(
            "Image exceeds the 10MB maximum allowed size.",
            status_code=413,
            error_code="IMAGE_TOO_LARGE",
        )

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img.verify()
    except Exception as exc:
        raise AIServiceError(
            "Decoded bytes do not represent a valid image.",
            status_code=400,
            error_code="INVALID_IMAGE",
        ) from exc

    return image_bytes


def _extract_json_payload(raw_text: str) -> Any:
    """Robustly parse JSON from AI output even if surrounded by markdown fences or prose."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(
            line for line in lines if not line.strip().startswith("```")
        ).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Attempt to locate the outermost JSON object {...} or array [...]
        for pattern in (r"\{.*\}", r"\[.*\]"):
            match = re.search(pattern, cleaned, flags=re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    continue
        raise


def _coerce_int(value: Any) -> Optional[int]:
    """Convert AI values like 400, 400.5, "400", "~400 kcal", "20-25 min" to an int."""
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(round(value))
    match = re.search(r"\d+(?:\.\d+)?", str(value))
    return int(round(float(match.group(0)))) if match else None


def _as_str_list(value: Any) -> List[str]:
    if value is None:
        return []
    if isinstance(value, str):
        value = [line for line in value.splitlines()]
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _normalize_recipe_dict(raw: Any) -> Any:
    """Best-effort cleanup of a single AI recipe object before Pydantic validation."""
    if not isinstance(raw, dict):
        return raw

    normalized: Dict[str, Any] = dict(raw)
    normalized["name"] = str(raw.get("name") or raw.get("title") or "").strip()
    normalized["ingredients"] = _as_str_list(raw.get("ingredients"))
    normalized["instructions"] = _as_str_list(raw.get("instructions") or raw.get("steps"))

    calories = _coerce_int(raw.get("calories"))
    normalized["calories"] = max(0, min(5000, calories)) if calories is not None else 0

    cooking_time = _coerce_int(
        raw.get("cooking_time_minutes") or raw.get("cooking_time") or raw.get("time")
    )
    normalized["cooking_time_minutes"] = (
        max(0, min(1440, cooking_time)) if cooking_time is not None else None
    )

    servings = _coerce_int(raw.get("servings"))
    normalized["servings"] = max(1, min(50, servings)) if servings else None

    return normalized


def build_user_prompt(preferences: Optional[RecipePreferences]) -> str:
    """Build the per-request instruction text using sanitized, whitelisted preferences."""
    prefs = preferences or RecipePreferences()
    parts = [
        "Identify the ingredients in this photo and generate 3 recipes in the requested JSON format.",
        f"Each recipe should serve {prefs.servings} people; scale ingredient quantities accordingly.",
    ]
    if prefs.diet:
        diet_text = ", ".join(DIET_LABELS[d] for d in prefs.diet if d in DIET_LABELS)
        parts.append(
            f"All recipes MUST strictly respect these dietary requirements: {diet_text}. "
            "Skip any detected ingredient that violates them."
        )
    language = LANGUAGE_LABELS.get(prefs.language, "English")
    parts.append(
        f"Write recipe names, ingredients, detected_ingredients and instructions in {language}. "
        "Keep JSON keys and the difficulty value in English."
    )
    return "\n".join(parts)


def generate_recipes_from_base64(
    base64_image: str,
    preferences: Optional[RecipePreferences] = None,
) -> Tuple[List[RecipeItem], List[str]]:
    """
    Accepts a Base64 encoded image string, sends it to Google Gemini Flash,
    and returns a validated list of up to 3 RecipeItem models plus the detected ingredients.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        raise AIServiceError(
            "GEMINI_API_KEY is not configured in backend/.env.",
            status_code=500,
            error_code="MISSING_API_KEY",
        )

    image_bytes = _decode_base64_image(base64_image)

    with Image.open(io.BytesIO(image_bytes)) as img:
        fmt = (img.format or "JPEG").upper()
        mime_type = f"image/{fmt.lower()}" if fmt != "JPG" else "image/jpeg"

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                build_user_prompt(preferences),
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.4,
                response_mime_type="application/json",
            ),
        )
    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        raise AIServiceError(
            f"AI generation request failed: {str(exc)}",
            status_code=502,
            error_code="AI_UPSTREAM_ERROR",
        ) from exc

    raw_text = (response.text or "").strip()
    return parse_ai_response(raw_text)


def parse_ai_response(raw_text: str) -> Tuple[List[RecipeItem], List[str]]:
    """Parse and validate the raw AI text into recipes + detected ingredients."""
    if not raw_text:
        raise AIServiceError(
            "AI returned an empty response. Please try again.",
            status_code=502,
            error_code="INVALID_AI_JSON",
        )

    try:
        parsed_json = _extract_json_payload(raw_text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse AI JSON response: %s", raw_text)
        raise AIServiceError(
            "AI returned malformed JSON. Please try snapping the photo again.",
            status_code=502,
            error_code="INVALID_AI_JSON",
        ) from exc

    detected: List[str] = []
    if isinstance(parsed_json, dict):
        detected = _as_str_list(parsed_json.get("detected_ingredients"))
        if "recipes" in parsed_json:
            parsed_json = parsed_json["recipes"]
        elif "error" in parsed_json:
            raise AIServiceError(
                str(parsed_json["error"]),
                status_code=422,
                error_code="NO_INGREDIENTS_FOUND",
            )

    if not isinstance(parsed_json, list) or len(parsed_json) == 0:
        raise AIServiceError(
            "No recognizable food ingredients were found in the image. Please take a clearer, well-lit photo of your fridge or ingredients.",
            status_code=422,
            error_code="NO_INGREDIENTS_FOUND",
        )

    try:
        adapter = TypeAdapter(List[RecipeItem])
        recipes = adapter.validate_python([_normalize_recipe_dict(r) for r in parsed_json])
    except ValidationError as exc:
        logger.error("Pydantic validation failed for AI response: %s", exc)
        raise AIServiceError(
            "AI output did not match the expected recipe schema. Please try again.",
            status_code=502,
            error_code="INVALID_AI_SCHEMA",
        ) from exc

    return recipes[:3], detected[:40]


# ---------------------------------------------------------------------------
# Phase 1: AI Food Lens - Prepared Dish Calorie & Macronutrient Breakdown
# ---------------------------------------------------------------------------

FOOD_LENS_SYSTEM_PROMPT = """You are an expert clinical nutritionist and culinary vision AI for SnapCook AI.
Analyze the provided photo of a prepared meal, dish, snack, or beverage.
Pay special attention to Vietnamese dishes (e.g., Phở bò, Bún bò Huế, Cơm tấm sườn bì chả, Bánh mì, Gỏi cuốn, Bún đậu mắm tôm, Cơm gia đình) as well as international cuisine, accounting for hidden cooking oils, broths, sauces, and rice/noodle portions.

Return ONLY a valid JSON object matching this exact schema:
{
  "food_name": "Cơm tấm sườn bì chả trứng",
  "portion_description": "1 đĩa tiêu chuẩn (~450g)",
  "estimated_grams": 450,
  "calories": 760,
  "protein_g": 38.5,
  "carbs_g": 82.0,
  "fat_g": 28.0,
  "fiber_g": 3.5,
  "sugar_g": 8.0,
  "sodium_mg": 1150,
  "health_score": 6,
  "health_tags": ["High Protein", "High Calorie", "Traditional Dish"],
  "ai_advice": "Món ăn giàu đạm nhưng lượng mỡ từ mỡ hành, bì và nước mắm đường khá cao. Để giảm cân, bạn có thể giảm 1/3 lượng cơm và ăn kèm thêm dưa leo, đồ chua.",
  "components": [
    {
      "name": "Cơm tấm",
      "estimated_grams": 200,
      "calories": 260,
      "protein_g": 5.0,
      "carbs_g": 58.0,
      "fat_g": 0.5
    },
    {
      "name": "Sườn nướng",
      "estimated_grams": 120,
      "calories": 310,
      "protein_g": 24.0,
      "carbs_g": 6.0,
      "fat_g": 21.0
    }
  ]
}
Rules:
- If no food or beverage is recognizable in the image, return: {"error": "NO_FOOD_FOUND"}
- health_score is an integer from 1 (very unhealthy) to 10 (very healthy & nutrient-dense).
- Do not include markdown code fences or commentary outside the JSON object."""

GOAL_LABELS = {
    "lose_weight": "weight loss (caloric deficit, high satiety, moderate/high protein, controlled fat & sugar)",
    "maintain": "weight maintenance and balanced body composition",
    "gain_muscle": "muscle gain and strength recovery (high protein, quality complex carbs)",
}


def _coerce_float(value: Any, default: float = 0.0) -> float:
    if value is None or isinstance(value, bool):
        return default
    if isinstance(value, (int, float)):
        return round(float(value), 1)
    match = re.search(r"\d+(?:\.\d+)?", str(value))
    return round(float(match.group(0)), 1) if match else default


def _normalize_food_analysis_dict(raw: Any) -> Dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("Food analysis payload is not a JSON object")

    food_name = str(raw.get("food_name") or raw.get("name") or "").strip()
    portion_desc = str(
        raw.get("portion_description") or raw.get("portion") or "1 standard serving"
    ).strip()
    estimated_grams = _coerce_int(raw.get("estimated_grams")) or 300
    calories = _coerce_int(raw.get("calories")) or 0
    health_score = _coerce_int(raw.get("health_score")) or 7
    sodium_mg = _coerce_int(raw.get("sodium_mg")) or 0

    raw_components = raw.get("components")
    components: List[Dict[str, Any]] = []
    if isinstance(raw_components, list):
        for comp in raw_components:
            if isinstance(comp, dict) and str(comp.get("name") or "").strip():
                components.append(
                    {
                        "name": str(comp.get("name")).strip(),
                        "estimated_grams": max(
                            1, min(3000, _coerce_int(comp.get("estimated_grams")) or 100)
                        ),
                        "calories": max(
                            0, min(5000, _coerce_int(comp.get("calories")) or 0)
                        ),
                        "protein_g": max(
                            0.0, min(500.0, _coerce_float(comp.get("protein_g")))
                        ),
                        "carbs_g": max(
                            0.0, min(500.0, _coerce_float(comp.get("carbs_g")))
                        ),
                        "fat_g": max(0.0, min(500.0, _coerce_float(comp.get("fat_g")))),
                    }
                )

    return {
        "food_name": food_name,
        "portion_description": portion_desc,
        "estimated_grams": max(10, min(5000, estimated_grams)),
        "calories": max(0, min(10000, calories)),
        "protein_g": max(0.0, min(1000.0, _coerce_float(raw.get("protein_g")))),
        "carbs_g": max(0.0, min(1000.0, _coerce_float(raw.get("carbs_g")))),
        "fat_g": max(0.0, min(1000.0, _coerce_float(raw.get("fat_g")))),
        "fiber_g": max(0.0, min(500.0, _coerce_float(raw.get("fiber_g")))),
        "sugar_g": max(0.0, min(500.0, _coerce_float(raw.get("sugar_g")))),
        "sodium_mg": max(0, min(20000, sodium_mg)),
        "health_score": max(1, min(10, health_score)),
        "health_tags": _as_str_list(raw.get("health_tags"))[:6],
        "ai_advice": str(raw.get("ai_advice") or "").strip(),
        "components": components[:10],
    }


def build_food_analysis_prompt(
    language: str = "vi",
    meal_type: str = "lunch",
    dietary_goal: str = "lose_weight",
) -> str:
    lang_label = LANGUAGE_LABELS.get(language, "Vietnamese (Tiếng Việt)")
    goal_desc = GOAL_LABELS.get(dietary_goal, GOAL_LABELS["lose_weight"])
    return (
        f"Identify the dish or meal in this photo (logged for {meal_type}).\n"
        f"The user's primary health goal is: {goal_desc}.\n"
        f"Write 'food_name', 'portion_description', 'health_tags', 'ai_advice', and component 'name' values in {lang_label}.\n"
        "Provide realistic gram weights, calories, and macronutrients."
    )


def parse_food_analysis_response(raw_text: str) -> FoodAnalysisResult:
    if not raw_text or not raw_text.strip():
        raise AIServiceError(
            "AI returned an empty response for food analysis.",
            status_code=502,
            error_code="INVALID_AI_JSON",
        )

    try:
        parsed_json = _extract_json_payload(raw_text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Food Lens JSON response: %s", raw_text)
        raise AIServiceError(
            "AI returned malformed JSON for food analysis.",
            status_code=502,
            error_code="INVALID_AI_JSON",
        ) from exc

    if isinstance(parsed_json, dict) and parsed_json.get("error"):
        raise AIServiceError(
            "No recognizable food or beverage was found in the photo. Please take a clearer shot of your dish.",
            status_code=422,
            error_code="NO_INGREDIENTS_FOUND",
        )

    try:
        normalized = _normalize_food_analysis_dict(parsed_json)
        if not normalized.get("food_name"):
            raise AIServiceError(
                "No recognizable dish could be identified in the photo.",
                status_code=422,
                error_code="NO_INGREDIENTS_FOUND",
            )
        return FoodAnalysisResult(**normalized)
    except AIServiceError:
        raise
    except Exception as exc:
        logger.error("Validation failed for FoodAnalysisResult: %s", exc)
        raise AIServiceError(
            "AI output did not match the expected nutrition schema.",
            status_code=502,
            error_code="INVALID_AI_SCHEMA",
        ) from exc


def analyze_food_from_base64(
    base64_image: str,
    language: str = "vi",
    meal_type: str = "lunch",
    dietary_goal: str = "lose_weight",
) -> FoodAnalysisResult:
    """
    Send a prepared meal photo to Gemini Vision and return detailed calorie & macro breakdown.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        raise AIServiceError(
            "GEMINI_API_KEY is not configured in backend/.env.",
            status_code=500,
            error_code="MISSING_API_KEY",
        )

    image_bytes = _decode_base64_image(base64_image)

    with Image.open(io.BytesIO(image_bytes)) as img:
        fmt = (img.format or "JPEG").upper()
        mime_type = f"image/{fmt.lower()}" if fmt != "JPG" else "image/jpeg"

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                build_food_analysis_prompt(language, meal_type, dietary_goal),
            ],
            config=types.GenerateContentConfig(
                system_instruction=FOOD_LENS_SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
    except Exception as exc:
        logger.error("Gemini Food Lens API call failed: %s", exc)
        raise AIServiceError(
            f"AI food analysis request failed: {str(exc)}",
            status_code=502,
            error_code="AI_UPSTREAM_ERROR",
        ) from exc

    raw_text = (response.text or "").strip()
    return parse_food_analysis_response(raw_text)


# ---------------------------------------------------------------------------
# Phase 3: AI Smart 7-Day Meal Plan Generator
# ---------------------------------------------------------------------------

MEAL_PLAN_SYSTEM_PROMPT = """You are a master clinical dietitian for SnapCook AI.
Design a highly structured, delicious 7-day meal plan (Monday to Sunday) based on the user's diet style, daily calorie target, and dietary restrictions.
Emphasize practical home-cooked Vietnamese and healthy international dishes (Eat Clean, High-Protein, Keto, etc.).
For each day, provide 4 meals: breakfast (~25%), lunch (~35%), dinner (~30%), snack (~10%).
Total daily calories should match the daily_calorie_target within +/- 5%.

Return ONLY a JSON object matching this schema:
{
  "diet_style": "eat_clean",
  "daily_calorie_target": 1800,
  "days": [
    {
      "day_index": 1,
      "day_name": "Thứ 2",
      "total_calories": 1800,
      "total_protein_g": 130.0,
      "total_carbs_g": 190.0,
      "total_fat_g": 52.0,
      "meals": [
        {
          "meal_type": "breakfast",
          "food_name": "Yến mạch ngâm sữa chua & chuối hạnh nhân",
          "portion_desc": "1 tô vừa",
          "calories": 420,
          "protein_g": 22.0,
          "carbs_g": 58.0,
          "fat_g": 10.0,
          "cooking_tip": "Ngâm qua đêm trong tủ lạnh để yến mạch mềm dẻo",
          "ingredients": ["Yến mạch 50g", "Sữa chua không đường 1 hộp", "Chuối 1 quả", "Hạnh nhân 10g"]
        }
      ]
    }
  ],
  "grocery_list": ["Yến mạch", "Ức gà", "Trứng gà", "Cải bó xôi", "Gạo lứt"]
}
Do not include markdown fences outside the JSON."""


def get_fallback_weekly_meal_plan(
    diet_style: str = "eat_clean",
    daily_calorie_target: int = 1800,
    language: str = "vi",
) -> WeeklyMealPlanResponse:
    """Deterministic scientific fallback 7-day meal plan."""
    is_vi = language.strip().lower() == "vi"
    day_labels = (
        ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"]
        if is_vi
        else ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    )

    templates = [
        # Bữa sáng mẫu
        [
            ("Yến mạch sữa hạt & hoa quả", 420, 20.0, 60.0, 9.0, ["Yến mạch", "Sữa hạnh nhân", "Táo"]),
            ("Trứng ốp la bánh mì nguyên cám", 400, 24.0, 42.0, 14.0, ["Trứng gà", "Bánh mì đen", "Bơ"]),
            ("Smoothie bơ chuối cải xoăn", 380, 25.0, 45.0, 10.0, ["Cải kale", "Chuối", "Bột whey/sữa chua"]),
            ("Phở gà ức nước dùng thanh", 450, 32.0, 56.0, 8.0, ["Bánh phở", "Ức gà", "Hành ngò"]),
            ("Khoai lang hấp & trứng luộc", 390, 20.0, 58.0, 8.0, ["Khoai lang", "2 quả trứng luộc"]),
            ("Pancake chuối yến mạch", 410, 21.0, 55.0, 10.0, ["Yến mạch", "Chuối", "Mật ong"]),
            ("Bún ức gà nấu nấm", 430, 30.0, 52.0, 9.0, ["Bún tươi", "Ức gà", "Nấm đùi gà"]),
        ],
        # Bữa trưa mẫu
        [
            ("Cơm gạo lứt ức gà áp chảo & bông cải", 600, 48.0, 68.0, 13.0, ["Gạo lứt", "Ức gà 150g", "Bông cải xanh"]),
            ("Cá hồi nướng măng tây & khoai tây nghiền", 630, 42.0, 55.0, 22.0, ["Phi lê cá hồi", "Măng tây", "Khoai tây"]),
            ("Bò xào ớt chuông & cơm quinoa", 610, 45.0, 62.0, 16.0, ["Thịt bò nạc", "Ớt chuông", "Hạt quinoa"]),
            ("Bún chả áp chảo eat clean", 590, 44.0, 65.0, 12.0, ["Thịt nạc xay", "Bún tươi", "Đồ chua"]),
            ("Cơm gạo lứt cá thu sốt cà & rau muống", 620, 40.0, 70.0, 15.0, ["Cá thu", "Cà chua", "Rau muống"]),
            ("Tôm áp chảo sốt chanh leo & cơm lứt", 580, 46.0, 64.0, 11.0, ["Tôm sú", "Chanh leo", "Bí ngòi"]),
            ("Đậu hũ sốt nấm xào thịt nạc & cơm lứt", 600, 42.0, 68.0, 14.0, ["Đậu hũ", "Thịt băm nạc", "Nấm"]),
        ],
        # Bữa tối mẫu
        [
            ("Salad cá ngừ trứng luộc dầu giấm", 500, 38.0, 30.0, 18.0, ["Cá ngừ ngâm nước", "Xà lách", "Trứng gà"]),
            ("Canh chua cá lóc & rau luộc kho quẹt nạc", 490, 36.0, 48.0, 12.0, ["Cá lóc", "Bạc hà", "Cà chua"]),
            ("Ức gà xé phay bắp cải & nấm đông cô", 480, 40.0, 35.0, 12.0, ["Ức gà", "Bắp cải tím", "Rau răm"]),
            ("Súp bí đỏ thịt bằm & bánh mì gối", 470, 32.0, 50.0, 12.0, ["Bí đỏ", "Thịt nạc băm"]),
            ("Bò lúc lắc rau củ & khoai lang nướng", 520, 42.0, 45.0, 16.0, ["Thịt bò", "Hành tây", "Khoai lang"]),
            ("Canh rong biển đậu hũ thịt bò", 460, 36.0, 32.0, 14.0, ["Rong biển khô", "Đậu hũ non", "Thịt bò"]),
            ("Gỏi cuốn tôm thịt nạc & sốt tương đen", 480, 35.0, 52.0, 11.0, ["Bánh tráng", "Tôm", "Thịt nạc luộc"]),
        ],
        # Bữa phụ mẫu
        [
            ("Sữa chua Hy Lạp & hạt chia", 180, 14.0, 16.0, 5.0, ["Sữa chua Hy Lạp", "Hạt chia"]),
            ("Táo cắt lát chấm bơ đậu phộng", 190, 6.0, 24.0, 9.0, ["Táo xanh", "1 thìa bơ đậu phộng"]),
            ("Sữa hạt hạnh nhân ấm", 150, 6.0, 18.0, 6.0, ["Sữa hạnh nhân nguyên chất"]),
            ("1 quả chuối & 5 quả óc chó", 180, 4.0, 26.0, 8.0, ["Chuối", "Hạt óc chó"]),
            ("Bánh biscotti nguyên cám", 160, 7.0, 22.0, 5.0, ["Biscotti"]),
            ("Trứng luộc lòng đào & muối tiêu", 140, 12.0, 2.0, 9.0, ["2 quả trứng gà"]),
            ("Sữa đậu nành không đường", 150, 12.0, 10.0, 5.0, ["Sữa đậu nành nguyên chất"]),
        ],
    ]

    days: List[PlannedDay] = []
    groceries: List[str] = [
        "Ức gà tươi (1.2kg)",
        "Gạo lứt (1kg)",
        "Trứng gà sạch (1 vỉ 10 quả)",
        "Yến mạch cán dẹt (500g)",
        "Bông cải xanh & măng tây",
        "Rau xà lách & cà chua bi",
        "Cá hồi hoặc cá nạc phi lê",
        "Sữa chua không đường & sữa hạt",
        "Chuối & táo xanh",
    ]

    scale_factor = daily_calorie_target / 1750.0

    for i in range(7):
        b_name, b_cal, b_p, b_c, b_f, b_ing = templates[0][i]
        l_name, l_cal, l_p, l_c, l_f, l_ing = templates[1][i]
        d_name, d_cal, d_p, d_c, d_f, d_ing = templates[2][i]
        s_name, s_cal, s_p, s_c, s_f, s_ing = templates[3][i]

        meals = [
            PlannedMealItem(
                meal_type="breakfast",
                food_name=b_name,
                portion_desc="1 khẩu phần chuẩn",
                calories=int(round(b_cal * scale_factor)),
                protein_g=round(b_p * scale_factor, 1),
                carbs_g=round(b_c * scale_factor, 1),
                fat_g=round(b_f * scale_factor, 1),
                cooking_tip="Nấu chín vừa tới để giữ vi chất",
                ingredients=b_ing,
            ),
            PlannedMealItem(
                meal_type="lunch",
                food_name=l_name,
                portion_desc="1 đĩa tiêu chuẩn",
                calories=int(round(l_cal * scale_factor)),
                protein_g=round(l_p * scale_factor, 1),
                carbs_g=round(l_c * scale_factor, 1),
                fat_g=round(l_f * scale_factor, 1),
                cooking_tip="Ưu tiên hấp hoặc áp chảo với 1 thìa dầu olive",
                ingredients=l_ing,
            ),
            PlannedMealItem(
                meal_type="dinner",
                food_name=d_name,
                portion_desc="1 phần nhẹ bụng",
                calories=int(round(d_cal * scale_factor)),
                protein_g=round(d_p * scale_factor, 1),
                carbs_g=round(d_c * scale_factor, 1),
                fat_g=round(d_f * scale_factor, 1),
                cooking_tip="Ăn tối trước 19:30 để tiêu hóa tốt",
                ingredients=d_ing,
            ),
            PlannedMealItem(
                meal_type="snack",
                food_name=s_name,
                portion_desc="Bữa phụ chiều",
                calories=int(round(s_cal * scale_factor)),
                protein_g=round(s_p * scale_factor, 1),
                carbs_g=round(s_c * scale_factor, 1),
                fat_g=round(s_f * scale_factor, 1),
                cooking_tip="Dùng khi cảm thấy đói giữa buổi",
                ingredients=s_ing,
            ),
        ]

        total_c = sum(m.calories for m in meals)
        total_p = round(sum(m.protein_g for m in meals), 1)
        total_cb = round(sum(m.carbs_g for m in meals), 1)
        total_ft = round(sum(m.fat_g for m in meals), 1)

        days.append(
            PlannedDay(
                day_index=i + 1,
                day_name=day_labels[i],
                meals=meals,
                total_calories=total_c,
                total_protein_g=total_p,
                total_carbs_g=total_cb,
                total_fat_g=total_ft,
            )
        )

    return WeeklyMealPlanResponse(
        diet_style=diet_style,
        daily_calorie_target=daily_calorie_target,
        days=days,
        grocery_list=groceries,
    )


def generate_weekly_meal_plan(
    diet_style: str = "eat_clean",
    daily_calorie_target: int = 1800,
    language: str = "vi",
    allergies: Optional[List[str]] = None,
) -> WeeklyMealPlanResponse:
    """
    Generate a 7-day scientific meal plan using Gemini Flash or fallback to certified template.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        logger.info("Using fallback scientific meal plan template (no API key configured).")
        return get_fallback_weekly_meal_plan(diet_style, daily_calorie_target, language)

    prompt = (
        f"Generate a customized 7-day meal plan for diet style '{diet_style}' "
        f"with a daily calorie target of {daily_calorie_target} kcal in language '{language}'. "
    )
    if allergies:
        prompt += f"Strictly avoid these allergens/ingredients: {', '.join(allergies)}. "

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=[prompt],
            config=types.GenerateContentConfig(
                system_instruction=MEAL_PLAN_SYSTEM_PROMPT,
                temperature=0.3,
                response_mime_type="application/json",
            ),
        )
        raw_text = (response.text or "").strip()
        parsed = _extract_json_payload(raw_text)
        return WeeklyMealPlanResponse(**parsed)
    except Exception as exc:
        logger.warning("Gemini meal plan generation fell back to template: %s", exc)
        return get_fallback_weekly_meal_plan(diet_style, daily_calorie_target, language)


# ---------------------------------------------------------------------------
# Phase 4: AI Health & Nutrition Coach & Weekly Health Insights
# ---------------------------------------------------------------------------

COACH_SYSTEM_PROMPT = """You are Dr. SnapCook, an empathetic, encouraging, certified clinical nutritionist and sports fitness coach.
Your mission is to guide users to achieve their health goals (weight loss, muscle gain, fitness maintenance) safely, sustainably, and scientifically.
Guidelines:
- Reference specific nutritional numbers (Calories, Protein, Carbs, Healthy Fats, Water) when relevant.
- Provide actionable, easy-to-follow meal and exercise advice with Vietnamese and international foods.
- If the user overate or slipped on their diet, be supportive and offer a constructive recovery strategy (do NOT recommend starvation or skipping meals).
- Never prescribe prescription drugs or recommend unsafe diets (<1200 kcal/day for women, <1500 kcal/day for men).
- Keep responses concise, well-structured (bullet points where helpful), and conversational.
"""


def _build_coach_context(
    profile: Optional[HealthProfileInput],
    today_summary: Optional[dict],
    language: str = "vi",
) -> str:
    parts = []
    is_vi = language.strip().lower() == "vi"
    if profile:
        if is_vi:
            parts.append(
                f"[Hồ sơ người dùng: {profile.gender}, {profile.age} tuổi, "
                f"cao {profile.height_cm}cm, hiện tại {profile.current_weight_kg}kg, "
                f"mục tiêu {profile.target_weight_kg}kg ({profile.main_goal}), "
                f"ăn kiêng {profile.diet_style}, vận động {profile.activity_level}]"
            )
        else:
            parts.append(
                f"[User Profile: {profile.gender}, {profile.age}yo, "
                f"{profile.height_cm}cm, {profile.current_weight_kg}kg, "
                f"target {profile.target_weight_kg}kg ({profile.main_goal}), "
                f"diet {profile.diet_style}, activity {profile.activity_level}]"
            )
    if today_summary:
        eaten = today_summary.get("calories", 0)
        burned = today_summary.get("burned_calories", 0)
        water = today_summary.get("water_ml", 0)
        target = today_summary.get("daily_target", 1800)
        if is_vi:
            parts.append(
                f"[Hôm nay: Đã nạp {eaten} kcal / Mục tiêu {target} kcal, "
                f"Tập luyện đốt cháy {burned} kcal, Nước đã uống {water} ml]"
            )
        else:
            parts.append(
                f"[Today: Eaten {eaten} / Target {target} kcal, "
                f"Burned {burned} kcal, Water {water} ml]"
            )
    return "\n".join(parts)


def ask_ai_health_coach(
    messages: List[ChatMessage],
    profile: Optional[HealthProfileInput] = None,
    today_summary: Optional[dict] = None,
    language: str = "vi",
) -> str:
    """Chat with the AI Nutrition & Fitness Coach."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_vi = language.strip().lower() == "vi"
    last_msg = messages[-1].content if messages else ""

    if not api_key or api_key == "your_gemini_api_key_here":
        # Fallback offline coaching response
        if "lỡ" in last_msg.lower() or "quá đà" in last_msg.lower() or "overeat" in last_msg.lower():
            return (
                "Đừng quá lo lắng hay tự trách bản thân nhé! Một bữa ăn nhiều calo không làm bạn tăng cân ngay được. "
                "Cách xử lý tốt nhất:\n"
                "1. Tuyệt đối không nhịn ăn bữa sau, điều đó làm bạn dễ thèm ăn bù.\n"
                "2. Uống thêm 300-500ml nước ấm để hỗ trợ tiêu hóa và đào thải bớt lượng natri thừa.\n"
                "3. Bữa tối hãy ăn nhẹ bụng với salad ức gà hoặc canh rau thịt nạc giàu chất xơ.\n"
                "4. Đi bộ nhẹ nhàng 20-30 phút để kích thích cơ thể sử dụng năng lượng vừa nạp."
                if is_vi
                else "Don't stress or blame yourself! One heavy meal will not ruin your progress. Drink plenty of water, eat a high-protein light dinner with fresh vegetables, and take a 20-minute walk."
            )
        return (
            f"Chào bạn! Tôi là Dr. SnapCook AI. Về câu hỏi '{last_msg}': "
            "Để đạt được mục tiêu vóc dáng hiệu quả, bạn nên duy trì lượng protein khoảng 1.6-2g/kg cân nặng, "
            "ưu tiên carbs phức hợp (gạo lứt, khoai lang, yến mạch) và kiểm soát calo nạp vào thâm hụt ~300-500 kcal/ngày. "
            "Hãy cho tôi biết cụ thể thực đơn hôm nay của bạn để tôi tư vấn chi tiết hơn nhé!"
            if is_vi
            else "Hello! I am Dr. SnapCook AI. To reach your body goals sustainably, focus on adequate protein intake (1.6-2.0g/kg), complex carbs, and maintaining a moderate caloric deficit. How can I help you today?"
        )

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

    system_instruction = COACH_SYSTEM_PROMPT
    user_context = _build_coach_context(profile, today_summary, language)
    if user_context:
        system_instruction += f"\nContext:\n{user_context}"

    formatted_contents = []
    for m in messages:
        role = "model" if m.role in ("assistant", "model") else "user"
        formatted_contents.append(
            types.Content(role=role, parts=[types.Part.from_text(text=m.content)])
        )

    try:
        response = client.models.generate_content(
            model=model_name,
            contents=formatted_contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            ),
        )
        return (response.text or "").strip()
    except Exception as exc:
        logger.warning("Gemini coach chat failed: %s", exc)
        return (
            "Hiện tại hệ thống AI đang bận xử lý. Lời khuyên cơ bản: Hãy uống đủ nước, ưu tiên rau xanh, đạm nạc và tập luyện đều đặn nhé!"
            if is_vi
            else "AI is currently experiencing high load. Key takeaway: Hydrate well, prioritize lean protein and vegetables, and maintain consistency!"
        )


def generate_weekly_health_report(
    profile: HealthProfileInput,
    days_data: List[dict],
    language: str = "vi",
) -> WeeklyReportResponse:
    """Generate comprehensive weekly health assessment."""
    is_vi = language.strip().lower() == "vi"
    days_count = max(1, len(days_data))
    total_eaten = sum(d.get("calories", 0) for d in days_data)
    total_burned = sum(d.get("burned_calories", 0) for d in days_data)
    total_protein = sum(d.get("protein_g", 0) for d in days_data)

    target_per_day = 1800
    if profile.main_goal == "lose_weight":
        target_per_day = max(
            1200,
            int(
                round(
                    (10 * profile.current_weight_kg + 6.25 * profile.height_cm - 5 * profile.age + 5)
                    * 1.55
                    - 500
                )
            ),
        )
    total_target = target_per_day * days_count

    # Caloric Deficit = Target - Eaten + Burned
    deficit = int(round(total_target - total_eaten + total_burned))
    est_fat_change_kg = round(deficit / 7700.0, 2)
    avg_daily_cal = int(round(total_eaten / days_count))
    avg_protein = round(total_protein / days_count, 1)

    adherence_score = max(50, min(98, 100 - int(abs(avg_daily_cal - target_per_day) / 30)))

    recs = (
        [
            "Duy trì mức thâm hụt calo đều đặn, không để calo nạp vào thấp hơn BMR.",
            "Tăng cường bổ sung nước vào buổi sáng và trước các bữa ăn 30 phút.",
            "Duy trì ít nhất 3 buổi tập kháng lực hoặc cardio mỗi tuần để bảo toàn khối cơ.",
        ]
        if is_vi
        else [
            "Maintain consistent moderate caloric deficit without dropping below BMR.",
            "Increase water intake in the morning and 30 minutes before meals.",
            "Keep at least 3 strength or cardio sessions per week to protect lean muscle.",
        ]
    )

    safety_alerts = []
    if avg_daily_cal < 1200:
        safety_alerts.append(
            "Cảnh báo an toàn: Lượng calo nạp vào trung bình tuần qua dưới 1200 kcal/ngày. Điều này có thể làm chậm trao đổi chất và gây mất cơ!"
            if is_vi
            else "Safety Alert: Average intake was below 1200 kcal/day, risking metabolic adaptation and muscle loss!"
        )

    summary = (
        f"Tuần qua bạn đã hoàn thành {days_count} ngày theo dõi với điểm tuân thủ {adherence_score}/100. "
        f"Tổng calo nạp trung bình {avg_daily_cal} kcal/ngày, đạm {avg_protein}g/ngày. "
        f"Tổng thâm hụt năng lượng đạt {deficit} kcal, ước tính tương đương giảm ~{est_fat_change_kg} kg mỡ thừa!"
        if is_vi
        else f"Over the past week across {days_count} logged days, your adherence score is {adherence_score}/100. "
        f"Average daily calories: {avg_daily_cal} kcal with {avg_protein}g protein. "
        f"Estimated fat change: ~{est_fat_change_kg} kg."
    )

    return WeeklyReportResponse(
        summary_text=summary,
        total_deficit_surplus_kcal=deficit,
        est_fat_change_kg=est_fat_change_kg,
        avg_daily_calories=avg_daily_cal,
        avg_protein_g=avg_protein,
        adherence_score=adherence_score,
        recommendations=recs,
        safety_alerts=safety_alerts,
    )


