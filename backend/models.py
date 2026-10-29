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
ALLOWED_GENDERS = {"male", "female"}
ALLOWED_ACTIVITIES = {"sedentary", "light", "moderate", "active", "very_active"}
ALLOWED_GOALS = {"lose_weight", "maintain", "gain_muscle"}
ALLOWED_MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack"}
ALLOWED_DIET_STYLES = {
    "balanced",
    "eat_clean",
    "high_protein",
    "low_carb",
    "keto",
    "vegetarian",
    "vegan",
}


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


# ---------------------------------------------------------------------------
# Phase 1: Health Profile, BMR/TDEE & AI Food Lens (Calorie/Macro Analysis)
# ---------------------------------------------------------------------------


class HealthProfileInput(BaseModel):
    gender: str = Field(default="female", description="male | female")
    age: int = Field(default=25, ge=10, le=120, description="Age in years")
    height_cm: float = Field(default=165.0, ge=80.0, le=260.0, description="Height in cm")
    current_weight_kg: float = Field(
        default=60.0, ge=20.0, le=350.0, description="Current weight in kg"
    )
    target_weight_kg: float = Field(
        default=55.0, ge=20.0, le=350.0, description="Target weight in kg"
    )
    activity_level: str = Field(
        default="moderate",
        description="sedentary | light | moderate | active | very_active",
    )
    main_goal: str = Field(
        default="lose_weight", description="lose_weight | maintain | gain_muscle"
    )
    diet_style: str = Field(
        default="balanced",
        description="balanced | eat_clean | high_protein | low_carb | keto | vegetarian | vegan",
    )

    @field_validator("gender", mode="before")
    @classmethod
    def _normalize_gender(cls, value):
        normalized = str(value or "female").strip().lower()
        return normalized if normalized in ALLOWED_GENDERS else "female"

    @field_validator("activity_level", mode="before")
    @classmethod
    def _normalize_activity(cls, value):
        normalized = str(value or "moderate").strip().lower()
        return normalized if normalized in ALLOWED_ACTIVITIES else "moderate"

    @field_validator("main_goal", mode="before")
    @classmethod
    def _normalize_goal(cls, value):
        normalized = str(value or "lose_weight").strip().lower()
        return normalized if normalized in ALLOWED_GOALS else "lose_weight"

    @field_validator("diet_style", mode="before")
    @classmethod
    def _normalize_diet_style(cls, value):
        normalized = str(value or "balanced").strip().lower()
        return normalized if normalized in ALLOWED_DIET_STYLES else "balanced"


class MacroTargets(BaseModel):
    protein_g: int
    carbs_g: int
    fat_g: int
    fiber_g: int
    protein_pct: int
    carbs_pct: int
    fat_pct: int


class HealthMetricsResponse(BaseModel):
    bmi: float
    bmi_category: str
    bmr: int
    tdee: int
    daily_calorie_target: int
    macros: MacroTargets
    safety_note: str = ""


class FoodComponentItem(BaseModel):
    name: str = Field(..., min_length=1, description="Name of the food component")
    estimated_grams: int = Field(default=100, ge=1, le=3000)
    calories: int = Field(default=0, ge=0, le=5000)
    protein_g: float = Field(default=0.0, ge=0.0, le=500.0)
    carbs_g: float = Field(default=0.0, ge=0.0, le=500.0)
    fat_g: float = Field(default=0.0, ge=0.0, le=500.0)


class FoodAnalysisResult(BaseModel):
    food_name: str = Field(..., min_length=1, description="Detected dish name")
    portion_description: str = Field(
        default="1 standard serving", description="Portion size description"
    )
    estimated_grams: int = Field(default=300, ge=10, le=5000)
    calories: int = Field(..., ge=0, le=10000, description="Total estimated calories")
    protein_g: float = Field(default=0.0, ge=0.0, le=1000.0)
    carbs_g: float = Field(default=0.0, ge=0.0, le=1000.0)
    fat_g: float = Field(default=0.0, ge=0.0, le=1000.0)
    fiber_g: float = Field(default=0.0, ge=0.0, le=500.0)
    sugar_g: float = Field(default=0.0, ge=0.0, le=500.0)
    sodium_mg: int = Field(default=0, ge=0, le=20000)
    health_score: int = Field(
        default=7, ge=1, le=10, description="Healthiness rating from 1 to 10"
    )
    health_tags: List[str] = Field(
        default_factory=list,
        description="Short tags e.g. High Protein, Balanced, High Sodium",
    )
    ai_advice: str = Field(
        default="",
        description="Personalized dietary advice for this dish",
    )
    components: List[FoodComponentItem] = Field(
        default_factory=list,
        description="Breakdown of visible components in the dish",
    )


class AnalyzeFoodRequest(BaseModel):
    image_base64: str = Field(
        ...,
        min_length=16,
        description="Base64-encoded image string of the prepared food",
    )
    language: str = Field(default="vi", description="Output language: en | vi")
    meal_type: str = Field(
        default="lunch", description="breakfast | lunch | dinner | snack"
    )
    dietary_goal: str = Field(
        default="lose_weight", description="lose_weight | maintain | gain_muscle"
    )
    user_id: Optional[str] = Field(default=None, description="Optional Supabase user UUID")
    image_url: Optional[str] = Field(default=None)

    @field_validator("language", mode="before")
    @classmethod
    def _normalize_lang(cls, value):
        normalized = str(value or "en").strip().lower()
        return normalized if normalized in ALLOWED_LANGUAGES else "en"

    @field_validator("meal_type", mode="before")
    @classmethod
    def _normalize_meal_type(cls, value):
        normalized = str(value or "lunch").strip().lower()
        return normalized if normalized in ALLOWED_MEAL_TYPES else "lunch"

    @field_validator("dietary_goal", mode="before")
    @classmethod
    def _normalize_dietary_goal(cls, value):
        normalized = str(value or "lose_weight").strip().lower()
        return normalized if normalized in ALLOWED_GOALS else "lose_weight"


class AnalyzeFoodResponse(BaseModel):
    analysis: FoodAnalysisResult
    record_id: Optional[str] = None


# ---------------------------------------------------------------------------
# Phase 2 & 3: Workouts, Weight, Water & Smart Weekly Meal Planner
# ---------------------------------------------------------------------------


class CalculateWorkoutRequest(BaseModel):
    exercise_type: str = Field(default="running")
    duration_minutes: int = Field(default=30, ge=1, le=1440)
    weight_kg: float = Field(default=60.0, ge=20.0, le=350.0)
    intensity: str = Field(default="moderate")
    language: str = Field(default="vi")


class CalculateWorkoutResponse(BaseModel):
    exercise_type: str
    exercise_name: str
    duration_minutes: int
    weight_kg: float
    intensity: str
    calories_burned: int


class LogWeightRequest(BaseModel):
    weight_kg: float = Field(..., ge=20.0, le=350.0)
    notes: Optional[str] = Field(default=None, max_length=500)
    user_id: Optional[str] = None


class LogWaterRequest(BaseModel):
    amount_ml: int = Field(..., ge=50, le=10000)
    date: Optional[str] = None
    user_id: Optional[str] = None


class PlannedMealItem(BaseModel):
    meal_type: str = Field(description="breakfast | lunch | dinner | snack")
    food_name: str
    portion_desc: str = "1 khẩu phần"
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    cooking_tip: Optional[str] = ""
    ingredients: List[str] = Field(default_factory=list)


class PlannedDay(BaseModel):
    day_index: int = Field(ge=1, le=7)
    day_name: str = "Thứ 2"
    meals: List[PlannedMealItem] = Field(default_factory=list)
    total_calories: int
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float


class GenerateMealPlanRequest(BaseModel):
    diet_style: str = Field(default="eat_clean")
    daily_calorie_target: int = Field(default=1800, ge=1000, le=5000)
    language: str = Field(default="vi")
    allergies: List[str] = Field(default_factory=list)
    servings: int = Field(default=1, ge=1, le=10)


class WeeklyMealPlanResponse(BaseModel):
    diet_style: str
    daily_calorie_target: int
    days: List[PlannedDay]
    grocery_list: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Phase 4: AI Health & Nutrition Coach Chatbot & Weekly Insights
# ---------------------------------------------------------------------------


class ChatMessage(BaseModel):
    role: str = Field(description="user | model | assistant")
    content: str = Field(min_length=1)


class CoachChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_profile: Optional[HealthProfileInput] = None
    today_summary: Optional[dict] = Field(default_factory=dict)
    language: str = Field(default="vi")


class CoachChatResponse(BaseModel):
    reply: str


class WeeklyReportRequest(BaseModel):
    user_profile: HealthProfileInput
    days_data: List[dict] = Field(
        default_factory=list,
        description="Daily calories eaten, burned, and macros over the past 7 days",
    )
    language: str = Field(default="vi")


class WeeklyReportResponse(BaseModel):
    summary_text: str
    total_deficit_surplus_kcal: int
    est_fat_change_kg: float
    avg_daily_calories: int
    avg_protein_g: float
    adherence_score: int = Field(ge=1, le=100)
    recommendations: List[str] = Field(default_factory=list)
    safety_alerts: List[str] = Field(default_factory=list)
