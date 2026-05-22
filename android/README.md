# FitMeal AI Android

Android A1 foundation for the future FitMeal AI Android app.

## What is included

- Kotlin + Jetpack Compose project shell.
- Dark glass theme ported from the iOS `AppTheme` tokens.
- Domain models for profile, meals, ingredients, meal plans, tiers, and goals.
- Mock data matching the iOS preview concept.
- Starter root flow: splash → login → onboarding → main shell.
- Main shell with Home/Meals/Workout/Habits/Progress tabs.

## What is not included yet

- Real Supabase auth/session storage.
- Real AI meal-plan API calls.
- Google Credential Manager sign-in.
- Play Billing / ABA payment parity.

## Config

Real config values were not provided in chat, so only placeholders are included.
Use `config.example.properties` as the reference and store real values in local Gradle properties or CI secrets later.

## Recommended next Android phase

Continue with **A2 Core Screens** after iOS Phase 5 QA:

1. Port full onboarding goal/workout/meal screens.
2. Port complete dashboard, meal plan, workout, habit, progress, and settings screens.
3. Add ViewModels and StateFlow state holders.
4. Then start A3 integrations: Supabase Auth, AI endpoint, Google Credential Manager.