# FitMeal AI Android

Android A1 foundation for the future FitMeal AI Android app.

## What is included

- Kotlin + Jetpack Compose project shell.
- Dark glass theme ported from the iOS `AppTheme` tokens.
- Domain models for profile, meals, ingredients, meal plans, tiers, and goals.
- Mock data matching the iOS preview concept.
- Starter root flow: splash → login → onboarding → main shell.
- Main shell with Home/Meals/Workout/Habits/Progress tabs.

## Integration status

- Supabase email/password REST calls are wired in `AuthRepository` and activate when Gradle config values are provided.
- AI meal generation REST calls are wired in `AIRepository` and call the existing `/api/ai/meal-plan` endpoint.
- ABA payment request insertion is wired in `PaymentRepository` for the `payment_requests` table.
- Google Credential Manager and Play Billing UI/runtime are still next because Google/Play credentials are not present in this repo.

## Config

Real config values were not provided in chat, so only placeholders are included.
Use `config.example.properties` as the reference and store real values in local Gradle properties or CI secrets later:

```properties
FITMEAL_SUPABASE_URL=...
FITMEAL_SUPABASE_ANON_KEY=...
FITMEAL_API_BASE_URL=...
FITMEAL_GOOGLE_ANDROID_CLIENT_ID=...
FITMEAL_GOOGLE_WEB_CLIENT_ID=...
```

## Recommended next Android phase

Continue with **A2 Core Screens** and integration wiring after iOS Phase 5 QA:

1. Port full onboarding goal/workout/meal screens.
2. Port complete dashboard, meal plan, workout, habit, progress, and settings screens.
3. Add ViewModels and StateFlow state holders.
4. Connect the existing repositories to ViewModels.
5. Add Google Credential Manager and Play Billing once IDs/products are ready.