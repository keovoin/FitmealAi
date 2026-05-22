//
//  OnboardingMealView.swift
//  FitMealAI
//
//  Step 3 of 3. Multi-select diets + meal timings + cook time + allergies.
//

import SwiftUI

struct OnboardingMealView: View {
    @StateObject private var vm: OnboardingMealViewModel

    var onContinue: ((MealPrefs) -> Void)? = nil
    var onBack: (() -> Void)? = nil

    init(
        store: PreferencesStore = PreferencesStore(),
        seed: MealPrefs? = nil,
        onContinue: ((MealPrefs) -> Void)? = nil,
        onBack: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: OnboardingMealViewModel(store: store, seed: seed))
        self.onContinue = onContinue
        self.onBack = onBack
    }

    var body: some View {
        ScreenContainer(showGlows: true) {
            TopBar(title: "Meals", subtitle: "Step 3 of 3", showBack: true, onBack: { onBack?() })

            OnboardingStepIndicator(current: 2)

            VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
                Text("How do you like to eat?")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("Pick diets and meal slots that fit your day.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            dietsSection
            timingsSection
            cookTimeSection
            allergiesSection
            summaryFooter

            PrimaryButton(
                title: "Continue",
                icon: "sparkles",
                isDisabled: !vm.canContinue
            ) {
                vm.save()
                onContinue?(vm.prefs)
            }
            .padding(.top, AppTheme.Spacing.small)
        }
    }

    // MARK: - Sections

    private var dietsSection: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            sectionLabel("Diet styles", systemImage: "leaf.fill")
            MultiSelectGrid(
                items: vm.dietsList,
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
                ForEach(vm.timingsList) { timing in
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
                    .background(
                        Circle().fill(Color.white.opacity(active ? 0.18 : 0.08))
                    )

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
                options: vm.cookTimes,
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
                ForEach(vm.allergyTags, id: \.self) { tag in
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

    private var summaryFooter: some View {
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

// MARK: - Lightweight flow layout for the allergy chips

/// Standard wrap-on-overflow layout. Avoids pulling in any extra
/// dependency just for chip wrapping.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        return CGSize(width: maxWidth.isFinite ? maxWidth : x, height: y + rowHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

#Preview("OnboardingMealView") {
    OnboardingMealView()
        .preferredColorScheme(.dark)
}
