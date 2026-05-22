# FitMeal AI Android Plan

## Recommended timing

Android A1 has now started. Continue cautiously: the iOS app still needs **Phase 5 Preview + QA**, and Android integrations should wait until Xcode/simulator QA confirms the shared product flow is stable.

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
- [x] Create Android project shell.
- [x] Port theme tokens, glass cards, primary button, bottom navigation foundation.
- [x] Port domain models and mock data.
- [x] Add starter splash → login → onboarding → main shell flow.

### A2 — Core screens
- Login, onboarding goal/workout/meal, home dashboard, meals, workout, habits, progress, settings.

### A3 — Integrations
- [x] Add config-driven Supabase auth REST repository.
- [x] Add config-driven AI meal generation repository.
- [x] Add config-driven ABA payment request repository.
- [ ] Add encrypted session storage.
- [ ] Add Google Sign-In via Credential Manager.
- [ ] Connect repositories to ViewModels and screen state.

### A4 — Payments
- Google Play Billing for subscriptions.
- ABA manual payment request flow matching iOS/admin records.

### A5 — QA
- [x] Add Gradle wrapper tooling and build verification script.
- [ ] Pixel 8/9 emulator layout pass.
- [ ] Offline/error states.
- [ ] Auth/session regression tests.

## Best next step

Finish **Phase 5 iOS QA** in parallel before Android A3 integrations. The next Android coding step is **A2 Core Screens**.