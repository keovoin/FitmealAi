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

## Phase 3a: Admin CMS (web)
- [x] Scaffold Next.js 15 project under `admin-web/`
- [x] Tailwind config mirroring iOS AppTheme tokens
- [x] Single-password auth gate (cookie + middleware)
- [x] Sidebar shell with active state and pending-payment badge
- [x] Dashboard: KPIs, signups chart, plan-mix, pending-payments queue
- [x] Payments: list with status tabs + search, detail with approve/reject
- [x] Users: list with tier+status filters + search, detail with payment history
- [x] Subscriptions: list with MRR rollup
- [x] Settings: status of stub auth + planned features
- [x] Mock data fixtures shaped to match iOS Core/Models
- [x] Steering file at `.kiro/steering/admin-web.md`
- [x] Root README explaining monorepo layout

## Phase 3b: iOS Navigation
- [ ] Build real RootView router (replaces dev index)
- [ ] Build MainTabView using BottomNav
- [ ] Connect splash -> login -> onboarding flow
- [ ] Connect dashboard -> meals/workout/habits/progress tabs
- [ ] Connect paywall modal (from Home upgrade banner + Settings plan row)
- [ ] Connect ABA payment flow (Paywall -> ABAPayment -> PaymentPending)
- [ ] Connect Settings sub-screens (Meal / Workout)
- [ ] Wire AuthService stub
- [ ] Wire AIService stub for plan generation / regeneration

## Phase 4: Animation
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
