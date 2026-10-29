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
    AnalyzeFoodRequest,
    AnalyzeFoodResponse,
    ApiErrorResponse,
    CalculateWorkoutRequest,
    CalculateWorkoutResponse,
    CoachChatRequest,
    CoachChatResponse,
    GenerateMealPlanRequest,
    GenerateRecipesRequest,
    GenerateRecipesResponse,
    HealthMetricsResponse,
    HealthProfileInput,
    MacroTargets,
    RecipePreferences,
    WeeklyMealPlanResponse,
    WeeklyReportRequest,
    WeeklyReportResponse,
)
from services.ai_service import (
    AIServiceError,
    MAX_IMAGE_BYTES,
    analyze_food_from_base64,
    ask_ai_health_coach,
    generate_recipes_from_base64,
    generate_weekly_health_report,
    generate_weekly_meal_plan,
)
from services.health_calculator import (
    calculate_bmi,
    calculate_bmr,
    calculate_daily_calorie_target,
    calculate_macro_targets,
    calculate_tdee,
)
from services.workout_service import (
    EXERCISE_CATALOG,
    calculate_calories_burned,
    get_exercise_list,
)
from services.supabase_service import save_meal_log, save_recipe_generation

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


@app.post(
    "/api/v1/health/calculate",
    response_model=HealthMetricsResponse,
    responses={400: {"model": ApiErrorResponse}},
)
async def calculate_health_metrics_endpoint(profile: HealthProfileInput):
    """
    Calculate BMI, BMR (Mifflin-St Jeor), TDEE, safe Daily Calorie Target, and Macro targets.
    """
    bmi, bmi_category = calculate_bmi(profile.current_weight_kg, profile.height_cm)
    bmr = calculate_bmr(
        profile.gender, profile.current_weight_kg, profile.height_cm, profile.age
    )
    tdee = calculate_tdee(bmr, profile.activity_level)
    daily_target, safety_note = calculate_daily_calorie_target(
        tdee=tdee,
        gender=profile.gender,
        main_goal=profile.main_goal,
        current_weight_kg=profile.current_weight_kg,
        target_weight_kg=profile.target_weight_kg,
    )
    macro_dict = calculate_macro_targets(
        daily_calories=daily_target,
        main_goal=profile.main_goal,
        diet_style=profile.diet_style,
    )
    return HealthMetricsResponse(
        bmi=bmi,
        bmi_category=bmi_category,
        bmr=bmr,
        tdee=tdee,
        daily_calorie_target=daily_target,
        macros=MacroTargets(**macro_dict),
        safety_note=safety_note,
    )


@app.post(
    "/api/v1/analyze-food",
    response_model=AnalyzeFoodResponse,
    responses={
        400: {"model": ApiErrorResponse},
        413: {"model": ApiErrorResponse},
        422: {"model": ApiErrorResponse},
        500: {"model": ApiErrorResponse},
        502: {"model": ApiErrorResponse},
    },
)
async def analyze_food_endpoint(
    request: Request,
    file: Optional[UploadFile] = File(default=None),
    image_base64: Optional[str] = Form(default=None),
    language: Optional[str] = Form(default="vi"),
    meal_type: Optional[str] = Form(default="lunch"),
    dietary_goal: Optional[str] = Form(default="lose_weight"),
    user_id: Optional[str] = Form(default=None),
    image_url: Optional[str] = Form(default=None),
):
    """
    AI Food Lens: Analyze a photo of a prepared dish/meal and return estimated calories,
    macronutrients (Protein, Carbs, Fat, Fiber), health score, and personalized AI advice.
    """
    content_type = request.headers.get("content-type", "")
    b64_payload: Optional[str] = None
    resolved_lang = language or "vi"
    resolved_meal_type = meal_type or "lunch"
    resolved_goal = dietary_goal or "lose_weight"
    resolved_user_id = user_id
    resolved_image_url = image_url

    if "application/json" in content_type:
        try:
            body_json = await request.json()
            req_model = AnalyzeFoodRequest(**body_json)
            b64_payload = req_model.image_base64
            resolved_lang = req_model.language
            resolved_meal_type = req_model.meal_type
            resolved_goal = req_model.dietary_goal
            resolved_user_id = req_model.user_id
            resolved_image_url = req_model.image_url
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

    logger.info(
        "Processing AI Food Lens request (meal=%s, goal=%s, payload len=%d)...",
        resolved_meal_type,
        resolved_goal,
        len(b64_payload),
    )
    analysis = await asyncio.to_thread(
        analyze_food_from_base64,
        b64_payload,
        resolved_lang,
        resolved_meal_type,
        resolved_goal,
    )
    logger.info(
        "Successfully analyzed food '%s' (%d kcal).",
        analysis.food_name,
        analysis.calories,
    )

    record_id = await asyncio.to_thread(
        save_meal_log,
        analysis_data=analysis.model_dump(),
        meal_type=resolved_meal_type,
        user_id=resolved_user_id,
        image_url=resolved_image_url,
    )

    return AnalyzeFoodResponse(analysis=analysis, record_id=record_id)


# ---------------------------------------------------------------------------
# Phase 2 & 3: Workouts, Calorie Burn & Smart Weekly Meal Plan
# ---------------------------------------------------------------------------


@app.get("/api/v1/workouts/exercises")
async def get_supported_exercises_endpoint(language: str = "vi"):
    """List supported exercise types with localized names and base METs."""
    return {"exercises": get_exercise_list(language)}


@app.post("/api/v1/workouts/calculate", response_model=CalculateWorkoutResponse)
async def calculate_workout_calories_endpoint(req: CalculateWorkoutRequest):
    """
    Calculate burned calories using MET formula based on weight, duration, and intensity.
    """
    burned = calculate_calories_burned(
        exercise_type=req.exercise_type,
        duration_minutes=req.duration_minutes,
        weight_kg=req.weight_kg,
        intensity=req.intensity,
    )
    exercise_info = EXERCISE_CATALOG.get(req.exercise_type.lower())
    name = (
        (exercise_info["name_vi"] if req.language == "vi" else exercise_info["name_en"])
        if exercise_info
        else req.exercise_type.title()
    )

    return CalculateWorkoutResponse(
        exercise_type=req.exercise_type,
        exercise_name=name,
        duration_minutes=req.duration_minutes,
        weight_kg=req.weight_kg,
        intensity=req.intensity,
        calories_burned=burned,
    )


@app.post("/api/v1/meal-plan/generate", response_model=WeeklyMealPlanResponse)
async def generate_meal_plan_endpoint(req: GenerateMealPlanRequest):
    """
    Generate a 7-day structured meal plan tailored to the user's calorie budget & diet style.
    """
    plan = await asyncio.to_thread(
        generate_weekly_meal_plan,
        diet_style=req.diet_style,
        daily_calorie_target=req.daily_calorie_target,
        language=req.language,
        allergies=req.allergies,
    )
    return plan


# ---------------------------------------------------------------------------
# Phase 4: AI Health Coach & Weekly Insights
# ---------------------------------------------------------------------------


@app.post("/api/v1/coach/chat", response_model=CoachChatResponse)
async def coach_chat_endpoint(req: CoachChatRequest):
    """
    Chat with Dr. SnapCook AI Nutrition & Fitness Coach.
    """
    reply = await asyncio.to_thread(
        ask_ai_health_coach,
        messages=req.messages,
        profile=req.user_profile,
        today_summary=req.today_summary,
        language=req.language,
    )
    return CoachChatResponse(reply=reply)


@app.post("/api/v1/coach/weekly-report", response_model=WeeklyReportResponse)
async def coach_weekly_report_endpoint(req: WeeklyReportRequest):
    """
    Generate an in-depth weekly nutritional and calorie adherence report.
    """
    report = await asyncio.to_thread(
        generate_weekly_health_report,
        profile=req.user_profile,
        days_data=req.days_data,
        language=req.language,
    )
    return report


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
