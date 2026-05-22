"""Regression tests for admin-web Phase 4c/4d auth + mobile-config contracts."""

import os

import pytest
import requests


BASE_URL = os.environ.get("NEXT_PUBLIC_APP_URL")


@pytest.fixture(scope="module")
def base_url() -> str:
    if not BASE_URL:
        pytest.skip("NEXT_PUBLIC_APP_URL is not set; cannot run admin-web API contract tests")
    return BASE_URL.rstrip("/")


def test_settings_requires_admin_session_redirect(base_url: str):
    response = requests.get(f"{base_url}/settings", allow_redirects=False, timeout=20)
    assert response.status_code == 307
    assert response.headers.get("location", "").startswith("/login?from=%2Fsettings")


def test_mobile_config_requires_admin_session_redirect(base_url: str):
    response = requests.get(f"{base_url}/api/mobile-config", allow_redirects=False, timeout=20)
    assert response.status_code == 307
    assert response.headers.get("location", "").startswith("/login?from=%2Fapi%2Fmobile-config")


def test_ai_meal_plan_without_bearer_returns_401(base_url: str):
    payload = {
        "user_id": "test-user",
        "goal": "lose_weight",
        "daily_calorie_target": 2000,
        "diets": [],
        "allergies": [],
        "cook_time": "30 min",
        "meal_types": ["breakfast"],
        "date": "2026-05-22",
        "reuse_today_if_present": True,
    }
    response = requests.post(
        f"{base_url}/api/ai/meal-plan",
        json=payload,
        allow_redirects=False,
        timeout=20,
    )
    assert response.status_code == 401
    data = response.json()
    assert data.get("ok") is False
    assert data.get("error") == "missing_authorization"
