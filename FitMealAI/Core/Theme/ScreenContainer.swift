//
//  ScreenContainer.swift
//  FitMealAI
//
//  Standard screen wrapper: glass background + safe-area-aware
//  scrollable content. All Phase-2 screens build on this so we
//  don't repeat the ZStack { GlassBackground; ScrollView } pattern.
//

import SwiftUI

struct ScreenContainer<Content: View>: View {
    var showGlows: Bool = false
    var horizontalPadding: CGFloat = AppTheme.Spacing.large
    var topPadding: CGFloat = AppTheme.Spacing.large
    var bottomPadding: CGFloat = AppTheme.Spacing.xxLarge
    @ViewBuilder let content: () -> Content

    var body: some View {
        ZStack {
            GlassBackground(showGlows: showGlows)

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
                    content()
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, horizontalPadding)
                .padding(.top, topPadding)
                .padding(.bottom, bottomPadding)
            }
        }
    }
}

#Preview("ScreenContainer") {
    ScreenContainer(showGlows: true) {
        Text("Header")
            .font(AppTheme.Typography.largeTitle)
            .foregroundStyle(AppTheme.Colors.textPrimary)
        GlassCard {
            Text("Sample content inside ScreenContainer.")
                .font(AppTheme.Typography.body)
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
    }
    .preferredColorScheme(.dark)
}
