//
//  AIGeneratingView.swift
//  FitMealAI
//
//  Loading state shown while the backend generates the first plan.
//  Uses ShimmerSkeleton blocks shaped like the eventual Home dashboard
//  so the transition to Home feels seamless.
//

import SwiftUI

struct AIGeneratingView: View {

    /// Optional callback fired when the (mock) generation is finished.
    /// Phase-3 will wire this to the real AIService Task completion.
    var autoCompleteAfter: TimeInterval? = 2.4
    var onComplete: (() -> Void)? = nil

    @State private var pulse = false
    @State private var stepIndex = 0

    private let steps = [
        "Studying your goal",
        "Picking smart meals",
        "Designing your workout",
        "Polishing your plan"
    ]

    var body: some View {
        ZStack {
            GlassBackground(showGlows: true)

            VStack(spacing: AppTheme.Spacing.xLarge) {
                Spacer().frame(height: AppTheme.Spacing.xLarge)

                // Animated AI orb
                ZStack {
                    Circle()
                        .fill(AppTheme.Gradients.primaryButton)
                        .frame(width: 120, height: 120)
                        .scaleEffect(pulse ? 1.06 : 0.96)
                        .shadow(color: AppTheme.Colors.accentPurple.opacity(0.6), radius: 32)
                    Image(systemName: "sparkles")
                        .font(.system(size: 44, weight: .semibold))
                        .foregroundStyle(.white)
                        .rotationEffect(.degrees(pulse ? 6 : -6))
                }

                VStack(spacing: AppTheme.Spacing.xSmall) {
                    Text("Crafting your plan")
                        .font(AppTheme.Typography.title)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(steps[stepIndex])
                        .font(AppTheme.Typography.body)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                        .id(stepIndex) // re-render to retrigger transition
                        .transition(.opacity.combined(with: .move(edge: .bottom)))
                }
                .frame(maxWidth: .infinity)

                // Skeleton dashboard preview
                VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
                    GlassCard {
                        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                            ShimmerSkeleton(height: 14, width: 110)
                            ShimmerSkeleton(height: 24, width: 180)
                            ShimmerSkeleton(height: 10)
                        }
                    }
                    GlassCard {
                        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                            ShimmerSkeleton(height: 14, width: 90)
                            ShimmerSkeleton(height: 60, cornerRadius: 16)
                        }
                    }
                }

                Spacer()
            }
            .padding(.horizontal, AppTheme.Spacing.large)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) {
                pulse = true
            }
            advanceSteps()
            if let delay = autoCompleteAfter {
                DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                    onComplete?()
                }
            }
        }
    }

    private func advanceSteps() {
        Task {
            for index in 1..<steps.count {
                try? await Task.sleep(nanoseconds: 600_000_000)
                await MainActor.run {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        stepIndex = index
                    }
                }
            }
        }
    }
}

#Preview("AIGeneratingView") {
    AIGeneratingView(autoCompleteAfter: nil)
        .preferredColorScheme(.dark)
}
