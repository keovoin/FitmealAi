//
//  AppTheme.swift
//  FitMealAI
//
//  Centralized design tokens: colors, gradients, typography, spacing,
//  corner radius, and shadow values. Keeps the rest of the app
//  free of hard-coded styling.
//
//  Source of truth: .kiro/steering/design-system.md
//

import SwiftUI

enum AppTheme {

    // MARK: - Colors

    enum Colors {
        // Background gradient stops: #0F172A -> #1E3A8A -> #7C3AED
        static let gradientStart = Color(red: 0.06, green: 0.09, blue: 0.16) // #0F172A
        static let gradientMid   = Color(red: 0.12, green: 0.23, blue: 0.54) // #1E3A8A
        static let gradientEnd   = Color(red: 0.49, green: 0.23, blue: 0.93) // #7C3AED

        // Brand accents for primary button gradient (blue -> purple)
        static let accentBlue   = Color(red: 0.23, green: 0.51, blue: 0.96) // ~#3B82F6
        static let accentPurple = Color(red: 0.55, green: 0.36, blue: 0.96) // ~#8B5CF6

        // Glass / strokes
        static let glassStroke = Color.white.opacity(0.20)
        static let glassShadow = Color.black.opacity(0.18)

        // Text
        static let textPrimary   = Color.white
        static let textSecondary = Color.white.opacity(0.70)
        static let textTertiary  = Color.white.opacity(0.50)

        // Plan accents (used later by paywall)
        static let goldStart = Color(red: 1.00, green: 0.84, blue: 0.40)
        static let goldEnd   = Color(red: 0.95, green: 0.62, blue: 0.20)
    }

    // MARK: - Gradients

    enum Gradients {
        static let background = LinearGradient(
            colors: [Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let primaryButton = LinearGradient(
            colors: [Colors.accentBlue, Colors.accentPurple],
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
        static let large: CGFloat  = 18   // matches glass card padding
        static let xLarge: CGFloat = 24
        static let xxLarge: CGFloat = 32
    }

    // MARK: - Radius

    enum Radius {
        static let card: CGFloat   = 24
        static let button: CGFloat = 16
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
                    swatch(AppTheme.Colors.gradientStart, "Start")
                    swatch(AppTheme.Colors.gradientMid, "Mid")
                    swatch(AppTheme.Colors.gradientEnd, "End")
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
