//
//  MultiSelectGrid.swift
//  FitMealAI
//
//  Generic 2-column multi-select card grid used by Onboarding/Settings
//  for diet types and workout types. Replaces the duplicated grid markup
//  in OnboardingMeal.tsx, OnboardingWorkout.tsx, SettingsMeal.tsx,
//  SettingsWorkout.tsx.
//
//  Enforces a minimum-1-selection rule when `enforceMinimumOne` is true.
//

import SwiftUI

/// Item displayable in a multi-select grid card.
protocol MultiSelectItem: Identifiable, Hashable {
    var label: String { get }
    var emoji: String { get }
    /// Optional secondary description shown under the label.
    var subtitle: String? { get }
}

extension MultiSelectItem {
    var subtitle: String? { nil }
}

struct MultiSelectGrid<Item: MultiSelectItem>: View {
    let items: [Item]
    @Binding var selection: Set<Item.ID>
    var enforceMinimumOne: Bool = true

    private let columns = [
        GridItem(.flexible(), spacing: AppTheme.Spacing.small),
        GridItem(.flexible(), spacing: AppTheme.Spacing.small)
    ]

    var body: some View {
        LazyVGrid(columns: columns, spacing: AppTheme.Spacing.small) {
            ForEach(items) { item in
                let active = selection.contains(item.id)
                Button {
                    toggle(item.id)
                } label: {
                    VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
                        HStack {
                            Text(item.emoji).font(.system(size: 22))
                            Spacer()
                            if active {
                                ZStack {
                                    Circle().fill(AppTheme.Colors.accentPurple)
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 8, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                                .frame(width: 16, height: 16)
                            }
                        }
                        Text(item.label)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(active ? AppTheme.Colors.textPrimary : AppTheme.Colors.textSecondary)
                        if let subtitle = item.subtitle {
                            Text(subtitle)
                                .font(.system(size: 11))
                                .foregroundStyle(AppTheme.Colors.textQuaternary)
                                .lineLimit(2)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, AppTheme.Spacing.medium)
                    .padding(.vertical, AppTheme.Spacing.medium)
                    .background(background(active: active))
                    .overlay(border(active: active))
                }
                .buttonStyle(PressableScaleStyle())
            }
        }
    }

    private func toggle(_ id: Item.ID) {
        if selection.contains(id) {
            if enforceMinimumOne, selection.count == 1 { return }
            selection.remove(id)
        } else {
            selection.insert(id)
        }
    }

    @ViewBuilder
    private func background(active: Bool) -> some View {
        if active {
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .fill(AppTheme.Gradients.selectionPurple)
                .shadow(color: AppTheme.Colors.accentPurple.opacity(0.20), radius: 8)
        } else {
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .fill(Color.white.opacity(0.05))
        }
    }

    @ViewBuilder
    private func border(active: Bool) -> some View {
        RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
            .stroke(
                active ? AppTheme.Colors.accentPurple.opacity(0.60) : Color.white.opacity(0.15),
                lineWidth: 1
            )
    }
}

// MARK: - Preview

private struct PreviewItem: MultiSelectItem {
    let id: String
    let label: String
    let emoji: String
    let subtitle: String?
}

#Preview("MultiSelectGrid") {
    MultiSelectGridPreviewWrapper()
}

private struct MultiSelectGridPreviewWrapper: View {
    @State private var selection: Set<String> = ["balanced"]
    private let items: [PreviewItem] = [
        PreviewItem(id: "balanced",     label: "Balanced",     emoji: "⚖️", subtitle: "Everything in moderation"),
        PreviewItem(id: "high-protein", label: "High Protein", emoji: "🥩", subtitle: "Muscle-building focused"),
        PreviewItem(id: "low-carb",     label: "Low Carb",     emoji: "🥦", subtitle: "Reduce carbohydrates"),
        PreviewItem(id: "keto",         label: "Keto",         emoji: "🧀", subtitle: "Very low carb, high fat")
    ]

    var body: some View {
        ZStack {
            GlassBackground()
            MultiSelectGrid(items: items, selection: $selection)
                .padding(AppTheme.Spacing.large)
        }
        .preferredColorScheme(.dark)
    }
}
