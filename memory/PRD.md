# FitMeal AI PRD / Handoff

## Original problem statement
User asked to review the connected GitHub repo, identify admin password setup, then implement Phase 4c + Phase 4d together. User also requested iOS placeholder config and an admin portal helper for replacing Supabase/API values, with email/password + Apple + Google scaffolding.

## Architecture decisions
- iOS now uses a state-driven RootView/AppState flow: splash -> login -> onboarding -> MainTabView.
- iOS runtime config is read from Info.plist keys: FITMEAL_SUPABASE_URL, FITMEAL_SUPABASE_ANON_KEY, FITMEAL_API_BASE_URL. Real values are not committed.
- iOS AuthService uses Supabase Auth REST with anon key only and stores sessions in Keychain.
- Next.js /api/ai/meal-plan requires Supabase Bearer JWT and verifies the request user_id matches the authenticated user.
- Admin Settings includes an iOS runtime config helper that generates Xcode/Info.plist snippets.

## Implemented
- Phase 4c: AuthService, AIService, login wiring, Apple Sign In wiring, Google ID-token hook, onboarding preference persistence, home live profile/tier fetch, meal-plan regeneration call.
- Phase 4d: Root router, MainTabView with Home/Meals/Workout/Habits/Progress/Settings, paywall modal, ABA -> payment pending flow, settings sub-screens.
- Middleware fixed so mobile AI API route is not redirected to /login; route-level JWT auth now handles it.
- Docs updated: README roadmap, iOS config docs, task checklist, test credentials note.

## Verification
- admin-web ESLint: pass.
- admin-web typecheck: pass.
- admin-web build: pass.
- Regression tests: /app/backend/tests/test_admin_web_phase4_auth_and_config.py pass (3/3).
- Swift text scan for brace balance: pass. Full Xcode compile requires Mac/Xcode.

## Known mocked/scaffolded flows
- Google native sign-in is scaffolding only until GoogleSignIn iOS package/client ID are added in Xcode.
- Existing StoreKit purchase and ABA receipt upload remain MOCKED/stub flows.

## Prioritized backlog
### P0
- Add real iOS Info.plist values in Xcode from the admin Settings helper.
- Add GoogleSignIn iOS package/client IDs and call AuthService.signInWithIDToken(provider: .google, idToken:).
- Validate complete iOS build in Xcode and simulator.

### P1
- Expand AI endpoint response to return full ingredients/macros so iOS can display generated details instead of lightweight summaries.
- Persist ABA payment requests and receipt uploads from iOS to Supabase Storage/payment_requests.
- Add server-side ingredient/allergy validation and macro tolerance checks.

### P2
- Add animation polish (Phase 4e), deeper QA, and automated iOS tests.
- Build admin regenerate-user-plan tool.
