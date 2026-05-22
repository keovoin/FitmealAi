//
//  RootView.swift
//  FitMealAI
//
//  Root container. Phase 1 only renders the design-system foundation
//  so the project can be opened in Xcode and previewed without screens.
//  Phase 3 will replace this with a real onboarding/dashboard flow.
//

import SwiftUI

struct RootView: View {

    // Local Phase-1 sample state to exercise the multi-select component
    @State private var sampleDietSelection: Set<String> = ["balanced"]
    @State private var sampleCookTime = "30 min"

    var body: some View {
        ZStack {
            GlassBackground()

            ScrollView {
                VStack(spacing: AppTheme.Spacing.large) {
                    Text("FitMeal AI")
                        .font(AppTheme.Typography.largeTitle)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                        .padding(.top, AppTheme.Spacing.xLarge)

                    Text("Phase 1 foundation preview")
                        .font(AppTheme.Typography.body)
                        .foregroundStyle(AppTheme.Colors.textSecondary)

                    OnboardingStepIndicator(current: 1)

                    GlassCard {
                        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                            Text("Glass Card")
                                .font(AppTheme.Typography.headline)
                                .foregroundStyle(AppTheme.Colors.textPrimary)
                            Text("Reusable glass surface for content.")
                                .font(AppTheme.Typography.body)
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }

                    SegmentedPicker(
                        options: ["< 15 min", "30 min", "45 min", "1 hr+"],
                        selection: $sampleCookTime
                    )

                    PrimaryButton(title: "Primary Action") {}
                    PrimaryButton(title: "Saved!", style: .success) {}
                    SecondaryGlassButton(title: "Secondary Action") {}
                }
                .padding(.horizontal, AppTheme.Spacing.large)
                .padding(.bottom, AppTheme.Spacing.xLarge)
            }
        }
    }
}

#Preview("RootView") {
    RootView()
}
