# FitMeal AI Android Plan

## Recommended timing

Do Android after **Phase 5 iOS Preview + QA**. The iOS app now has real auth, API, and navigation contracts, but Android should not start until Xcode/simulator QA confirms the shared product flow is stable.

## Android architecture

- **UI:** Kotlin + Jetpack Compose + Material 3, matching the FitMeal dark glass visual language.
- **Navigation:** Compose Navigation with the same flow as iOS: splash → login → onboarding → main tabs.
- **State:** ViewModels + Kotlin Coroutines/StateFlow.
- **Networking:** Ktor or Retrofit for Supabase REST and `/api/ai/meal-plan`.
- **Secure storage:** EncryptedSharedPreferences or Jetpack Security for Supabase sessions.
- **Auth:** Supabase email/password first, then Google One Tap / Credential Manager, then optional Apple equivalent not needed on Android.

## Reuse from iOS

- Domain models: user profile, goals, meal prefs, workout prefs, meal plans, habits, subscriptions.
- API contracts: Supabase tables and `admin-web` AI endpoint.
- App flow: Root router, onboarding persistence, plan regeneration, paywall/payment states.

## Android phases

### A1 — Foundation
- Create Android project shell.
- Port theme tokens, typography, glass cards, bottom navigation.
- Port domain models and mock data.

### A2 — Core screens
- Login, onboarding goal/workout/meal, home dashboard, meals, workout, habits, progress, settings.

### A3 — Integrations
- Supabase auth/session storage.
- AI meal generation endpoint.
- Google Sign-In via Credential Manager.

### A4 — Payments
- Google Play Billing for subscriptions.
- ABA manual payment request flow matching iOS/admin records.

### A5 — QA
- Pixel 8/9 emulator layout pass.
- Offline/error states.
- Auth/session regression tests.

## Best next step before Android

Finish **Phase 5 iOS QA** first, then start Android A1 once the API and screen flow are proven on iOS.