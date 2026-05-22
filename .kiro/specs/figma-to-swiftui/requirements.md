# Requirements: Figma to SwiftUI UI

## Goal
Convert the approved Figma wireframes into a working SwiftUI iOS app with glassmorphism UI and previewable screens.

## Requirements

### R1: App Shell
The app shall have a RootView that controls onboarding completion and main tab navigation.

Acceptance criteria:
- App launches to Splash first
- New user sees Login, then Onboarding
- Returning user sees dashboard
- Main app uses bottom tab navigation

### R2: Glass Design System
The app shall include reusable glass UI components.

Acceptance criteria:
- GlassCard component exists
- PrimaryButton component exists (with loading + success state)
- SecondaryGlassButton component exists
- App background gradient exists
- MultiSelectGrid component exists for diet/workout pickers
- SegmentedPicker component exists for cook time / days / duration
- OnboardingStepIndicator component exists
- Components match Figma glass style

### R3: Login
The Login screen shall let users authenticate via email, phone OTP, Google, or Apple.

Acceptance criteria:
- Email mode shows email + password fields with show/hide toggle and "Forgot password?" link
- Phone mode shows phone field and "Send OTP" button
- Mode toggle is a segmented control
- "Continue with Google" and "Continue with Apple" social buttons are visible
- "Get started free" link routes new users to onboarding
- Loading state on primary button
- Background uses two soft glow circles (purple + blue)

### R4: Onboarding Goal
The onboarding goal screen shall let users select a single fitness goal.

Acceptance criteria:
- Step indicator shows step 1 of 3
- Goals: Lose weight, Build muscle, Stay fit, Eat healthier
- Continue routes to Onboarding Workout

### R5: Onboarding Workout (multi-select)
The onboarding workout screen shall let users pick multiple workout types and choose days per week and session duration.

Acceptance criteria:
- Step indicator shows step 2 of 3
- 10 workout types selectable in 2-column grid: Strength, Cardio, HIIT, Yoga, Pilates, Cycling, Running, Swimming, Boxing, Stretching
- Multi-select with at least 1 selection enforced
- Days per week segmented picker: 2/3/4/5/6 days
- Duration chip picker: 20/30/45/60/90 min
- Selection summary footer ("N workout types selected")
- Continue saves to PreferencesStore and routes to Onboarding Meal

### R6: Onboarding Meal (multi-select)
The onboarding meal screen shall let users pick multiple diet styles, meal timings, max cook time, and allergies.

Acceptance criteria:
- Step indicator shows step 3 of 3
- 8 diet styles in 2-column card grid: Balanced, High Protein, Low Carb, Keto, Vegan, Vegetarian, Mediterranean, Paleo - each with icon + description
- Diet multi-select with at least 1 enforced
- 6 meal timings in vertical list with green active state: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Evening Snack - each with time range
- Cook time segmented: < 15 min, 30 min, 45 min, 1 hr+
- Allergy chips (toggle, optional): Peanuts, Tree Nuts, Gluten, Dairy, Eggs, Shellfish, Soy, Fish
- Active allergy chip uses red background
- Continue saves to PreferencesStore and routes to AIGenerating

### R7: Dashboard
The dashboard shall show today's meal, workout, habits, and AI regenerate button.

Acceptance criteria:
- Shows greeting
- Shows calories card
- Shows meal summary card
- Shows workout card
- Shows habit summary card
- Shows upgrade banner for Free user

### R8: Meal Plan
The meal screen shall show breakfast, lunch, dinner, and nutrition summary, plus an ingredient breakdown modal.

Acceptance criteria:
- Today/Tomorrow/Weekly tabs exist
- Each meal has Replace button
- Tapping a meal opens an IngredientModal bottom sheet
- Modal shows macro bars (protein/carbs/fat) and rainbow calorie breakdown by ingredient
- Modal handles divide-by-zero when totalKcal is 0
- Weekly tab shows locked state for Free user

### R9: Workout
The workout screen shall show exercise list, timer placeholder, and completion states.

Acceptance criteria:
- Exercises display sets/reps
- User can mark exercise completed
- Progress updates visually

### R10: Habits
The habits screen shall allow daily habit completion.

Acceptance criteria:
- Habit rows display
- User can toggle complete
- Completed habit animates

### R11: Progress (with period switching)
The progress screen shall show metrics with period switching and Gold-locked analytics.

Acceptance criteria:
- Period segmented control: Week / Month / 3 Months
- Weight trend line chart with start/current/delta stats
- Average calories card
- Completion rate card
- Gold-locked advanced analytics card with half-visible lock icon

### R12: Paywall
The paywall shall show Free, Silver, and Gold plans.

Acceptance criteria:
- Gold is highlighted
- StoreKit button exists
- Restore purchase button exists
- ABA manual payment link exists

### R13: ABA Payment
The ABA payment screen shall show QR placeholder, merchant ID, transaction input, screenshot upload placeholder, and submit button.

Acceptance criteria:
- Status can become pending
- Pending confirmation screen exists

### R14: Settings
The settings screen shall reflect saved preferences and link to sub-settings.

Acceptance criteria:
- Reflects live preferences ("2 types . 4 days", "3 meal slots . 1 diet")
- Link to Settings Workout
- Link to Settings Meal
- Current Plan row with Upgrade highlight for Free users
- Sign Out row

### R15: Settings Workout / Settings Meal
The settings sub-screens shall reuse onboarding pickers and persist changes.

Acceptance criteria:
- Same multi-select behavior as onboarding
- Save Changes button shows transient "Saved!" state for 2 seconds
- Back button returns to Settings

### R16: Preview
Every screen shall have SwiftUI preview support.

Acceptance criteria:
- #Preview exists for every major screen
- Mock data exists
- App builds successfully in Xcode
