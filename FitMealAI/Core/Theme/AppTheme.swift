//
//  AppTheme.swift
//  FitMealAI
//
//  Centralized design tokens: colors, gradients, typography, spacing,
//  corner radius, and shadow values.
//
//  Source of truth: .kiro/steering/design-system.md
//

import SwiftUI

enum AppTheme {

    // MARK: - Colors

    enum Colors {
        // Premium wellness gradient stops: #040B08 -> #081611 -> #0B3B2E
        static let gradientStart = Color(red: 0.02, green: 0.04, blue: 0.03) // #040B08
        static let gradientMid   = Color(red: 0.03, green: 0.09, blue: 0.07) // #081611
        static let gradientEnd   = Color(red: 0.04, green: 0.23, blue: 0.18) // #0B3B2E

        // Brand accents (match React prototype)
        static let accentBlue   = Color(red: 0.10, green: 0.72, blue: 0.54)  // emerald cyan
        static let accentPurple = Color(red: 0.22, green: 0.82, blue: 0.60)  // emerald glow

        // Status
        static let successGreen     = Color(red: 0.20, green: 0.83, blue: 0.60) // #34D399
        static let successGreenDeep = Color(red: 0.02, green: 0.59, blue: 0.41) // #059669
        static let errorRed         = Color(red: 0.94, green: 0.27, blue: 0.27) // #EF4444

        // Glass / strokes
        static let glassStroke = Color.white.opacity(0.12)
        static let glassShadow = Color.black.opacity(0.34)

        // Text
        static let textPrimary   = Color.white
        static let textSecondary = Color.white.opacity(0.70)
        static let textTertiary  = Color.white.opacity(0.50)
        static let textQuaternary = Color.white.opacity(0.40)

        // Plan accents (used later by paywall)
        static let goldStart = Color(red: 1.00, green: 0.86, blue: 0.42)
        static let goldEnd   = Color(red: 0.85, green: 0.58, blue: 0.18)
    }

    // MARK: - Gradients

    enum Gradients {
        static let background = LinearGradient(
            colors: [Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let primaryButton = LinearGradient(
            colors: [Colors.accentPurple, Colors.accentBlue],
            startPoint: .leading,
            endPoint: .trailing
        )

        static let successButton = LinearGradient(
            colors: [Colors.successGreen, Colors.successGreenDeep],
            startPoint: .leading,
            endPoint: .trailing
        )

        /// Used as the active state for multi-select cards (purple-tinted).
        static let selectionPurple = LinearGradient(
            colors: [Colors.accentPurple.opacity(0.30), Colors.accentBlue.opacity(0.15)],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        /// Used as the active state for meal-timing rows (green-tinted).
        static let selectionGreen = LinearGradient(
            colors: [Colors.successGreen.opacity(0.20), Colors.successGreen.opacity(0.05)],
            startPoint: .leading,
            endPoint: .trailing
        )

        static let gold = LinearGradient(
            colors: [Colors.goldStart, Colors.goldEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Typography

    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold)
        static let title      = Font.system(size: 24, weight: .bold)
        static let headline   = Font.system(size: 18, weight: .semibold)
        static let body       = Font.system(size: 16, weight: .regular)
        static let caption    = Font.system(size: 13, weight: .regular)
    }

    // MARK: - Spacing

    enum Spacing {
        static let xSmall: CGFloat = 4
        static let small: CGFloat  = 8
        static let medium: CGFloat = 12
        static let large: CGFloat  = 18
        static let xLarge: CGFloat = 24
        static let xxLarge: CGFloat = 32
    }

    // MARK: - Radius

    enum Radius {
        static let card: CGFloat   = 24
        static let button: CGFloat = 16
        static let chip: CGFloat   = 14
        static let pill: CGFloat   = 10
        static let small: CGFloat  = 12
    }

    // MARK: - Shadow

    enum Shadow {
        static let cardColor: Color = Colors.glassShadow
        static let cardRadius: CGFloat = 24
        static let cardY: CGFloat = 12
    }

    // MARK: - Sizing

    enum Size {
        static let primaryButtonHeight: CGFloat   = 52
        static let secondaryButtonHeight: CGFloat = 48
    }
}

// MARK: - Preview

#Preview("AppTheme Tokens") {
    ZStack {
        AppTheme.Gradients.background
            .ignoresSafeArea()

        ScrollView {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
                Text("Large Title").font(AppTheme.Typography.largeTitle)
                Text("Title").font(AppTheme.Typography.title)
                Text("Headline").font(AppTheme.Typography.headline)
                Text("Body text used across the app.")
                    .font(AppTheme.Typography.body)
                Text("Caption text").font(AppTheme.Typography.caption)

                HStack(spacing: AppTheme.Spacing.medium) {
                    swatch(AppTheme.Colors.accentBlue, "Blue")
                    swatch(AppTheme.Colors.accentPurple, "Purple")
                    swatch(AppTheme.Colors.successGreen, "Green")
                    swatch(AppTheme.Colors.errorRed, "Red")
                }

                RoundedRectangle(cornerRadius: AppTheme.Radius.button)
                    .fill(AppTheme.Gradients.primaryButton)
                    .frame(height: AppTheme.Size.primaryButtonHeight)
                    .overlay(
                        Text("Primary gradient")
                            .font(AppTheme.Typography.headline)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                    )
            }
            .foregroundStyle(AppTheme.Colors.textPrimary)
            .padding(AppTheme.Spacing.large)
        }
    }
    .preferredColorScheme(.dark)
}

@ViewBuilder
private func swatch(_ color: Color, _ label: String) -> some View {
    VStack(spacing: AppTheme.Spacing.xSmall) {
        RoundedRectangle(cornerRadius: AppTheme.Radius.small)
            .fill(color)
            .frame(width: 56, height: 56)
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.small)
                    .stroke(AppTheme.Colors.glassStroke, lineWidth: 1)
            )
        Text(label)
            .font(AppTheme.Typography.caption)
            .foregroundStyle(AppTheme.Colors.textSecondary)
    }
}
