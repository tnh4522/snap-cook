# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

- **Primary**: Home cooks, busy professionals, and families standing in front of their refrigerator or pantry with mismatched ingredients, wanting fast, zero-waste meal inspiration without typing or searching.
- **Secondary**: Health-conscious individuals and meal preppers seeking to balance home cooking with daily calorie, macronutrient, hydration, and fasting tracking.

## Product Purpose

Eliminate mealtime decision fatigue and food waste by turning photos of available raw ingredients into practical, delicious recipes with step-by-step interactive cooking guidance, supported by effortless companion health and nutrition logging. Success means a user goes from viewing raw ingredients on the counter to actively cooking a meal within minutes.

## Positioning

Recipe-first with integrated wellness: Unlike generic recipe aggregators that require manual ingredient searching, or standalone calorie counters detached from cooking, SnapCook AI starts with the physical ingredients through the camera lens. It generates tailored recipes via Google Gemini AI, scales servings dynamically, guides hands-on cooking, and directly bridges home cooking with daily nutritional goals.

## Operating Context

- **Environment**: Kitchen countertops, dim refrigerator interiors, messy preparation areas, and grocery storage.
- **Physical Reality**: Users often operate their mobile device with one hand, occasionally with wet or floury fingers, and glance at the screen from a distance while cooking.
- **Connectivity**: Variable home Wi-Fi and kitchen cellular dead zones; requires reliable local persistence for recipes, favorites, and history.
- **Locales**: Bilingual support for Vietnamese and English.

## Capabilities and Constraints

- **Capabilities**:
  - **Visual Ingredient Detection**: Real-time camera capture and photo picker with automatic client-side compression and Gemini 3.5 Flash ingredient parsing.
  - **Dynamic Recipe Generation**: Produces 3 tailored recipes per scan with difficulty rating, preparation and cooking times, estimated calories, serving scaler (1–12 portions), and missing ingredient indicators.
  - **Interactive Kitchen Mode**: Checkable prep checklist, sequential step completion with visual progress, and native OS recipe sharing.
  - **Meal & Food Photo Analysis**: Instant calorie and macronutrient (Protein, Carbs, Fat) estimation from prepared meal photos with portion scaling (0.5x–1.5x) and meal logging.
  - **Companion Wellness Suite**: Fasting timer (16:8, 18:6, circadian), daily hydration tracker, weight and workout logging, daily macro progress rings, AI Nutrition Coach chat (`coach.tsx`), and weekly nutrition summaries.
  - **Data Architecture**: Local-first storage via `AsyncStorage` / SQLite with optional cloud synchronization and authentication via Supabase.
- **Constraints**:
  - Target runtime: Expo SDK 58 / React Native 0.88 with NativeWind (Tailwind CSS v3) across iOS and Android (`adaptive`).
  - Strict JSON normalization and fallbacks for AI model outputs to avoid rendering failures.
  - Native permission handling for camera and photo library with clear fallback states.
  - Both Dark and Light theme support matching system and user preference.

## Brand Commitments

- **Name**: SnapCook AI
- **Voice & Tone**: Encouraging, pragmatic, culinary-minded, and clear. Zero culinary snobbery or guilt-inducing diet messaging.
- **Visual Identity**: Dark slate backdrop (`#020617`) with appetizing culinary accents (warm amber, fresh emerald, vibrant coral), clear typography, and Lucide native iconography.
- **Languages**: English and Vietnamese (supported via in-app `i18n`).

## Evidence on Hand

- Complete 5-tab mobile application in `app/app/(tabs)` (`index`, `health`, `history`, `favorites`, `settings`).
- Dedicated sub-flows: Interactive recipe view (`app/app/recipe/[id].tsx`), meal planner (`app/app/meal-planner.tsx`), food analysis (`app/app/food-analysis.tsx`), and AI coach (`app/app/coach.tsx`).
- Production-ready FastAPI backend in `backend/` with Gemini 3.5 Flash integration and 8 automated tests in `backend/tests/test_api.py`.
- Verified native assets in `app/assets/images/` including app icons and splash artwork.

## Product Principles

1. **Lens to Pan in Seconds**: Minimize friction between opening the camera and starting to cook. Core value is delivered without mandatory account creation or complex setup.
2. **Cook with What You Have**: Prioritize recipes that maximize available ingredients and minimize extra shopping; clearly identify pantry staples.
3. **Hands-Busy Ergonomics**: Build for real kitchen conditions with generous tap targets, high contrast, readable typography from arm's length, and persistent step state.
4. **Nourishment Over Restriction**: Treat calories and macros as empowering information for wellness rather than rigid, punitive restrictions.
5. **Resilient Local-First Utility**: A saved recipe or favorite must open and work seamlessly even if the internet drops mid-cook.

## Accessibility & Inclusion

- High contrast text and controls readable in glaring kitchen sunlight or dim evening lighting.
- Complete localization parity between Vietnamese and English.
- Minimum 44x44pt touch targets on interactive buttons, checkboxes, and modal dismissals.
- Respect system font scaling, screen reader labels, and reduced motion preferences.
