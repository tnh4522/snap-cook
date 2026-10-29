from typing import List, Optional
from pydantic import BaseModel, Field


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


class GenerateRecipesResponse(BaseModel):
    recipes: List[RecipeItem]
    record_id: Optional[str] = Field(
        default=None, description="Supabase database record ID if persisted"
    )


class ApiErrorResponse(BaseModel):
    detail: str
    error_code: str = Field(
        default="INTERNAL_ERROR",
        description="Machine-readable error code for frontend handling",
    )
