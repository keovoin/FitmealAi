//
//  OnboardingGoalView.swift
//  FitMealAI
//
//  Step 1 of 3. Single-select fitness goal.
//

import SwiftUI

struct OnboardingGoalView: View {
    @StateObject private var vm = OnboardingGoalViewModel()

    var onContinue: ((FitnessGoal) -> Void)? = nil
    var onBack: (() -> Void)? = nil

    var body: some View {
        ScreenContainer(showGlows: true) {
            TopBar(title: "Your Goal", subtitle: "Step 1 of 3", showBack: true, onBack: { onBack?() })

            OnboardingStepIndicator(current: 0)

            VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
                Text("What's your main goal?")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("Pick one to start. You can refine later in Settings.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            VStack(spacing: AppTheme.Spacing.small) {
                ForEach(GoalChoice.all) { choice in
                    goalRow(choice)
                }
            }

            PrimaryButton(
                title: "Continue",
                icon: "arrow.right",
                isDisabled: !vm.canContinue
            ) {
                if let goal = vm.selectedGoal { onContinue?(goal) }
            }
            .padding(.top, AppTheme.Spacing.small)
        }
    }

    @ViewBuilder
    private func goalRow(_ choice: GoalChoice) -> some View {
        let active = vm.selectedGoal == choice.goal

        Button {
            vm.select(choice.goal)
        } label: {
            HStack(spacing: AppTheme.Spacing.medium) {
                Text(choice.emoji)
                    .font(.system(size: 28))
                    .frame(width: 48, height: 48)
                    .background(
                        Circle().fill(Color.white.opacity(active ? 0.15 : 0.08))
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(choice.goal.rawValue)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(choice.subtitle)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                ZStack {
                    Circle()
                        .strokeBorder(
                            active ? Color.clear : Color.white.opacity(0.25),
                            lineWidth: 1.5
                        )
                        .frame(width: 22, height: 22)
                    if active {
                        Circle()
                            .fill(AppTheme.Colors.accentPurple)
                            .frame(width: 22, height: 22)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
            .padding(.vertical, AppTheme.Spacing.medium)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .fill(active ? AnyShapeStyle(AppTheme.Gradients.selectionPurple) : AnyShapeStyle(Color.white.opacity(0.05)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .stroke(
                        active ? AppTheme.Colors.accentPurple.opacity(0.60) : Color.white.opacity(0.12),
                        lineWidth: 1
                    )
            )
            .shadow(
                color: active ? AppTheme.Colors.accentPurple.opacity(0.20) : .clear,
                radius: 8
            )
        }
        .buttonStyle(PressableScaleStyle())
    }
}

#Preview("OnboardingGoalView") {
    OnboardingGoalView()
        .preferredColorScheme(.dark)
}
