# Tasks: Figma to SwiftUI

## Phase 1: Foundation
- [x] Create app folder structure
- [x] Create AppTheme
- [x] Create GlassBackground
- [x] Create GlassCard
- [x] Create PrimaryButton (with loading + success state)
- [x] Create SecondaryGlassButton
- [x] Create OnboardingStepIndicator
- [x] Create MultiSelectGrid
- [x] Create SegmentedPicker
- [x] Add data models (UserGoal, MealPlan, MealPrefs, WorkoutPlan, WorkoutPrefs, Habit, SubscriptionPlan, PaymentRequest, AuthCredentials)
- [x] Add PreferencesStore (UserDefaults-backed, mirrors React preferences.ts)
- [x] Add MockData

## Phase 2: Screens
- [x] Add shared primitives (TopBar, BottomNav, ShimmerSkeleton, Tag, ScreenContainer)
- [x] Build SplashView
- [x] Build LoginView (+ ViewModel)
- [x] Build OnboardingGoalView (+ ViewModel)
- [x] Build OnboardingWorkoutView (+ ViewModel, multi-select)
- [x] Build OnboardingMealView (+ ViewModel, multi-select + allergies)
- [x] Build HomeDashboardView (+ ViewModel)
- [x] Build AIGeneratingView
- [x] Build MealPlanView (+ ViewModel, with IngredientModal)
- [x] Build WorkoutView (+ ViewModel)
- [x] Build HabitsView (+ ViewModel)
- [x] Build ProgressDashboardView (+ ViewModel, with period switching)
- [x] Build PaywallView (+ ViewModel)
- [x] Build ABAPaymentView (+ ViewModel)
- [x] Build PaymentPendingView
- [x] Build SettingsView (+ ViewModel)
- [x] Build SettingsMealView (+ ViewModel)
- [x] Build SettingsWorkoutView (+ ViewModel)
- [x] Update RootView with Phase-2 dev screen index

## Phase 3a: Admin CMS scaffold (web)
- [x] Next.js 15 + Tailwind + cookie auth + sidebar shell
- [x] Dashboard, Payments queue, Users, Subscriptions, Settings (mock data)

## Phase 4a: Database + admin wiring (Supabase)
- [x] SQL migrations (extensions, profiles, prefs, meals, plans, habits, subs, payments, ai_generations, RLS, storage)
- [x] `check_ai_rate_limit()` enforcing free 3+1/30min/20/day, silver 50/day, gold 100/day
- [x] `upsert_meal_by_slug()` for the shared meal-image cache
- [x] DB trigger `on_payment_approved`: bumps profile.tier and creates active subscription
- [x] Server-only Supabase admin client + admin-queries module
- [x] Replace MOCK_* on Dashboard, Payments, Users, Subscriptions with real queries
- [x] Server Actions: reviewPayment, setUserStatus, compGold
- [x] Graceful "Supabase not configured" empty state
- [x] Steering file at `.kiro/steering/supabase.md`

## Phase 4b: AI meal generation + image cache
- [x] `/api/ai/meal-plan` Vercel Function calling check_ai_rate_limit before each request
- [x] OpenAI structured-output prompt for meal title, recipe, ingredients, macros
- [x] Slug-based cache check in `meals` table; reuse if exists
- [x] On miss, generate image with OpenAI Images API, upload to `meal-images` bucket, save URL
- [x] Log every call to `ai_generations` (real or cached)
- [x] Global daily USD ceiling (`OPENAI_DAILY_BUDGET_USD`) as second line of defense
- [x] Zod-validated input + output schemas (`lib/ai/types.ts`)
- [x] Settings page surfaces "OpenAI Connected" / "Not configured"
- [ ] Admin "regenerate user's plan" tool (deferred to Phase 4c when we have user records)

## Phase 4c: iOS auth + AI integration
- [x] AuthService.swift with Supabase Auth (email + Apple + Google ID-token hook)
- [x] AIService.swift calling /api/ai/meal-plan with Supabase JWT
- [x] Connect LoginView, OnboardingMealView -> persist to Supabase
- [x] Connect HomeDashboardView -> live profile/tier data from Supabase
- [x] Connect MealPlanView regenerate button to AIService

## Phase 4d: iOS navigation
- [x] Build real RootView router (replaces dev index)
- [x] Build MainTabView using BottomNav
- [x] Connect splash -> login -> onboarding flow
- [x] Connect dashboard -> meals/workout/habits/progress/settings tabs
- [x] Connect paywall modal (from Home upgrade banner + Settings plan row)
- [x] Connect ABA payment flow (Paywall -> ABAPayment -> PaymentPending)
- [x] Connect Settings sub-screens (Meal / Workout)

## Phase 4e: Animation polish
- [ ] Add card entrance animations
- [ ] Add button press animations (already implemented via PressableScaleStyle)
- [ ] Add habit check animation (already implemented)
- [ ] Add AI loading skeleton (already implemented in AIGeneratingView)
- [ ] Add Gold plan glow (already implemented in PaywallView)

## Phase 5: Preview and QA
- [ ] Verify #Preview on every view (done as part of Phase 2)
- [ ] Build in Xcode (requires Mac access)
- [ ] Run iPhone 15 Pro simulator
- [ ] Fix layout issues
- [ ] Commit changes
