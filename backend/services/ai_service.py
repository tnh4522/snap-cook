import base64
import io
import json
import logging
import os
import re
from typing import Any, List
from google import genai
from google.genai import types
from PIL import Image
from pydantic import TypeAdapter, ValidationError

from models import RecipeItem

logger = logging.getLogger(__name__)

MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB

SYSTEM_PROMPT = """You are an expert culinary AI assistant for SnapCook AI.
Analyze the provided image of a fridge, pantry, or food ingredients.
1. Identify all edible ingredients visible in the image.
2. Create 3 delicious, practical recipes that primarily use the detected ingredients (common pantry staples like salt, pepper, cooking oil, and water may be assumed).
3. Return ONLY a valid JSON array containing 3 recipe objects matching this exact schema:
[
  {
    "name": "Recipe Title",
    "ingredients": ["2 eggs", "1 cup spinach", "1 tbsp olive oil"],
    "instructions": ["Step 1...", "Step 2...", "Step 3..."],
    "calories": 400
  }
]
If no food or ingredients can be reasonably identified in the image, return an empty JSON array: []
Do not include markdown code fences or any extra commentary outside the JSON array."""


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
        # Attempt to locate the outermost JSON array [...]
        match = re.search(r"\[.*\]", cleaned, flags=re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
        raise


def generate_recipes_from_base64(base64_image: str) -> List[RecipeItem]:
    """
    Accepts a Base64 encoded image string, sends it to Google Gemini Flash,
    and returns a validated list of 3 RecipeItem models.
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
                "Identify the ingredients in this photo and generate 3 recipes in the requested JSON format.",
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

    if isinstance(parsed_json, dict):
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
        recipes = adapter.validate_python(parsed_json)
    except ValidationError as exc:
        logger.error("Pydantic validation failed for AI response: %s", exc)
        raise AIServiceError(
            "AI output did not match the expected recipe schema. Please try again.",
            status_code=502,
            error_code="INVALID_AI_SCHEMA",
        ) from exc

    return recipes[:3]
