//
//  ShimmerSkeleton.swift
//  FitMealAI
//
//  Simple shimmer-skeleton block used by AIGeneratingView and
//  loading states. Animates a horizontal highlight back and forth.
//

import SwiftUI

struct ShimmerSkeleton: View {
    var height: CGFloat = 14
    var cornerRadius: CGFloat = 8
    var width: CGFloat? = nil

    @State private var phase: CGFloat = -1

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
            .fill(Color.white.opacity(0.08))
            .frame(width: width, height: height)
            .overlay(
                LinearGradient(
                    colors: [
                        Color.clear,
                        Color.white.opacity(0.18),
                        Color.clear
                    ],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase * 200)
                .blendMode(.plusLighter)
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .onAppear {
                withAnimation(.linear(duration: 1.4).repeatForever(autoreverses: false)) {
                    phase = 1
                }
            }
    }
}

#Preview("ShimmerSkeleton") {
    ZStack {
        GlassBackground()
        VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
            ShimmerSkeleton(height: 22, width: 220)
            ShimmerSkeleton(height: 14)
            ShimmerSkeleton(height: 14, width: 180)
            ShimmerSkeleton(height: 100, cornerRadius: 16)
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
