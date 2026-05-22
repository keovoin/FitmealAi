//
//  RootView.swift
//  FitMealAI
//
//  Phase 2: a development screen index that lets us reach every screen
//  built so far. This lives where the real app shell will live in
//  Phase 3 (Splash -> Login -> Onboarding -> MainTabView), so for now
//  the user lands on a list of all screens and can drill into any one.
//
//  Phase 3 will replace this body with a real router driven by auth
//  state and onboarding completion. The screens themselves already
//  take optional onContinue/onBack closures so they don't need to
//  change when navigation arrives.
//

import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            switch appState.rootFlow {
            case .splash:
                SplashView(onComplete: { appState.routeAfterSplash() })
            case .login:
                LoginView(
                    onAuthenticated: { appState.routeAfterSplash() },
                    onSignUpTapped: { appState.latestError = "Enter email and password, then tap Get started free again." }
                )
            case .onboardingGoal:
                OnboardingGoalView(
                    onContinue: { goal in appState.rememberGoal(goal) },
                    onBack: { appState.rootFlow = .login }
                )
            case .onboardingWorkout:
                OnboardingWorkoutView(
                    store: appState.preferencesStore,
                    onContinue: { prefs in appState.rememberWorkout(prefs) },
                    onBack: { appState.rootFlow = .onboardingGoal }
                )
            case .onboardingMeal:
                OnboardingMealView(
                    store: appState.preferencesStore,
                    onContinue: { prefs in Task { await appState.completeOnboarding(mealPrefs: prefs) } },
                    onBack: { appState.rootFlow = .onboardingWorkout }
                )
            case .main:
                MainTabView()
            }
        }
        .task { await appState.bootstrap() }
        .animation(.easeInOut(duration: 0.25), value: appState.rootFlow)
    }
}

// MARK: - Catalog

/// Identifies every screen reachable from the Phase-2 dev index.
enum ScreenEntry: String, CaseIterable, Identifiable {
    case splash, login
    case onboardingGoal, onboardingWorkout, onboardingMeal
    case aiGenerating, home, mealPlan, workout, habits, progress
    case paywall, abaPayment, paymentPending
    case settings, settingsMeal, settingsWorkout

    var id: String { rawValue }

    var title: String {
        switch self {
        case .splash:             return "Splash"
        case .login:              return "Login"
        case .onboardingGoal:     return "Onboarding . Goal"
        case .onboardingWorkout:  return "Onboarding . Workout"
        case .onboardingMeal:     return "Onboarding . Meal"
        case .aiGenerating:       return "AI Generating"
        case .home:               return "Home Dashboard"
        case .mealPlan:           return "Meal Plan"
        case .workout:            return "Workout"
        case .habits:             return "Habits"
        case .progress:           return "Progress"
        case .paywall:            return "Paywall"
        case .abaPayment:         return "ABA Payment"
        case .paymentPending:     return "Payment Pending"
        case .settings:           return "Settings"
        case .settingsMeal:       return "Settings . Meal"
        case .settingsWorkout:    return "Settings . Workout"
        }
    }

    var subtitle: String {
        switch self {
        case .splash:             return "First launch logo + tagline"
        case .login:              return "Email/Phone, Google, Apple"
        case .onboardingGoal:     return "Step 1 of 3 . single-select goal"
        case .onboardingWorkout:  return "Step 2 of 3 . multi-select types + days"
        case .onboardingMeal:     return "Step 3 of 3 . diets, timings, allergies"
        case .aiGenerating:       return "Shimmer skeleton + animated steps"
        case .home:               return "Greeting + calorie ring + summaries"
        case .mealPlan:           return "Today/Tomorrow/Weekly + ingredient modal"
        case .workout:            return "Exercise list + rest timer"
        case .habits:             return "Daily habits with streaks"
        case .progress:           return "Period switching + weight trend"
        case .paywall:            return "Free / Silver / Gold"
        case .abaPayment:         return "Manual transfer with QR"
        case .paymentPending:     return "Submission confirmation"
        case .settings:           return "Account + preferences + plan"
        case .settingsMeal:       return "Edit saved meal preferences"
        case .settingsWorkout:    return "Edit saved workout preferences"
        }
    }

    var icon: String {
        switch self {
        case .splash:             return "leaf.fill"
        case .login:              return "person.crop.circle.fill"
        case .onboardingGoal:     return "target"
        case .onboardingWorkout:  return "figure.strengthtraining.traditional"
        case .onboardingMeal:     return "fork.knife"
        case .aiGenerating:       return "sparkles"
        case .home:               return "house.fill"
        case .mealPlan:           return "fork.knife"
        case .workout:            return "figure.strengthtraining.traditional"
        case .habits:             return "checkmark.circle.fill"
        case .progress:           return "chart.line.uptrend.xyaxis"
        case .paywall:            return "wand.and.stars"
        case .abaPayment:         return "qrcode"
        case .paymentPending:     return "hourglass"
        case .settings:           return "gearshape.fill"
        case .settingsMeal:       return "fork.knife"
        case .settingsWorkout:    return "figure.run"
        }
    }

    var tint: Color {
        switch self {
        case .splash, .login:
            return AppTheme.Colors.accentPurple
        case .onboardingGoal, .onboardingWorkout, .onboardingMeal:
            return AppTheme.Colors.accentBlue
        case .aiGenerating:
            return AppTheme.Colors.accentPurple
        case .home, .mealPlan, .workout, .habits, .progress:
            return AppTheme.Colors.successGreen
        case .paywall, .paymentPending:
            return AppTheme.Colors.goldStart
        case .abaPayment:
            return AppTheme.Colors.accentBlue
        case .settings, .settingsMeal, .settingsWorkout:
            return AppTheme.Colors.textTertiary
        }
    }
}

private enum ScreenSection: String, CaseIterable, Identifiable {
    case launch, onboarding, main, payments, settings

    var id: String { rawValue }

    var title: String {
        switch self {
        case .launch:      return "Launch"
        case .onboarding:  return "Onboarding"
        case .main:        return "Main app"
        case .payments:    return "Payments"
        case .settings:    return "Settings"
        }
    }

    var entries: [ScreenEntry] {
        switch self {
        case .launch:     return [.splash, .login]
        case .onboarding: return [.onboardingGoal, .onboardingWorkout, .onboardingMeal, .aiGenerating]
        case .main:       return [.home, .mealPlan, .workout, .habits, .progress]
        case .payments:   return [.paywall, .abaPayment, .paymentPending]
        case .settings:   return [.settings, .settingsMeal, .settingsWorkout]
        }
    }
}

#Preview("RootView - Phase 4 Navigation") {
    RootView()
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}
