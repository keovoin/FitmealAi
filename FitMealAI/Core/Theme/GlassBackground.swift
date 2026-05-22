//
//  GlassBackground.swift
//  FitMealAI
//
//  Full-screen dark gradient background plus optional soft glow circles
//  used by Login and onboarding screens.
//

import SwiftUI

struct GlassBackground: View {
    /// When true, adds the purple+blue glow circles seen on Login/Onboarding.
    var showGlows: Bool = false

    var body: some View {
        ZStack {
            AppTheme.Gradients.background
                .ignoresSafeArea()

            // Subtle radial highlight for depth behind glass cards.
            RadialGradient(
                colors: [AppTheme.Colors.accentPurple.opacity(0.16), Color.clear],
                center: .topTrailing,
                startRadius: 0,
                endRadius: 420
            )
            .ignoresSafeArea()
            .blendMode(.plusLighter)
            .allowsHitTesting(false)

            if showGlows {
                Circle()
                    .fill(AppTheme.Colors.accentPurple.opacity(0.24))
                    .frame(width: 340, height: 340)
                    .blur(radius: 100)
                    .offset(y: -240)

                Circle()
                    .fill(AppTheme.Colors.accentBlue.opacity(0.18))
                    .frame(width: 200, height: 200)
                    .blur(radius: 80)
                    .offset(x: 120, y: -160)
            }
        }
    }
}

#Preview("GlassBackground") {
    GlassBackground(showGlows: true)
}
