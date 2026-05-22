# FitMeal AI PRD / Handoff

## Original problem statement
User asked to review the connected GitHub repo, identify admin password setup, implement Phase 4c + Phase 4d together, finish GoogleSignIn setup placeholders/native token flow, add iOS Info.plist config path, expand AI meal responses with full ingredients/macros, add admin regenerate-user-plan tooling, and review the next phase plus Android plan.

## Architecture decisions
- iOS uses a state-driven RootView/AppState flow: splash -> login -> onboarding -> MainTabView.
- iOS runtime config is read from Info.plist keys: FITMEAL_SUPABASE_URL, FITMEAL_SUPABASE_ANON_KEY, FITMEAL_API_BASE_URL, and FITMEAL_GOOGLE_* keys. Real values are not committed.
- iOS AuthService uses Supabase Auth REST with anon key only and stores sessions in Keychain.
- Native Google Sign-In is conditionally compiled via canImport(GoogleSignIn); once the package and client IDs are added in Xcode, the Google button opens native sign-in, extracts the ID token, and sends it to Supabase Auth.
- Next.js /api/ai/meal-plan requires Supabase Bearer JWT and verifies request user_id matches the authenticated user.
- AI meal-plan responses return full meal details: meal_type, description, macros, ingredients, recipe_steps, image_url.
- Admin Settings includes an iOS runtime config helper with Supabase/API/Google placeholders.
- Admin dashboard and user detail pages include a regenerate-user-plan support action.

## Implemented
- Phase 4c: AuthService, AIService, login wiring, Apple Sign In wiring, native Google ID-token flow bridge, onboarding preference persistence, home live profile/tier fetch, meal-plan regeneration call.
- Phase 4d: Root router, MainTabView with Home/Meals/Workout/Habits/Progress/Settings, paywall modal, ABA -> payment pending flow, settings sub-screens.
- Follow-up: expanded AI response contract and iOS decoder for macros/ingredients.
- Follow-up: added Google config/docs and conditional native GoogleSignIn bridge.
- Follow-up: added dashboard regenerate-by-user-ID tool and user detail Regenerate plan action.
- Follow-up: added ANDROID_PLAN.md with a Jetpack Compose roadmap after Phase 5 iOS QA.
- Middleware fixed so mobile AI API route is not redirected to /login; route-level JWT auth handles it.

## Verification
- admin-web ESLint: pass.
- admin-web typecheck: pass.
- Regression tests with NEXT_PUBLIC_APP_URL=http://localhost:3000: 9/9 pass.
- Browser self-test from prior follow-up: login hydrates, dashboard regenerate tool visible, Settings mobile config helper visible.
- Testing agent static review: Google native token flow wiring is correct; no real Google secrets committed.
- Swift text scan for brace balance: pass. Full iOS compile and Google runtime callback validation require Mac/Xcode, GoogleSignIn-iOS package, and real client IDs.

## Known mocked/scaffolded flows
- Google Sign-In runtime execution remains MOCKED/BLOCKED until real Google client IDs and the GoogleSignIn-iOS package are added in Xcode. Code path is implemented conditionally.
- Real iOS Info.plist values were not inserted because actual values were not provided in chat; placeholders and admin helper are ready.
- Existing StoreKit purchase and ABA receipt upload remain MOCKED/stub flows.

## Next phase review
### Recommended next phase: Phase 5 iOS Preview + QA
Phase 4e animation polish is mostly already covered by existing button/habit/loading/paywall animations. Before Android, the highest-value next step is Phase 5 QA: Xcode build, iPhone simulator pass, layout fixes, auth callback validation, and real Supabase/OpenAI smoke.

### Android plan
Android should start after Phase 5 iOS QA. See /app/ANDROID_PLAN.md. Recommended stack: Kotlin + Jetpack Compose + Material 3, Compose Navigation, ViewModels/StateFlow, secure session storage, Supabase Auth/REST, AI endpoint reuse, Google Credential Manager, then Google Play Billing and ABA parity.

## Prioritized backlog
### P0
- Add GoogleSignIn-iOS package and real Google client IDs/URL scheme in Xcode, then run simulator callback validation.
- Paste real Supabase/API values into Xcode Info.plist using the admin Settings helper.
- Run Phase 5 iOS QA in Xcode/iPhone simulator.

### P1
- Persist ABA payment requests and receipt uploads from iOS to Supabase Storage/payment_requests.
- Add server-side ingredient/allergy validation and macro tolerance checks.
- Add tests around admin regenerate action with seeded Supabase data.

### P2
- Complete any remaining Phase 4e animation polish.
- Start Android A1 foundation after iOS QA stabilizes.
- Add a richer admin user detail AI history panel.
