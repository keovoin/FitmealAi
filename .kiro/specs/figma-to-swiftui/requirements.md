# Requirements: Figma to SwiftUI UI

## Goal
Convert the approved Figma wireframes into a working SwiftUI iOS app with glassmorphism UI and previewable screens.

## Requirements

### R1: App Shell
The app shall have a RootView that controls onboarding completion and main tab navigation.

Acceptance criteria:
- App launches to Splash first
- New user sees onboarding
- Completed user sees dashboard
- Main app uses bottom tab navigation

### R2: Glass Design System
The app shall include reusable glass UI components.

Acceptance criteria:
- GlassCard component exists
- PrimaryButton component exists
- SecondaryGlassButton component exists
- App background gradient exists
- Components match Figma glass style

### R3: Dashboard
The dashboard shall show today's meal, workout, habits, and AI regenerate button.

Acceptance criteria:
- Shows greeting
- Shows calories card
- Shows meal summary card
- Shows workout card
- Shows habit summary card
- Shows upgrade banner for Free user

### R4: Meal Plan
The meal screen shall show breakfast, lunch, dinner, and nutrition summary.

Acceptance criteria:
- Today/Tomorrow/Weekly tabs exist
- Each meal has Replace button
- Weekly tab shows locked state for Free user

### R5: Workout
The workout screen shall show exercise list, timer placeholder, and completion states.

Acceptance criteria:
- Exercises display sets/reps
- User can mark exercise completed
- Progress updates visually

### R6: Habits
The habits screen shall allow daily habit completion.

Acceptance criteria:
- Habit rows display
- User can toggle complete
- Completed habit animates

### R7: Progress
The progress screen shall show simple metrics and charts placeholders.

Acceptance criteria:
- Weight trend card
- Completion rate card
- Average calories card
- Gold locked advanced analytics state

### R8: Paywall
The paywall shall show Free, Silver, and Gold plans.

Acceptance criteria:
- Gold is highlighted
- StoreKit button exists
- Restore purchase button exists
- ABA manual payment link exists

### R9: ABA Payment
The ABA payment screen shall show QR placeholder, merchant ID, transaction input, screenshot upload placeholder, and submit button.

Acceptance criteria:
- Status can become pending
- Pending confirmation screen exists

### R10: Preview
Every screen shall have SwiftUI preview support.

Acceptance criteria:
- #Preview exists for every major screen
- Mock data exists
- App builds successfully in Xcode
