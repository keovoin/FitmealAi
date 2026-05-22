//
//  TopBar.swift
//  FitMealAI
//
//  Lightweight glass top bar with optional back button + trailing accessory.
//  Used by Settings sub-screens, Paywall, Onboarding, etc.
//

import SwiftUI

struct TopBar<Trailing: View>: View {
    let title: String
    var subtitle: String? = nil
    var showBack: Bool = false
    var onBack: (() -> Void)? = nil
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(spacing: AppTheme.Spacing.medium) {
            if showBack {
                Button(action: { onBack?() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                        .frame(width: 36, height: 36)
                        .background(
                            Circle().fill(.ultraThinMaterial)
                        )
                        .overlay(Circle().stroke(AppTheme.Colors.glassStroke, lineWidth: 1))
                }
                .buttonStyle(PressableScaleStyle())
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                if let subtitle {
                    Text(subtitle)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }

            Spacer()
            trailing()
        }
    }
}

extension TopBar where Trailing == EmptyView {
    init(title: String, subtitle: String? = nil, showBack: Bool = false, onBack: (() -> Void)? = nil) {
        self.title = title
        self.subtitle = subtitle
        self.showBack = showBack
        self.onBack = onBack
        self.trailing = { EmptyView() }
    }
}

#Preview("TopBar") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.large) {
            TopBar(title: "FitMeal AI", subtitle: "Good morning, Alex")
            TopBar(title: "Meal Settings", showBack: true) {}
            TopBar(title: "Paywall", showBack: true, onBack: {}) {
                Image(systemName: "sparkles")
                    .foregroundStyle(AppTheme.Colors.goldStart)
            }
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
