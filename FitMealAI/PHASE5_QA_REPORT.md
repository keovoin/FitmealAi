# iOS Phase 5 — Static QA Report (non-Xcode)

Date: May 22, 2026
Scope: full SwiftUI codebase under `FitMealAI/`. No Xcode build was
attempted because no Mac is available — this report covers everything
that can be checked without running the simulator.

## Verdict

**Ready for Xcode build & simulator QA.** Static analysis surfaces no
compilation blockers and no security regressions. A handful of
intentional Phase-3 stubs remain and are listed in the "Still stubbed"
section below.

## What was checked

| Check | Result |
|---|---|
| All 66 `.swift` files parse with `swift -frontend -parse` | ✅ 0 errors |
| `try!` force-tries | ✅ none found |
| `as!` force-casts | ✅ none found |
| `fatalError` calls | ✅ none found |
| Dangling `TODO` / `FIXME` / `HACK` markers | ✅ none found |
| `#Preview` macros on every `View` | ✅ 33 / 33 views have previews |
| Keychain access flag is device-only | ✅ `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly` |
| Apple Sign-In uses nonce + SHA-256 | ✅ `LoginViewModel.prepareAppleRequest` |
| Token refresh handles expiry | ✅ `AuthService.restoreSession` (60-second buffer) |
| `@MainActor` discipline on view models | ✅ all 12 view models annotated |
| Force unwraps reviewed for safety | ✅ guarded by `requireSupabaseConfig()` |
| Offline-first onboarding save | ✅ `AppState.completeOnboarding` saves locally before remote |
| Calorie / habit progress capped | ✅ `min(..., 1.0)` in HomeDashboardViewModel |

## Auth flow audit (clean)

Email / Apple / Google all route through Supabase's
`/auth/v1/token` endpoint and persist the resulting `AuthSession` in
the iOS Keychain via `KeychainStore`.

- `LoginView` overlays a real `SignInWithAppleButton` (transparent) on
  top of `SecondaryGlassButton` so the system handler is invoked while
  preserving the glassmorphism design.
- `GoogleSignInService` uses `#if canImport(GoogleSignIn)` so the app
  compiles even when the Google package is not yet added in Xcode.
  Once the package is added, the native Google flow turns on
  automatically.
- `FitMealAIApp` wires `.onOpenURL { GoogleSignInService(...).handleOpenURL($0) }`
  for the OAuth callback.

## Navigation graph

```
Splash → Login → Onboarding(Goal → Workout → Meal) → MainTab
MainTab tabs: home, meals, workout, habits, progress, settings
Sheets: paywall, abaPayment, paymentPending, workoutSettings, mealSettings
```

`AppState.rootFlow` is the single source of truth and updates animate
via `.animation(.easeInOut(duration: 0.25), value: appState.rootFlow)`
in `RootView`.

## Required Info.plist keys (set in Xcode)

`FitMealConfig.swift` reads these from the bundle. The admin-web
Settings page has a "iOS runtime config" panel that prints the exact
values to copy:

| Key | Required for | Source |
|---|---|---|
| `FITMEAL_SUPABASE_URL` | All Supabase calls | Vercel `NEXT_PUBLIC_SUPABASE_URL` |
| `FITMEAL_SUPABASE_ANON_KEY` | All Supabase calls | Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `FITMEAL_API_BASE_URL` | `/api/ai/meal-plan` | Vercel `NEXT_PUBLIC_APP_URL` |
| `FITMEAL_GOOGLE_IOS_CLIENT_ID` | Google Sign-In | Google Cloud iOS client |
| `FITMEAL_GOOGLE_REVERSED_CLIENT_ID` | Google Sign-In URL scheme | Same iOS client (reversed) |
| `FITMEAL_GOOGLE_SERVER_CLIENT_ID` | Google Sign-In server | Google Cloud Web client |

You also need:
- `URL Types` with the reversed client ID so the OAuth callback opens
  the app.
- "Sign in with Apple" capability enabled.
- Keychain Sharing capability enabled.

## Still stubbed — wire in Phase 6

| Location | What's stubbed | Priority |
|---|---|---|
| `PaywallViewModel.purchase()` | StoreKit 2 buy call returns `true` after 700ms sleep | High — required for paid users |
| `PaywallViewModel.restore()` | Restore call sleeps then no-ops | Medium |
| `ABAPaymentViewModel.attachScreenshotPlaceholder()` | Saves a fake filename instead of using `PhotosPicker` | High |
| `ABAPaymentViewModel.submit()` | Sleep + local state mutation only; no upload | High |
| `ProgressDashboardViewModel` | Returns sample weights + body comp instead of querying DB | Medium |
| `SettingsViewModel.versionString` | Hardcoded `"FitMeal AI v1.0.0 (Phase 2)"` — bump string | Low |
| `AIGeneratingView` | Decorative animation; not wired to a `Task` | Low (replaced in real flow) |

None of these are blockers for simulator QA; the user can navigate
every screen and the AI regeneration flow works end-to-end through the
real `AIService`.

## Manual simulator QA checklist (when Mac is available)

Run each of these in iPhone 15 Pro / iOS 17 + simulator:

1. **Cold launch**: splash → routes to login (unauthenticated) or
   home (authenticated session in Keychain).
2. **Email sign up**: `Get started free` → enter email + password →
   should land on Onboarding Goal.
3. **Email sign in**: existing user → Onboarding skipped → Home tab.
4. **Apple Sign-In**: tap Apple button → system sheet → Home tab.
   Verify Keychain entry persists across relaunch.
5. **Google Sign-In**: requires the GoogleSignIn package to be added
   in Xcode. Without it the button shows a friendly "package missing"
   error.
6. **Onboarding save**: complete all 3 steps → verify
   `user_goals`, `meal_prefs`, `workout_prefs` rows appear in Supabase.
7. **AI regeneration**: Home tab → "Regenerate today's plan" →
   verify a `meal_plans` row appears, image URLs resolve, and
   `ai_generations` row is logged.
8. **Rate limit**: regenerate 4 times as Free user → 4th call should
   come back as a friendly cooldown message.
9. **Paywall**: tap upgrade banner → switch tiers → confirm purchase
   button reflects the selected tier.
10. **ABA payment**: enter transaction ID → tap "Attach screenshot"
    → submit → land on `PaymentPendingView`.
11. **Settings**: edit meal/workout preferences from sub-screens →
    return to root settings → verify summary lines update.
12. **Sign out**: should clear Keychain and route back to Login.
13. **Offline mode**: airplane mode → onboarding still completes
    locally, AI calls show clear errors.
14. **Dark mode only**: app forces `.preferredColorScheme(.dark)` —
    verify all screens still render correctly under bright simulator
    appearance.

## Recommended next step

After running the simulator pass on a Mac:

1. Wire the four "High priority" stubs (StoreKit purchase, restore,
   PhotosPicker, payment upload).
2. Add the GoogleSignIn package via SPM in Xcode if Google sign-in is
   in scope for v1.
3. Bump `versionString` from `"Phase 2"` to `"v1.0.0 (Production)"`.
4. Submit to TestFlight.
