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
