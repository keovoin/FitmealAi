"""Static regression tests for Android runtime wiring and payload mapping contracts."""

from pathlib import Path


def _read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


# Android domain models: meal detail fields must include description and recipe steps
def test_android_meal_domain_includes_description_and_recipe_steps():
    content = _read("/app/android/app/src/main/java/com/fitmealai/domain/Models.kt")
    assert "val description: String? = null" in content
    assert "val recipeSteps: List<String> = emptyList()" in content


# Android AI mapping: backend response fields description + recipe_steps are mapped
def test_android_ai_repository_maps_description_and_recipe_steps():
    content = _read("/app/android/app/src/main/java/com/fitmealai/data/Services.kt")
    assert 'description = item.optString("description").ifBlank { null }' in content
    assert 'recipeSteps = item.optJSONArray("recipe_steps")?.let { steps ->' in content


# Android ViewModel: repositories injected and runtime actions call their integrations
def test_android_viewmodel_wires_auth_ai_payment_repositories_and_actions():
    content = _read("/app/android/app/src/main/java/com/fitmealai/ui/FitMealViewModel.kt")
    assert "private val authRepository: AuthRepository = AuthRepository()" in content
    assert "private val aiRepository: AIRepository = AIRepository()" in content
    assert "private val paymentRepository: PaymentRepository = PaymentRepository()" in content
    assert "val session = authRepository.signIn(email, password)" in content
    assert "val plan = aiRepository.generateMealPlan(" in content
    assert "val payment = paymentRepository.submitAbaPayment(" in content


# Android root app wiring: screen callbacks connected to ViewModel actions
def test_android_app_routes_login_and_home_callbacks_to_viewmodel_actions():
    content = _read("/app/android/app/src/main/java/com/fitmealai/ui/FitMealAndroidApp.kt")
    assert "onEmailSignIn = { email, password -> viewModel.signIn(email, password)" in content
    assert "onGenerateMealPlan = viewModel::generateMealPlan" in content
    assert "onSubmitPayment = viewModel::submitAbaPayment" in content


# Login screen contract: password input + message + email sign-in action + test tags
def test_login_screen_exposes_password_message_and_email_sign_in_tagged_elements():
    content = _read("/app/android/app/src/main/java/com/fitmealai/ui/screens/LoginScreen.kt")
    assert 'testTag("android-login-email-input")' in content
    assert 'testTag("android-login-password-input")' in content
    assert 'Modifier.testTag("android-login-message")' in content
    assert 'tag = "android-login-continue-button"' in content
    assert "onClick = { onEmailSignIn(email, password) }" in content


# Home screen contract: generate-plan and payment actions are connected through callbacks
def test_home_screen_wires_generate_and_payment_buttons_to_viewmodel_callbacks():
    content = _read("/app/android/app/src/main/java/com/fitmealai/ui/screens/HomeScreen.kt")
    assert 'tag = "android-meals-generate-button"' in content
    assert "onClick = onGenerateMealPlan" in content
    assert '"android-home-payment-button", onSubmitPayment' in content
    assert '"android-settings-payment-button", onSubmitPayment' in content


# Payment contract: Android payload uses pending and enum includes pending
def test_payment_status_pending_used_in_android_and_present_in_supabase_enum():
    services = _read("/app/android/app/src/main/java/com/fitmealai/data/Services.kt")
    migration = _read("/app/supabase/migrations/0001_extensions_and_enums.sql")
    assert '.put("status", "pending")' in services
    assert "create type payment_status as enum ('draft', 'pending', 'approved', 'rejected');" in migration


# Auth test guide contract: auth_testing.md exists with Android/mobile auth notes
def test_auth_testing_notes_exist_with_mobile_android_guidance():
    content = _read("/app/auth_testing.md")
    assert "# Auth Testing Notes" in content
    assert "Android Supabase email/password repository is wired" in content
    assert "Android Google still requires Credential Manager" in content
