//
//  BottomNav.swift
//  FitMealAI
//
//  Glass-style bottom tab bar. Phase-2 uses it inside individual
//  screens for layout previews. Phase-3 wires it into a real
//  TabView replacement so we keep full control over styling.
//

import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case home, meals, workout, habits, progress

    var id: String { rawValue }

    var label: String {
        switch self {
        case .home:     return "Home"
        case .meals:    return "Meals"
        case .workout:  return "Workout"
        case .habits:   return "Habits"
        case .progress: return "Progress"
        }
    }

    var systemIcon: String {
        switch self {
        case .home:     return "house.fill"
        case .meals:    return "fork.knife"
        case .workout:  return "figure.strengthtraining.traditional"
        case .habits:   return "checkmark.circle.fill"
        case .progress: return "chart.line.uptrend.xyaxis"
        }
    }
}

struct BottomNav: View {
    @Binding var selection: AppTab

    var body: some View {
        HStack {
            ForEach(AppTab.allCases) { tab in
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                        selection = tab
                    }
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.systemIcon)
                            .font(.system(size: 18, weight: .semibold))
                        Text(tab.label)
                            .font(.system(size: 10, weight: .medium))
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(
                        selection == tab
                        ? AppTheme.Colors.textPrimary
                        : AppTheme.Colors.textTertiary
                    )
                    .padding(.vertical, 10)
                    .background(alignment: .top) {
                        if selection == tab {
                            Capsule()
                                .fill(AppTheme.Gradients.primaryButton)
                                .frame(width: 24, height: 3)
                                .offset(y: -4)
                                .shadow(color: AppTheme.Colors.accentPurple.opacity(0.5), radius: 6)
                        }
                    }
                }
                .buttonStyle(PressableScaleStyle())
            }
        }
        .padding(.horizontal, AppTheme.Spacing.small)
        .padding(.vertical, AppTheme.Spacing.small)
        .background(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(AppTheme.Colors.glassStroke, lineWidth: 1)
        )
        .shadow(color: AppTheme.Colors.glassShadow, radius: 16, y: 8)
        .padding(.horizontal, AppTheme.Spacing.large)
    }
}

#Preview("BottomNav") {
    BottomNavPreviewWrapper()
}

private struct BottomNavPreviewWrapper: View {
    @State private var tab: AppTab = .home

    var body: some View {
        ZStack(alignment: .bottom) {
            GlassBackground()
            BottomNav(selection: $tab)
                .padding(.bottom, AppTheme.Spacing.large)
        }
        .preferredColorScheme(.dark)
    }
}
