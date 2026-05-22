"""Contract tests for Phase 4e follow-up feature wiring across admin-web and iOS."""

from pathlib import Path
import os

import pytest
import requests


BASE_URL = os.environ.get("NEXT_PUBLIC_APP_URL")


def _read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


# meal-plan-service: response detail contract for generated + reused plans
def test_meal_plan_service_returns_full_fields_for_generated_and_reused_paths():
    content = _read("/app/admin-web/src/lib/ai/meal-plan-service.ts")

    assert "description: string | null" in content
    assert 'meal_type: "breakfast" | "lunch" | "dinner" | "snack"' in content
    assert "protein_g: number" in content
    assert "carbs_g: number" in content
    assert "fat_g: number" in content
    assert "ingredients: GeneratedMeal[\"ingredients\"]" in content
    assert "recipe_steps: string[]" in content
    assert "image_url: string | null" in content

    # Reused-plan mapper includes full details
    assert "description: it.meal?.description ?? null" in content
    assert "meal_type: it.meal?.meal_type ?? \"snack\"" in content
    assert "ingredients: it.meal?.ingredients ?? []" in content
    assert "recipe_steps: it.meal?.recipe_steps ?? []" in content

    # Generated/new meal path includes full details
    assert "description: meal.description ?? null" in content
    assert "ingredients: meal.ingredients" in content
    assert "recipe_steps: meal.recipe_steps" in content


# iOS AIService: decode full API payload fields and map to Meal/Ingredient
def test_ios_ai_service_decodes_full_ingredients_and_macros():
    content = _read("/app/FitMealAI/Core/Services/AIService.swift")

    assert "let description: String?" in content
    assert "let meal_type: String?" in content
    assert "let protein_g: Int?" in content
    assert "let carbs_g: Int?" in content
    assert "let fat_g: Int?" in content
    assert "let ingredients: [AIIngredient]?" in content
    assert "let recipe_steps: [String]?" in content
    assert "let image_url: String?" in content

    assert "let protein_g: Int" in content
    assert "let carbs_g: Int" in content
    assert "let fat_g: Int" in content
    assert "func asIngredient() -> Ingredient" in content


# admin-actions: regenerate uses saved onboarding preferences
def test_regenerate_user_meal_plan_reads_goals_and_prefs_then_calls_generator():
    content = _read("/app/admin-web/src/lib/supabase/admin-actions.ts")

    assert "export async function regenerateUserMealPlan(userId: string)" in content
    assert '.from("user_goals")' in content
    assert '.from("meal_prefs")' in content
    assert "fitness_goal,daily_calorie_target" in content
    assert "diets,timings,cook_time,allergies" in content
    assert "const result = await generateMealPlan({" in content
    assert "reuse_today_if_present: false" in content


# dashboard + user details: regenerate controls available for admins
def test_admin_ui_has_regenerate_tool_on_dashboard_and_user_detail():
    dashboard = _read("/app/admin-web/src/app/(admin)/dashboard-regenerate-tool.tsx")
    user_actions = _read("/app/admin-web/src/app/(admin)/users/[id]/user-actions.tsx")

    assert 'data-testid="dashboard-regenerate-user-id-input"' in dashboard
    assert 'data-testid="dashboard-regenerate-submit-button"' in dashboard
    assert "regenerateUserMealPlan(userId)" in user_actions
    assert 'data-testid="user-actions-regenerate-plan-button"' in user_actions


# settings helper + middleware auth boundaries
def test_settings_google_placeholders_and_middleware_route_protection_contracts():
    settings_panel = _read("/app/admin-web/src/app/(admin)/settings/mobile-config-panel.tsx")
    middleware = _read("/app/admin-web/src/middleware.ts")

    assert 'data-testid="mobile-config-google-ios-client-id-input"' in settings_panel
    assert 'data-testid="mobile-config-google-reversed-client-id-input"' in settings_panel
    assert 'data-testid="mobile-config-google-server-client-id-input"' in settings_panel

    assert '"/api/ai/meal-plan"' in middleware
    assert '"/api/mobile-config"' not in middleware


# live API behavior contract (skip if URL unavailable in environment)
def test_live_api_auth_boundary_for_ai_and_mobile_config():
    if not BASE_URL:
        pytest.skip("NEXT_PUBLIC_APP_URL is not set; skipping live API auth-boundary checks")

    base_url = BASE_URL.rstrip("/")
    payload = {
        "user_id": "00000000-0000-0000-0000-000000000000",
        "goal": "lose_weight",
        "daily_calorie_target": 2000,
        "diets": ["balanced"],
        "allergies": [],
        "cook_time": "30 min",
        "meal_types": ["breakfast"],
        "date": "2026-05-22",
        "reuse_today_if_present": True,
    }

    ai_response = requests.post(
        f"{base_url}/api/ai/meal-plan",
        json=payload,
        allow_redirects=False,
        timeout=20,
    )
    assert ai_response.status_code == 401
    ai_data = ai_response.json()
    assert ai_data.get("ok") is False
    assert ai_data.get("error") == "missing_authorization"

    config_response = requests.get(
        f"{base_url}/api/mobile-config",
        allow_redirects=False,
        timeout=20,
    )
    assert config_response.status_code == 307
    assert config_response.headers.get("location", "").startswith(
        "/login?from=%2Fapi%2Fmobile-config"
    )
