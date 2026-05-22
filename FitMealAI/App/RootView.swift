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
    @State private var selected: ScreenEntry? = nil

    var body: some View {
        if let entry = selected {
            ZStack(alignment: .topLeading) {
                screen(for: entry)

                Button {
                    selected = nil
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left")
                        Text("Index")
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(Capsule().fill(.ultraThinMaterial))
                    .overlay(Capsule().stroke(AppTheme.Colors.glassStroke, lineWidth: 1))
                }
                .buttonStyle(PressableScaleStyle())
                .padding(.top, AppTheme.Spacing.small)
                .padding(.leading, AppTheme.Spacing.small)
            }
            .transition(.opacity.combined(with: .move(edge: .trailing)))
        } else {
            indexScreen
                .transition(.opacity)
        }
    }

    // MARK: - Index

    private var indexScreen: some View {
        ScreenContainer(showGlows: true) {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
                Text("FitMeal AI")
                    .font(AppTheme.Typography.largeTitle)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("Phase 2 . 17 screens . tap to preview")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            ForEach(ScreenSection.allCases) { section in
                sectionBlock(section)
            }
        }
    }

    @ViewBuilder
    private func sectionBlock(_ section: ScreenSection) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Text(section.title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textTertiary)
                .padding(.leading, AppTheme.Spacing.small)

            VStack(spacing: AppTheme.Spacing.xSmall) {
                ForEach(section.entries) { entry in
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) { selected = entry }
                    } label: {
                        HStack(spacing: AppTheme.Spacing.medium) {
                            Image(systemName: entry.icon)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundStyle(.white)
                                .frame(width: 36, height: 36)
                                .background(Circle().fill(entry.tint))
                            VStack(alignment: .leading, spacing: 2) {
                                Text(entry.title)
                                    .font(AppTheme.Typography.headline)
                                    .foregroundStyle(AppTheme.Colors.textPrimary)
                                Text(entry.subtitle)
                                    .font(AppTheme.Typography.caption)
                                    .foregroundStyle(AppTheme.Colors.textSecondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundStyle(AppTheme.Colors.textTertiary)
                        }
                        .padding(.horizontal, AppTheme.Spacing.medium)
                        .padding(.vertical, AppTheme.Spacing.small + 2)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                                .fill(.ultraThinMaterial)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                                .stroke(Color.white.opacity(0.12), lineWidth: 1)
                        )
                    }
                    .buttonStyle(PressableScaleStyle())
                }
            }
        }
    }

    // MARK: - Screen routing

    @ViewBuilder
    private func screen(for entry: ScreenEntry) -> some View {
        switch entry {
        case .splash:           SplashView()
        case .login:            LoginView()
        case .onboardingGoal:   OnboardingGoalView()
        case .onboardingWorkout:OnboardingWorkoutView()
        case .onboardingMeal:   OnboardingMealView()
        case .aiGenerating:     AIGeneratingView(autoCompleteAfter: nil)
        case .home:             HomeDashboardView()
        case .mealPlan:         MealPlanView()
        case .workout:          WorkoutView()
        case .habits:           HabitsView()
        case .progress:         ProgressDashboardView()
        case .paywall:          PaywallView()
        case .abaPayment:       ABAPaymentView()
        case .paymentPending:   PaymentPendingView(request: MockData.pendingPayment)
        case .settings:         SettingsView()
        case .settingsMeal:     SettingsMealView()
        case .settingsWorkout:  SettingsWorkoutView()
        }
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

#Preview("RootView - Phase 2 Index") {
    RootView()
        .preferredColorScheme(.dark)
}
