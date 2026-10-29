from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

ALLOWED_DIETS = {
    "vegetarian",
    "vegan",
    "gluten_free",
    "dairy_free",
    "low_carb",
    "high_protein",
    "keto",
    "halal",
}
ALLOWED_LANGUAGES = {"en", "vi"}
ALLOWED_DIFFICULTIES = {"easy", "medium", "hard"}


class RecipeItem(BaseModel):
    name: str = Field(..., min_length=1, description="The title of the recipe")
    ingredients: List[str] = Field(
        ..., min_length=1, description="List of ingredients with quantities"
    )
    instructions: List[str] = Field(
        ..., min_length=1, description="Step-by-step cooking instructions"
    )
    calories: int = Field(
        ..., ge=0, le=5000, description="Estimated calories per serving"
    )
    cooking_time_minutes: Optional[int] = Field(
        default=None, ge=0, le=1440, description="Estimated total cooking time in minutes"
    )
    difficulty: Optional[str] = Field(
        default=None, description="One of: easy, medium, hard"
    )
    servings: Optional[int] = Field(
        default=None, ge=1, le=50, description="Number of servings the recipe yields"
    )

    @field_validator("difficulty", mode="before")
    @classmethod
    def _normalize_difficulty(cls, value):
        if value is None:
            return None
        normalized = str(value).strip().lower()
        return normalized if normalized in ALLOWED_DIFFICULTIES else None


class RecipePreferences(BaseModel):
    diet: List[str] = Field(
        default_factory=list, description="Dietary restrictions (whitelisted values)"
    )
    language: str = Field(default="en", description="Output language: en | vi")
    servings: int = Field(default=2, ge=1, le=12, description="Desired servings")

    @field_validator("diet", mode="before")
    @classmethod
    def _filter_diet(cls, value):
        if not value:
            return []
        if isinstance(value, str):
            value = [value]
        # Only allow whitelisted values to avoid prompt injection
        return [d for d in (str(v).strip().lower() for v in value) if d in ALLOWED_DIETS]

    @field_validator("language", mode="before")
    @classmethod
    def _normalize_language(cls, value):
        normalized = str(value or "en").strip().lower()
        return normalized if normalized in ALLOWED_LANGUAGES else "en"


class GenerateRecipesRequest(BaseModel):
    image_base64: str = Field(
        ...,
        min_length=16,
        description="Base64-encoded image string (with or without data URI prefix)",
    )
    user_id: Optional[str] = Field(
        default=None, description="Optional Supabase user UUID"
    )
    image_url: Optional[str] = Field(
        default=None, description="Optional URL if the image was uploaded to storage"
    )
    preferences: Optional[RecipePreferences] = Field(
        default=None, description="Optional cooking preferences"
    )


class GenerateRecipesResponse(BaseModel):
    recipes: List[RecipeItem]
    detected_ingredients: List[str] = Field(
        default_factory=list, description="Ingredients the AI detected in the photo"
    )
    record_id: Optional[str] = Field(
        default=None, description="Supabase database record ID if persisted"
    )


class ApiErrorResponse(BaseModel):
    detail: str
    error_code: str = Field(
        default="INTERNAL_ERROR",
        description="Machine-readable error code for frontend handling",
    )
