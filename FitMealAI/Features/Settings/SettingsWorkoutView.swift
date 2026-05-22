//
//  SettingsWorkoutView.swift
//  FitMealAI
//
//  Edit saved workout preferences. Mirrors OnboardingWorkoutView, but
//  in a back-navigable Settings shell with a "Saved!" success button.
//

import SwiftUI

struct SettingsWorkoutView: View {
    @StateObject private var vm: SettingsWorkoutViewModel

    var onBack: (() -> Void)? = nil

    init(
        store: PreferencesStore = PreferencesStore(),
        onBack: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: SettingsWorkoutViewModel(store: store))
        self.onBack = onBack
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "Workout preferences", subtitle: "Tweak any time", showBack: true, onBack: { onBack?() }) {
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundStyle(AppTheme.Colors.accentBlue)
            }

            workoutTypesSection
            daysSection
            durationSection
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

    // MARK: - Sections

    private var workoutTypesSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Workout types", systemImage: "figure.mixed.cardio")
            MultiSelectGrid(
                items: WorkoutType.all,
                selection: Binding(
                    get: { vm.prefs.types },
                    set: { newValue in
                        vm.prefs.types = newValue.isEmpty ? vm.prefs.types : newValue
                    }
                )
            )
        }
    }

    private var daysSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Days per week", systemImage: "calendar")
            SegmentedPicker(
                options: WorkoutConstants.daysOptions,
                selection: Binding(
                    get: { vm.prefs.days },
                    set: { vm.setDays($0) }
                ),
                labelTransform: { $0.split(separator: " ").first.map(String.init) ?? $0 }
            )
        }
    }

    private var durationSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Session duration", systemImage: "clock")
            SegmentedPicker(
                options: WorkoutConstants.durationOptions,
                selection: Binding(
                    get: { vm.prefs.duration },
                    set: { vm.setDuration($0) }
                )
            )
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
                Text(vm.prefs.duration)
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

#Preview("SettingsWorkoutView") {
    SettingsWorkoutView()
        .preferredColorScheme(.dark)
}
