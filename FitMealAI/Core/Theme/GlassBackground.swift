//
//  GlassBackground.swift
//  FitMealAI
//
//  Full-screen dark gradient background used as the canvas behind
//  every glass card. Drop this in the deepest ZStack of any screen.
//

import SwiftUI

struct GlassBackground: View {
    var body: some View {
        AppTheme.Gradients.background
            .ignoresSafeArea()
            .overlay(
                // Subtle radial highlight to give depth behind glass cards.
                RadialGradient(
                    colors: [
                        Color.white.opacity(0.08),
                        Color.clear
                    ],
                    center: .topLeading,
                    startRadius: 0,
                    endRadius: 420
                )
                .ignoresSafeArea()
                .blendMode(.plusLighter)
                .allowsHitTesting(false)
            )
    }
}

#Preview("GlassBackground") {
    GlassBackground()
}
