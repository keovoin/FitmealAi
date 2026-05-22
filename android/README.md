# FitMeal AI Android

Phase A4 Android client mirroring the iOS feature set.

## What is included

- **A1** Project shell (Kotlin + Compose + Material 3 + Gradle wrapper).
- **A2** Full SwiftUI -> Compose port of every screen:
  - Splash, Login (email + Google), 3-step onboarding (Goal / Workout / Meal).
  - Bottom-nav main shell with Home, Meals, Workout, Habits, Progress, Settings tabs.
  - Modal sheets: Paywall, ABA Payment, Payment Pending, Workout Settings, Meal Settings.
  - Premium emerald glassmorphism theme matching iOS Phase 4e.
- **A3** Production integrations:
  - **Encrypted session storage** via `EncryptedSharedPreferences` (`SessionStore.kt`).
  - **Google Sign-In via Credential Manager** (`GoogleSignInHelper.kt`) with nonce + ID-token forwarding to Supabase's `grant_type=id_token` endpoint.
  - Token refresh on cold start (`AppState.bootstrap()`).
  - StateFlow-driven app state with `RootFlow`, `MainTab`, `AppSheet` enums.
  - `PreferencesStore` (plain prefs) for meal/workout choices.
- **A4** Payments:
  - **Google Play Billing** scaffold (`BillingHelper.kt`) for `fitmeal_silver_monthly` and `fitmeal_gold_monthly` SKUs.
  - **ABA manual payment** flow with QR placeholder, merchant info, transaction-ID input, screenshot stub, and direct write to Supabase `payment_requests`.

## Architecture

```
app/src/main/java/com/fitmealai
├── MainActivity.kt
├── config/
│   └── AppConfig.kt              BuildConfig-backed env values
├── domain/
│   └── Models.kt                 enums + data classes (mirrors iOS Core/Models)
├── data/
│   ├── Services.kt               AuthRepository / AIRepository / PaymentRepository
│   ├── SessionStore.kt           AES-256 GCM session persistence
│   ├── PreferencesStore.kt       meal/workout pref persistence
│   ├── GoogleSignInHelper.kt     Credential Manager bridge
│   ├── BillingHelper.kt          Play Billing scaffold
│   └── MockData.kt               default plan/meals/habits
└── ui/
    ├── AppState.kt               top-level StateFlow holder + auth/onboarding logic
    ├── FitMealAndroidApp.kt      router (Splash/Login/Onboarding/Main)
    ├── MainShell.kt              bottom-nav + sheet host
    ├── theme/
    │   └── FitMealTheme.kt       FitMealColors + FitMealBrushes + spacing/radius
    ├── components/
    │   └── FitMealComponents.kt  GlassCard, PrimaryGradientButton, SegmentedPicker,
    │                             MultiSelectGrid, OnboardingStepIndicator, TopBar,
    │                             SecondaryGlassButton, ScreenContainer, TagPill
    └── screens/
        ├── SplashScreen.kt
        ├── LoginScreen.kt
        ├── onboarding/
        │   ├── OnboardingGoalScreen.kt
        │   ├── OnboardingWorkoutScreen.kt
        │   └── OnboardingMealScreen.kt
        ├── home/HomeScreen.kt
        ├── meals/MealPlanScreen.kt
        ├── workout/WorkoutScreen.kt
        ├── habits/HabitsScreen.kt
        ├── progress/ProgressScreen.kt
        ├── settings/
        │   ├── SettingsScreen.kt
        │   └── SettingsSubScreens.kt
        ├── paywall/PaywallScreen.kt
        └── payment/
            ├── AbaPaymentScreen.kt
            └── PaymentPendingScreen.kt
```

## Config

Real config values are not committed. Use `config.example.properties` and put real values into your local Gradle properties (`~/.gradle/gradle.properties`) or CI secrets.

| Property | Used by | iOS equivalent |
|---|---|---|
| `FITMEAL_SUPABASE_URL` | All Supabase calls | `FITMEAL_SUPABASE_URL` |
| `FITMEAL_SUPABASE_ANON_KEY` | All Supabase calls | `FITMEAL_SUPABASE_ANON_KEY` |
| `FITMEAL_API_BASE_URL` | `/api/ai/meal-plan` | `FITMEAL_API_BASE_URL` |
| `FITMEAL_GOOGLE_ANDROID_CLIENT_ID` | Credential Manager (optional) | n/a |
| `FITMEAL_GOOGLE_WEB_CLIENT_ID` | Required for Credential Manager | `FITMEAL_GOOGLE_SERVER_CLIENT_ID` |

The Google **Web (server) client ID** must match what Supabase Auth is configured to accept for `grant_type=id_token`.

## Required Play Console setup (before A4 SKUs activate)

1. Upload an internal-track build of the app.
2. In **Play Console -> Monetize -> Subscriptions**, create:
   - `fitmeal_silver_monthly` -> $4.99 / month base plan
   - `fitmeal_gold_monthly` -> $9.99 / month base plan
3. The `BillingHelper` queries those product IDs at launch.

## Build verification

Requires JDK 17, Android SDK with API 35, and `ANDROID_HOME` set.

```bash
cd android
./scripts/verify-android-build.sh
```

The wrapper auto-downloads Gradle. The repo does not bundle the
Android SDK, so the build will fail on machines without it.

## Status

| Phase | What it ships | Done |
|---|---|---|
| A1 | Project shell + theme + repos | ✅ |
| A2 | Full screen port + ViewModels | ✅ |
| A3 | EncryptedSession + Credential Manager | ✅ |
| A4 | Play Billing scaffold + ABA payment flow | ✅ |
| A5 | Pixel 8/9 emulator QA | requires Mac/Linux with SDK |
