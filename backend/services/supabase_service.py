import logging
import os
from typing import Any, Dict, List, Optional
from supabase import Client, create_client

logger = logging.getLogger(__name__)


def get_supabase_client() -> Optional[Client]:
    """Initialize and return a Supabase client if credentials are configured."""
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_KEY", "").strip()

    if not url or not key or "your-project-id" in url or "your_supabase" in key:
        return None

    try:
        return create_client(url, key)
    except Exception as exc:
        logger.warning("Failed to initialize Supabase client: %s", exc)
        return None


def save_recipe_generation(
    recipe_data: List[Dict[str, Any]],
    user_id: Optional[str] = None,
    image_url: Optional[str] = None,
) -> Optional[str]:
    """
    Save the generated recipes array into the Supabase `recipes` table.
    Returns the inserted row's UUID if successful, or None if skipped/failed.
    """
    client = get_supabase_client()
    if not client:
        logger.info("Supabase not configured; skipping database persistence.")
        return None

    payload: Dict[str, Any] = {
        "recipe_data": recipe_data,
        "image_url": image_url,
    }
    if user_id:
        payload["user_id"] = user_id

    try:
        response = client.table("recipes").insert(payload).execute()
        if response.data and len(response.data) > 0:
            return str(response.data[0].get("id"))
    except Exception as exc:
        logger.error("Error saving recipes to Supabase: %s", exc)

    return None


def save_meal_log(
    analysis_data: Dict[str, Any],
    meal_type: str = "lunch",
    user_id: Optional[str] = None,
    image_url: Optional[str] = None,
) -> Optional[str]:
    """
    Save an analyzed dish into the Supabase `meal_logs` table if configured.
    Returns the inserted row's UUID if successful, or None if skipped/failed.
    """
    client = get_supabase_client()
    if not client:
        return None

    payload: Dict[str, Any] = {
        "meal_type": meal_type,
        "food_name": analysis_data.get("food_name", "Unknown Dish"),
        "portion_description": analysis_data.get("portion_description", ""),
        "estimated_grams": analysis_data.get("estimated_grams", 300),
        "calories": analysis_data.get("calories", 0),
        "protein_g": analysis_data.get("protein_g", 0),
        "carbs_g": analysis_data.get("carbs_g", 0),
        "fat_g": analysis_data.get("fat_g", 0),
        "fiber_g": analysis_data.get("fiber_g", 0),
        "health_score": analysis_data.get("health_score", 7),
        "ai_advice": analysis_data.get("ai_advice", ""),
        "components": analysis_data.get("components", []),
        "image_url": image_url,
    }
    if user_id:
        payload["user_id"] = user_id

    try:
        response = client.table("meal_logs").insert(payload).execute()
        if response.data and len(response.data) > 0:
            return str(response.data[0].get("id"))
    except Exception as exc:
        logger.error("Error saving meal log to Supabase: %s", exc)

    return None
