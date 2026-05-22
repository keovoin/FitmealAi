//
//  PrimaryButton.swift
//  FitMealAI
//
//  Primary call-to-action button.
//   - Height 52
//   - Default gradient blue -> purple, success gradient green -> deep green
//   - Corner radius 16
//   - Tap animation: scale 1 -> 0.96 -> 1
//

import SwiftUI

struct PrimaryButton: View {

    enum Style {
        case primary  // blue -> purple
        case success  // green -> deep green (used for "Saved!" confirmations)
    }

    let title: String
    var icon: String? = nil
    var style: Style = .primary
    var isLoading: Bool = false
    var isDisabled: Bool = false
    let action: () -> Void

    private var gradient: LinearGradient {
        switch style {
        case .primary: return AppTheme.Gradients.primaryButton
        case .success: return AppTheme.Gradients.successButton
        }
    }

    private var glowColor: Color {
        switch style {
        case .primary: return AppTheme.Colors.accentPurple.opacity(0.35)
        case .success: return AppTheme.Colors.successGreen.opacity(0.35)
        }
    }

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
                    .fill(gradient)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .stroke(Color.white.opacity(0.15), lineWidth: 1)
            )
            .shadow(color: glowColor, radius: 16, x: 0, y: 8)
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
            PrimaryButton(title: "Saved!", icon: "checkmark", style: .success) {}
            PrimaryButton(title: "Loading", isLoading: true) {}
            PrimaryButton(title: "Disabled", isDisabled: true) {}
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
