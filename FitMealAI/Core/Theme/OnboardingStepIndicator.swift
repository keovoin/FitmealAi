//
//  OnboardingStepIndicator.swift
//  FitMealAI
//
//  Reusable 3-step indicator: Goal -> Workout -> Meal.
//  Matches the React StepIndicator that was duplicated across
//  OnboardingWorkout.tsx and OnboardingMeal.tsx.
//

import SwiftUI

struct OnboardingStepIndicator: View {
    /// Zero-based current step index (0 = Goal, 1 = Workout, 2 = Meal).
    let current: Int
    var labels: [String] = ["Goal", "Workout", "Meal"]

    var body: some View {
        HStack(spacing: AppTheme.Spacing.small) {
            ForEach(Array(labels.enumerated()), id: \.offset) { index, label in
                stepCircle(index: index, label: label)

                if index < labels.count - 1 {
                    Rectangle()
                        .fill(index < current ? AppTheme.Colors.accentPurple : Color.white.opacity(0.15))
                        .frame(width: 32, height: 1)
                        .padding(.bottom, 16)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private func stepCircle(index: Int, label: String) -> some View {
        VStack(spacing: AppTheme.Spacing.xSmall) {
            ZStack {
                if index == current {
                    Circle()
                        .fill(AppTheme.Gradients.primaryButton)
                        .shadow(color: AppTheme.Colors.accentPurple.opacity(0.5), radius: 12)
                } else if index < current {
                    Circle().fill(AppTheme.Colors.accentPurple)
                } else {
                    Circle().fill(Color.white.opacity(0.10))
                }

                if index < current {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                } else {
                    Text("\(index + 1)")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(index == current ? .white : AppTheme.Colors.textQuaternary)
                }
            }
            .frame(width: 28, height: 28)

            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(index == current ? AppTheme.Colors.textPrimary : AppTheme.Colors.textQuaternary)
        }
    }
}

#Preview("OnboardingStepIndicator") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.xLarge) {
            OnboardingStepIndicator(current: 0)
            OnboardingStepIndicator(current: 1)
            OnboardingStepIndicator(current: 2)
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
