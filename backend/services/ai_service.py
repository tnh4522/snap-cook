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

from models import RecipeItem, RecipePreferences

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
