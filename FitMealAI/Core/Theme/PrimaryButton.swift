//
//  PrimaryButton.swift
//  FitMealAI
//
//  Primary call-to-action button.
//   - Height 52
//   - Gradient blue -> purple
//   - Corner radius 16
//   - Tap animation: scale 1 -> 0.96 -> 1
//

import SwiftUI

struct PrimaryButton: View {
    let title: String
    var icon: String? = nil
    var isLoading: Bool = false
    var isDisabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: {
            guard !isDisabled, !isLoading else { return }
            action()
        }) {
            HStack(spacing: AppTheme.Spacing.small) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(AppTheme.Colors.textPrimary)
                } else if let icon {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(AppTheme.Typography.headline)
            }
            .foregroundStyle(AppTheme.Colors.textPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: AppTheme.Size.primaryButtonHeight)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .fill(AppTheme.Gradients.primaryButton)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
            .shadow(color: AppTheme.Colors.accentPurple.opacity(0.35), radius: 16, x: 0, y: 8)
            .opacity(isDisabled ? 0.5 : 1.0)
        }
        .buttonStyle(PressableScaleStyle())
        .disabled(isDisabled || isLoading)
    }
}

/// Reusable press animation: scale 1 -> 0.96 -> 1.
struct PressableScaleStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.25, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

#Preview("PrimaryButton") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.large) {
            PrimaryButton(title: "Get Started") {}
            PrimaryButton(title: "Generate Plan", icon: "sparkles") {}
            PrimaryButton(title: "Loading", isLoading: true) {}
            PrimaryButton(title: "Disabled", isDisabled: true) {}
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
