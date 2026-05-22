# FitMeal AI PRD / Handoff

## Original problem statement
User asked to review the connected GitHub repo, identify admin password setup, implement Phase 4c + Phase 4d together, finish GoogleSignIn setup/native token flow placeholders, add iOS Info.plist config path, expand AI meal responses with full ingredients/macros, add admin regenerate-user-plan tooling, review Android, and start Android A1 foundation.

## Architecture decisions
- iOS uses a state-driven RootView/AppState flow: splash -> login -> onboarding -> MainTabView.
- iOS runtime config is read from Info.plist keys: FITMEAL_SUPABASE_URL, FITMEAL_SUPABASE_ANON_KEY, FITMEAL_API_BASE_URL, and FITMEAL_GOOGLE_* keys. Real values are not committed because they were not provided.
- iOS AuthService uses Supabase Auth REST with anon key only and stores sessions in Keychain.
- Native Google Sign-In is conditionally compiled via canImport(GoogleSignIn); once the package and client IDs are added in Xcode, the Google button opens native sign-in, extracts the ID token, and sends it to Supabase Auth.
- Next.js /api/ai/meal-plan requires Supabase Bearer JWT and verifies request user_id matches the authenticated user.
- AI meal-plan responses return full meal details: meal_type, description, macros, ingredients, recipe_steps, image_url.
- Android A1 uses a separate Kotlin + Jetpack Compose project under /app/android with mock data and no live integrations yet.

## Implemented
- Phase 4c: AuthService, AIService, login wiring, Apple Sign In wiring, native Google ID-token bridge, onboarding preference persistence, home live profile/tier fetch, meal-plan regeneration call.
- Phase 4d: Root router, MainTabView with Home/Meals/Workout/Habits/Progress/Settings, paywall modal, ABA -> payment pending flow, settings sub-screens.
- Follow-ups: expanded AI response contract and iOS decoder for macros/ingredients; added admin dashboard/user detail regenerate tool; added Settings iOS config helper.
- Google: setup docs, config placeholders, conditional native bridge; real package/client IDs still pending.
- Android A1: Gradle/Compose shell, theme tokens, glass components, domain models, mock data, splash/login/onboarding/home shell, bottom navigation foundation, docs/config example.

## Verification
- admin-web ESLint: pass.
- admin-web typecheck: pass.
- Regression tests with NEXT_PUBLIC_APP_URL=http://localhost:3000: 9/9 pass.
- Browser self-test from prior follow-up: login hydrates, dashboard regenerate tool visible, Settings mobile config helper visible.
- Testing agent static review: Android A1 foundation present; iOS secrets not falsely committed; Google remains setup-only by design.
- Swift/Kotlin text scan for brace balance: pass.
- Android CLI build could not run because Gradle is not installed and wrapper jar is not present.

## Known mocked/scaffolded flows
- iOS real Info.plist values are placeholders because actual Supabase/API values were not provided.
- Google Sign-In runtime execution remains MOCKED/BLOCKED until real Google client IDs, URL scheme, and GoogleSignIn-iOS package are added in Xcode.
- Android A1 is MOCKED: no Supabase, AI, Google, billing, or ABA runtime integrations yet.
- Existing StoreKit purchase and ABA receipt upload remain MOCKED/stub flows.

## Next phase review
### Recommended iOS next phase
Phase 5 iOS Preview + QA: Xcode build, iPhone simulator pass, layout fixes, auth callback validation, and real Supabase/OpenAI smoke.

### Recommended Android next phase
Android A2 Core Screens: port full onboarding goal/workout/meal, dashboard, meal plan, workout, habits, progress, settings, plus ViewModels/StateFlow. Keep A3 integrations after iOS QA and Android A2 screens are stable.

## Prioritized backlog
### P0
- Provide real iOS Supabase/API values and paste into Xcode Info.plist.
- Add GoogleSignIn-iOS package and real Google client IDs/URL scheme in Xcode, then run simulator callback validation.
- Run Phase 5 iOS QA in Xcode/iPhone simulator.

### P1
- Android A2 Core Screens.
- Add Android Gradle wrapper files if CLI build verification is required.
- Persist ABA payment requests and receipt uploads from iOS to Supabase Storage/payment_requests.

### P2
- Android A3 integrations: Supabase Auth, AI endpoint, Google Credential Manager.
- Add server-side ingredient/allergy validation and macro tolerance checks.
- Add richer admin user detail AI history panel.
