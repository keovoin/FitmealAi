//
//  SecondaryGlassButton.swift
//  FitMealAI
//
//  Secondary action button with a glass background.
//   - Height 48
//   - .ultraThinMaterial fill
//   - White stroke opacity 0.20
//   - Corner radius 16
//   - Same tap animation as PrimaryButton
//

import SwiftUI

struct SecondaryGlassButton: View {
    let title: String
    var icon: String? = nil
    var isDisabled: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: {
            guard !isDisabled else { return }
            action()
        }) {
            HStack(spacing: AppTheme.Spacing.small) {
                if let icon {
                    Image(systemName: icon)
                }
                Text(title)
                    .font(AppTheme.Typography.headline)
            }
            .foregroundStyle(AppTheme.Colors.textPrimary)
            .frame(maxWidth: .infinity)
            .frame(height: AppTheme.Size.secondaryButtonHeight)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .stroke(AppTheme.Colors.glassStroke, lineWidth: 1)
            )
            .opacity(isDisabled ? 0.5 : 1.0)
        }
        .buttonStyle(PressableScaleStyle())
        .disabled(isDisabled)
    }
}

#Preview("SecondaryGlassButton") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.large) {
            SecondaryGlassButton(title: "Skip") {}
            SecondaryGlassButton(title: "Restore Purchase", icon: "arrow.clockwise") {}
            SecondaryGlassButton(title: "Disabled", isDisabled: true) {}
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
