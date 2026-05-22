//
//  SegmentedPicker.swift
//  FitMealAI
//
//  Glass-styled segmented picker used for cook time, days/week, etc.
//  Matches the React `SegmentedControl`/segmented-pill pattern.
//

import SwiftUI

struct SegmentedPicker: View {
    let options: [String]
    @Binding var selection: String
    /// When set, shows a shorter label per option (e.g. "2" for "2 days").
    var labelTransform: ((String) -> String)? = nil

    var body: some View {
        HStack(spacing: 2) {
            ForEach(options, id: \.self) { option in
                let active = option == selection
                Button {
                    selection = option
                } label: {
                    Text(labelTransform?(option) ?? option)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(active ? AppTheme.Colors.textPrimary : AppTheme.Colors.textTertiary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(
                            RoundedRectangle(cornerRadius: AppTheme.Radius.pill, style: .continuous)
                                .fill(active ? Color.white.opacity(0.20) : Color.clear)
                        )
                }
                .buttonStyle(PressableScaleStyle())
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .fill(Color.white.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .stroke(Color.white.opacity(0.10), lineWidth: 1)
        )
    }
}

#Preview("SegmentedPicker") {
    SegmentedPickerPreviewWrapper()
}

private struct SegmentedPickerPreviewWrapper: View {
    @State private var cookTime = "30 min"
    @State private var days = "4 days"

    var body: some View {
        ZStack {
            GlassBackground()
            VStack(spacing: AppTheme.Spacing.large) {
                Text("Cook time")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                SegmentedPicker(
                    options: ["< 15 min", "30 min", "45 min", "1 hr+"],
                    selection: $cookTime
                )

                Text("Days per week")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                SegmentedPicker(
                    options: ["2 days", "3 days", "4 days", "5 days", "6 days"],
                    selection: $days,
                    labelTransform: { $0.split(separator: " ").first.map(String.init) ?? $0 }
                )
            }
            .padding(AppTheme.Spacing.large)
        }
        .preferredColorScheme(.dark)
    }
}
