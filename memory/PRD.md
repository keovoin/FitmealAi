# FitMeal AI PRD / Handoff

## Original problem statement
User asked to review the connected repo/admin password, implement Phase 4c + 4d, finish GoogleSignIn setup/native token flow placeholders, add iOS Info.plist config path, expand AI meal responses with full ingredients/macros, add admin regenerate-user-plan tooling, review Android, start Android A1, then continue with full iOS UI/UX/animation/layout polish and Android app foundations including auth, AI, payments, and settings.

## Architecture decisions
- iOS uses a state-driven RootView/AppState flow: splash -> login -> onboarding -> MainTabView.
- iOS runtime config is read from Info.plist keys: FITMEAL_SUPABASE_URL, FITMEAL_SUPABASE_ANON_KEY, FITMEAL_API_BASE_URL, and FITMEAL_GOOGLE_* keys. Real values are not committed because they were not provided.
- iOS AuthService uses Supabase Auth REST with anon key only and stores sessions in Keychain.
- Native iOS Google Sign-In is conditionally compiled via canImport(GoogleSignIn); once package/client IDs are added in Xcode, the Google button opens native sign-in, extracts the ID token, and sends it to Supabase Auth.
- Next.js /api/ai/meal-plan requires Supabase Bearer JWT and verifies request user_id matches authenticated user.
- AI meal-plan responses return meal_type, description, macros, ingredients, recipe_steps, image_url.
- Android uses a Kotlin + Jetpack Compose project under /app/android with config-driven repositories and mock starter content until live sign-in/generation succeeds.

## Implemented
- iOS Phase 4c/4d: auth, AI, onboarding persistence, real navigation, Apple/Google hooks, meal regeneration, settings/paywall/payment flow shell.
- iOS polish: premium emerald/dark-glass theme tokens, glass background/card refinement, shared screen entrance motion, emerald glow utility.
- Admin/backend: secured AI endpoint, expanded AI response contract, admin mobile config helper, dashboard/user regenerate plan actions.
- Android A1/A2 foundation: Gradle/Compose shell, theme/components, domain models, mock data, splash/login/onboarding/main shell, Home/Meals/Workout/Habits/Progress/Settings surfaces.
- Android runtime wiring: BuildConfig/AppConfig for Supabase/API/Google values, AuthRepository Supabase email/password + Google id_token exchange, AIRepository /api/ai/meal-plan call and full response mapping, PaymentRepository payment_requests insert, FitMealViewModel connected to Login/Home actions.
- Docs: ANDROID_PLAN.md, android/README.md, auth_testing.md, config examples, updated roadmap/tasks.

## Verification
- admin-web ESLint: pass.
- admin-web typecheck: pass.
- Backend/admin/Android contract tests with NEXT_PUBLIC_APP_URL=http://localhost:3000: 17/17 pass.
- Swift/Kotlin text scan for brace balance: pass.
- Testing agent verified Android mapping/ViewModel wiring fixes and payment enum alignment.
- Android CLI build not executed because Gradle wrapper/kotlinc are not available in this workspace.

## Known mocked/scaffolded flows
- iOS real Info.plist values are placeholders because actual Supabase/API values were not provided.
- iOS Google runtime remains blocked until real Google client IDs, URL scheme, Xcode project, and GoogleSignIn-iOS package are added.
- Android initial displayed meal content is MOCKED until real sign-in/generate succeeds.
- Android Google Credential Manager runtime is MOCKED/not implemented; repository can exchange an ID token once collected.
- StoreKit and receipt upload remain MOCKED/stub flows.
- Live public endpoint/browser validation is blocked by missing public URL env in this workspace.

## Prioritized backlog
### P0
- Provide real iOS Supabase/API values and paste into Xcode Info.plist.
- Add iOS Xcode project + GoogleSignIn-iOS package/client IDs/URL scheme and run simulator callback validation.
- Add Android Gradle wrapper and run Android Studio/CLI build.

### P1
- Android: add Credential Manager and Play Billing runtime packages, encrypted session storage, and repository-backed ViewModels for every screen.
- iOS: run Phase 5 QA in Xcode/iPhone simulator.
- Persist ABA receipt uploads to Supabase Storage.

### P2
- Add server-side ingredient/allergy validation and macro tolerance checks.
- Add richer admin AI history and payment support panels.
- Add automated iOS/Android UI tests once native projects are available.


## Deployment Health Check — Latest
- Deployment agent status for Emergent/Kubernetes: NOT DEPLOYABLE because this repo is not the standard FastAPI backend + React frontend supervisor model. It is native iOS + native Android + Vercel-targeted Next.js admin + Supabase.
- Admin-web health: ESLint pass, TypeScript pass, Next.js production build pass.
- Backend/admin contract tests: 17/17 pass locally with NEXT_PUBLIC_APP_URL=http://localhost:3000.
- Local build warning: ADMIN_PASSWORD is missing in this workspace; hosted admin must set ADMIN_PASSWORD to allow login.
- Mobile deployment: iOS/Android require native build tooling and real config values; Android CLI build is still blocked by missing Gradle wrapper/tooling in workspace.
