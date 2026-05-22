//
//  OnboardingWorkoutView.swift
//  FitMealAI
//
//  Step 2 of 3. Multi-select workout types + days/week + duration.
//

import SwiftUI

struct OnboardingWorkoutView: View {
    @StateObject private var vm: OnboardingWorkoutViewModel

    var onContinue: ((WorkoutPrefs) -> Void)? = nil
    var onBack: (() -> Void)? = nil

    init(
        store: PreferencesStore = PreferencesStore(),
        seed: WorkoutPrefs? = nil,
        onContinue: ((WorkoutPrefs) -> Void)? = nil,
        onBack: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: OnboardingWorkoutViewModel(store: store, seed: seed))
        self.onContinue = onContinue
        self.onBack = onBack
    }

    var body: some View {
        ScreenContainer(showGlows: true) {
            TopBar(title: "Workout", subtitle: "Step 2 of 3", showBack: true, onBack: { onBack?() })

            OnboardingStepIndicator(current: 1)

            VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
                Text("How do you like to move?")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("Pick everything you enjoy. Choose at least one.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            workoutTypesSection
            daysSection
            durationSection
            summaryFooter

            PrimaryButton(
                title: "Continue",
                icon: "arrow.right",
                isDisabled: !vm.canContinue
            ) {
                vm.save()
                onContinue?(vm.prefs)
            }
            .padding(.top, AppTheme.Spacing.small)
        }
    }

    // MARK: - Sections

    private var workoutTypesSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Workout types", systemImage: "figure.mixed.cardio")
            MultiSelectGrid(
                items: vm.typesList,
                selection: Binding(
                    get: { vm.prefs.types },
                    set: { newValue in
                        // MultiSelectGrid already enforces minimum-1 in its internal toggle.
                        // Mirror its result back to the view-model so PreferencesStore is correct.
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

    private var summaryFooter: some View {
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

#Preview("OnboardingWorkoutView") {
    OnboardingWorkoutView()
        .preferredColorScheme(.dark)
}
