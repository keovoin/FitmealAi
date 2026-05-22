//
//  GlassCard.swift
//  FitMealAI
//
//  Reusable glass surface used wherever content sits on the gradient.
//   - .ultraThinMaterial fill
//   - 24pt rounded corners
//   - white 0.20 stroke
//   - black 0.18 shadow
//   - 18pt padding
//

import SwiftUI

struct GlassCard<Content: View>: View {
    private let cornerRadius: CGFloat
    private let padding: CGFloat
    private let content: Content

    init(
        cornerRadius: CGFloat = AppTheme.Radius.card,
        padding: CGFloat = AppTheme.Spacing.large,
        @ViewBuilder content: () -> Content
    ) {
        self.cornerRadius = cornerRadius
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.white.opacity(0.045))
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(AppTheme.Colors.glassStroke, lineWidth: 1)
            )
            .shadow(
                color: AppTheme.Shadow.cardColor,
                radius: AppTheme.Shadow.cardRadius,
                x: 0,
                y: AppTheme.Shadow.cardY
            )
    }
}

#Preview("GlassCard") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.large) {
            GlassCard {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                    Text("Today's Calories")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("1,840 / 2,200 kcal")
                        .font(AppTheme.Typography.title)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("On track for your goal")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }

            GlassCard {
                Text("Empty state card with default padding and radius.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
