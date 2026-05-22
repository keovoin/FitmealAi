//
//  Tag.swift
//  FitMealAI
//
//  Small reusable pill/chip used for allergies, ingredient tags,
//  meal-timing labels, and stat badges.
//

import SwiftUI

struct Tag: View {
    enum Variant {
        case neutral
        case purple
        case green
        case red
        case gold
    }

    let title: String
    var icon: String? = nil
    var variant: Variant = .neutral
    var isActive: Bool = false

    private var backgroundColor: Color {
        guard isActive else { return Color.white.opacity(0.06) }
        switch variant {
        case .neutral: return Color.white.opacity(0.12)
        case .purple:  return AppTheme.Colors.accentPurple.opacity(0.25)
        case .green:   return AppTheme.Colors.successGreen.opacity(0.20)
        case .red:     return AppTheme.Colors.errorRed.opacity(0.20)
        case .gold:    return AppTheme.Colors.goldStart.opacity(0.25)
        }
    }

    private var borderColor: Color {
        guard isActive else { return Color.white.opacity(0.12) }
        switch variant {
        case .neutral: return Color.white.opacity(0.30)
        case .purple:  return AppTheme.Colors.accentPurple.opacity(0.60)
        case .green:   return AppTheme.Colors.successGreen.opacity(0.60)
        case .red:     return AppTheme.Colors.errorRed.opacity(0.60)
        case .gold:    return AppTheme.Colors.goldStart.opacity(0.70)
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon).font(.system(size: 10, weight: .semibold))
            }
            Text(title)
                .font(.system(size: 12, weight: .medium))
        }
        .foregroundStyle(isActive ? AppTheme.Colors.textPrimary : AppTheme.Colors.textSecondary)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(
            Capsule().fill(backgroundColor)
        )
        .overlay(
            Capsule().stroke(borderColor, lineWidth: 1)
        )
    }
}

#Preview("Tag") {
    ZStack {
        GlassBackground()

        VStack(spacing: AppTheme.Spacing.small) {
            HStack {
                Tag(title: "Balanced", variant: .purple, isActive: true)
                Tag(title: "High Protein", variant: .purple, isActive: false)
                Tag(title: "Peanuts", variant: .red, isActive: true)
            }
            HStack {
                Tag(title: "Saved", icon: "checkmark", variant: .green, isActive: true)
                Tag(title: "Gold", icon: "sparkles", variant: .gold, isActive: true)
                Tag(title: "Default", variant: .neutral)
            }
        }
        .padding(AppTheme.Spacing.large)
    }
    .preferredColorScheme(.dark)
}
