import asyncio
import base64
import json
import logging
import os
from typing import Optional
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import (
    ApiErrorResponse,
    GenerateRecipesRequest,
    GenerateRecipesResponse,
    RecipePreferences,
)
from services.ai_service import (
    AIServiceError,
    MAX_IMAGE_BYTES,
    generate_recipes_from_base64,
)
from services.supabase_service import save_recipe_generation

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("snapcook.api")

app = FastAPI(
    title="SnapCook AI API",
    description="Backend API for SnapCook AI - Fridge Ingredient to Recipe Generator",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _error_response(status_code: int, detail: str, error_code: str) -> JSONResponse:
    payload = ApiErrorResponse(detail=detail, error_code=error_code)
    return JSONResponse(status_code=status_code, content=payload.model_dump())


@app.exception_handler(AIServiceError)
async def ai_service_error_handler(_request: Request, exc: AIServiceError):
    return _error_response(exc.status_code, exc.message, exc.error_code)


@app.get("/")
async def root():
    return {
        "message": "Welcome to SnapCook AI Backend on Vercel",
        "docs": "/docs",
        "health": "/health",
        "status": "online",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SnapCook AI Backend",
        "gemini_configured": bool(
            os.getenv("GEMINI_API_KEY")
            and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here"
        ),
        "supabase_configured": bool(
            os.getenv("SUPABASE_URL")
            and os.getenv("SUPABASE_KEY")
            and "your-project-id" not in os.getenv("SUPABASE_URL", "")
        ),
    }


@app.post(
    "/api/v1/generate-recipes",
    response_model=GenerateRecipesResponse,
    responses={
        400: {"model": ApiErrorResponse},
        413: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
        500: {"model": ApiErrorResponse},
        502: {"model": ApiErrorResponse},
    },
)
async def generate_recipes_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(default=None),
    image_base64: Optional[str] = Form(default=None),
    user_id: Optional[str] = Form(default=None),
    image_url: Optional[str] = Form(default=None),
    preferences: Optional[str] = Form(default=None),
):
    """
    Generate 3 recipes from a fridge/ingredient photo.
    Supports both:
    1. application/json body: {"image_base64": "...", "user_id": "...", "image_url": "...", "preferences": {...}}
    2. multipart/form-data: `file` (UploadFile) or `image_base64` (Form field),
       plus optional `preferences` as a JSON-encoded string.
    """
    content_type = request.headers.get("content-type", "")
    b64_payload: Optional[str] = None
    resolved_user_id: Optional[str] = user_id
    resolved_image_url: Optional[str] = image_url
    resolved_preferences: Optional[RecipePreferences] = None

    if preferences:
        try:
            resolved_preferences = RecipePreferences(**json.loads(preferences))
        except Exception as exc:
            return _error_response(
                status_code=400,
                detail=f"Invalid 'preferences' field: {str(exc)}",
                error_code="INVALID_REQUEST",
            )

    if "application/json" in content_type:
        try:
            body_json = await request.json()
            req_model = GenerateRecipesRequest(**body_json)
            b64_payload = req_model.image_base64
            resolved_user_id = req_model.user_id
            resolved_image_url = req_model.image_url
            resolved_preferences = req_model.preferences
        except Exception as exc:
            return _error_response(
                status_code=400,
                detail=f"Invalid JSON request body: {str(exc)}",
                error_code="INVALID_REQUEST",
            )
    elif file is not None:
        raw_bytes = await file.read()
        if not raw_bytes:
            return _error_response(
                status_code=400,
                detail="Uploaded image file is empty.",
                error_code="INVALID_IMAGE",
            )
        if len(raw_bytes) > MAX_IMAGE_BYTES:
            return _error_response(
                status_code=413,
                detail="Image file exceeds the 10MB maximum allowed size.",
                error_code="IMAGE_TOO_LARGE",
            )
        b64_payload = base64.b64encode(raw_bytes).decode("utf-8")
    elif image_base64 is not None:
        b64_payload = image_base64
    else:
        return _error_response(
            status_code=400,
            detail="Provide either a JSON body with 'image_base64' or a multipart 'file' upload.",
            error_code="INVALID_REQUEST",
        )

    logger.info("Processing recipe generation request (payload len=%d)...", len(b64_payload))
    recipes, detected_ingredients = await asyncio.to_thread(
        generate_recipes_from_base64, b64_payload, resolved_preferences
    )
    logger.info("Successfully generated %d recipes from AI.", len(recipes))

    recipe_dicts = [r.model_dump() for r in recipes]
    record_id = await asyncio.to_thread(
        save_recipe_generation,
        recipe_data=recipe_dicts,
        user_id=resolved_user_id,
        image_url=resolved_image_url,
    )
    if record_id:
        logger.info("Recipes persisted to Supabase with ID: %s", record_id)

    return GenerateRecipesResponse(
        recipes=recipes,
        detected_ingredients=detected_ingredients,
        record_id=record_id,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
