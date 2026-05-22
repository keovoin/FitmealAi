# FitMeal AI PRD / Handoff

## Original problem statement
User asked to review the connected GitHub repo, identify admin password setup, implement Phase 4c + Phase 4d together, then finish GoogleSignIn setup placeholders, add iOS Info.plist config path, expand AI meal responses with full ingredients/macros, and add admin regenerate-user-plan tooling.

## Architecture decisions
- iOS uses a state-driven RootView/AppState flow: splash -> login -> onboarding -> MainTabView.
- iOS runtime config is read from Info.plist keys: FITMEAL_SUPABASE_URL, FITMEAL_SUPABASE_ANON_KEY, FITMEAL_API_BASE_URL, and FITMEAL_GOOGLE_* placeholder keys. Real values are not committed.
- iOS AuthService uses Supabase Auth REST with anon key only and stores sessions in Keychain.
- Next.js /api/ai/meal-plan requires Supabase Bearer JWT and verifies request user_id matches the authenticated user.
- AI meal-plan responses now return full meal details: meal_type, description, macros, ingredients, recipe_steps, image_url.
- Admin Settings includes an iOS runtime config helper with Supabase/API/Google placeholders.
- Admin dashboard and user detail pages include a regenerate-user-plan support action.

## Implemented
- Phase 4c: AuthService, AIService, login wiring, Apple Sign In wiring, Google ID-token placeholder hook, onboarding preference persistence, home live profile/tier fetch, meal-plan regeneration call.
- Phase 4d: Root router, MainTabView with Home/Meals/Workout/Habits/Progress/Settings, paywall modal, ABA -> payment pending flow, settings sub-screens.
- Follow-up: expanded AI response contract and iOS decoder for macros/ingredients.
- Follow-up: added Google placeholder config/docs and admin mobile-config helper fields.
- Follow-up: added dashboard regenerate-by-user-ID tool and user detail Regenerate plan action.
- Middleware fixed so mobile AI API route is not redirected to /login; route-level JWT auth handles it.

## Verification
- admin-web ESLint: pass.
- admin-web typecheck: pass.
- admin-web production build: pass.
- Regression tests: 9/9 pass across auth/config and Phase 4 follow-up contracts.
- Browser self-test: login page hydrates with no main-app.js failures; authenticated dashboard regenerate tool visible; Settings mobile config helper visible.
- Swift text scan for brace balance: pass. Full iOS compile still requires Mac/Xcode.

## Known mocked/scaffolded flows
- Google Sign-In is scaffolded only until real Google credentials and GoogleSignIn iOS package are added.
- Real iOS Info.plist values were not inserted because actual values were not provided in chat; placeholders and admin helper are ready.
- Existing StoreKit purchase and ABA receipt upload remain MOCKED/stub flows.

## Prioritized backlog
### P0
- Paste real Supabase/API values into Xcode Info.plist using the admin Settings helper.
- Add GoogleSignIn iOS package/client IDs, then replace GoogleSignInService.fetchGoogleIDToken() placeholder with native token flow.
- Validate complete iOS build in Xcode and simulator.

### P1
- Persist ABA payment requests and receipt uploads from iOS to Supabase Storage/payment_requests.
- Add server-side ingredient/allergy validation and macro tolerance checks.
- Add tests around admin regenerate action with seeded Supabase data.

### P2
- Add animation polish (Phase 4e), deeper QA, and automated iOS tests.
- Add a richer admin user detail AI history panel.
