//
//  SettingsMealView.swift
//  FitMealAI
//
//  Edit saved meal preferences. Reuses MultiSelectGrid, SegmentedPicker,
//  Tag/FlowLayout from Onboarding so visuals stay 1:1.
//
//  On Save -> persists via PreferencesStore and shows a transient
//  "Saved!" success state on the primary button for 2 seconds.
//

import SwiftUI

struct SettingsMealView: View {
    @StateObject private var vm: SettingsMealViewModel

    var onBack: (() -> Void)? = nil

    init(
        store: PreferencesStore = PreferencesStore(),
        onBack: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: SettingsMealViewModel(store: store))
        self.onBack = onBack
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "Meal preferences", subtitle: "Tweak any time", showBack: true, onBack: { onBack?() }) {
                Image(systemName: "fork.knife")
                    .foregroundStyle(AppTheme.Colors.accentPurple)
            }

            dietsSection
            timingsSection
            cookTimeSection
            allergiesSection
            summaryCard

            PrimaryButton(
                title: vm.isSaved ? "Saved!" : "Save changes",
                icon: vm.isSaved ? "checkmark" : "tray.and.arrow.down.fill",
                style: vm.isSaved ? .success : .primary,
                isDisabled: !vm.canSave
            ) {
                vm.save()
            }
        }
    }

    // MARK: - Sections (mirrors OnboardingMealView)

    private var dietsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Diet styles", systemImage: "leaf.fill")
            MultiSelectGrid(
                items: DietStyle.all,
                selection: Binding(
                    get: { vm.prefs.diets },
                    set: { newValue in
                        vm.prefs.diets = newValue.isEmpty ? vm.prefs.diets : newValue
                    }
                )
            )
        }
    }

    private var timingsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Meal timings", systemImage: "clock.fill")
            VStack(spacing: AppTheme.Spacing.xSmall) {
                ForEach(MealTiming.all) { timing in
                    timingRow(timing)
                }
            }
        }
    }

    @ViewBuilder
    private func timingRow(_ timing: MealTiming) -> some View {
        let active = vm.prefs.timings.contains(timing.id)
        Button {
            vm.toggleTiming(timing.id)
        } label: {
            HStack(spacing: AppTheme.Spacing.medium) {
                Text(timing.emoji)
                    .font(.system(size: 22))
                    .frame(width: 36, height: 36)
                    .background(Circle().fill(Color.white.opacity(active ? 0.18 : 0.08)))

                VStack(alignment: .leading, spacing: 1) {
                    Text(timing.label)
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(timing.timeRange)
                        .font(.system(size: 12))
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }

                Spacer()

                ZStack {
                    Circle()
                        .strokeBorder(Color.white.opacity(active ? 0 : 0.25), lineWidth: 1.5)
                        .frame(width: 22, height: 22)
                    if active {
                        Circle()
                            .fill(AppTheme.Colors.successGreen)
                            .frame(width: 22, height: 22)
                        Image(systemName: "checkmark")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
            .padding(.vertical, AppTheme.Spacing.small + 2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .fill(active ? AnyShapeStyle(AppTheme.Gradients.selectionGreen) : AnyShapeStyle(Color.white.opacity(0.05)))
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .stroke(
                        active ? AppTheme.Colors.successGreen.opacity(0.55) : Color.white.opacity(0.12),
                        lineWidth: 1
                    )
            )
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var cookTimeSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Max cook time", systemImage: "flame.fill")
            SegmentedPicker(
                options: MealConstants.cookTimes,
                selection: Binding(
                    get: { vm.prefs.cookTime },
                    set: { vm.setCookTime($0) }
                )
            )
        }
    }

    private var allergiesSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            HStack {
                sectionLabel("Allergies", systemImage: "exclamationmark.triangle.fill")
                Spacer()
                Text("Optional")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textTertiary)
            }
            FlowLayout(spacing: AppTheme.Spacing.xSmall) {
                ForEach(MealConstants.allergyTags, id: \.self) { tag in
                    Button {
                        vm.toggleAllergy(tag)
                    } label: {
                        Tag(
                            title: tag,
                            variant: .red,
                            isActive: vm.prefs.allergies.contains(tag)
                        )
                    }
                    .buttonStyle(PressableScaleStyle())
                }
            }
        }
    }

    private var summaryCard: some View {
        GlassCard {
            HStack {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(AppTheme.Colors.successGreen)
                Text(vm.summary)
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Spacer()
                Text(vm.prefs.cookTime)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
    }

    @ViewBuilder
    private func sectionLabel(_ text: String, systemImage: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: systemImage)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.accentPurple)
            Text(text)
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
    }
}

#Preview("SettingsMealView") {
    SettingsMealView()
        .preferredColorScheme(.dark)
}
