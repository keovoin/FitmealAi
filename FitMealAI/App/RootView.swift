//
//  RootView.swift
//  FitMealAI
//
//  Root container that decides what the user sees first.
//  In Phase 1, this is just a placeholder that shows the design system
//  components so we can verify the foundation builds correctly.
//  Phase 3 will wire in onboarding/dashboard navigation.
//

import SwiftUI

struct RootView: View {
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

                    PrimaryButton(title: "Primary Action") {}
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
