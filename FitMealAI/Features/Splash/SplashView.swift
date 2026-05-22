//
//  SplashView.swift
//  FitMealAI
//
//  First screen the user sees. Shows the FitMeal AI logo on the dark
//  gradient. Phase-3 will hand off to Login or Home after a short delay.
//

import SwiftUI

struct SplashView: View {
    var onComplete: (() -> Void)? = nil

    @State private var appeared = false

    var body: some View {
        ZStack {
            GlassBackground(showGlows: true)

            VStack(spacing: AppTheme.Spacing.large) {
                ZStack {
                    Circle()
                        .fill(AppTheme.Gradients.primaryButton)
                        .frame(width: 120, height: 120)
                        .shadow(color: AppTheme.Colors.accentPurple.opacity(0.6), radius: 32)

                    Image(systemName: "leaf.fill")
                        .font(.system(size: 52, weight: .semibold))
                        .foregroundStyle(.white)
                }
                .scaleEffect(appeared ? 1 : 0.8)
                .opacity(appeared ? 1 : 0)

                Text("FitMeal AI")
                    .font(AppTheme.Typography.largeTitle)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 12)

                Text("Eat better. Move smarter.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 12)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                appeared = true
            }
            // Phase-3 will replace this fixed delay with a real auth check.
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.6) {
                onComplete?()
            }
        }
    }
}

#Preview("SplashView") {
    SplashView()
        .preferredColorScheme(.dark)
}
