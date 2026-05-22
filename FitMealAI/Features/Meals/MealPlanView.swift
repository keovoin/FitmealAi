//
//  MealPlanView.swift
//  FitMealAI
//
//  Meals tab: Today/Tomorrow/Weekly segmented control, list of meal
//  cards with Replace buttons, nutrition summary card, Gold-locked
//  state on Weekly for Free users, and the bottom-sheet
//  IngredientModal triggered by tapping a meal.
//

import SwiftUI

struct MealPlanView: View {
    @StateObject private var vm: MealPlanViewModel
    @EnvironmentObject private var appState: AppState

    var onUpgradeTapped: (() -> Void)? = nil

    init(
        viewModel: MealPlanViewModel = MealPlanViewModel(),
        onUpgradeTapped: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onUpgradeTapped = onUpgradeTapped
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScreenContainer {
                TopBar(title: "Meal Plan", subtitle: vm.selectedTab.rawValue) {
                    Image(systemName: "fork.knife")
                        .foregroundStyle(AppTheme.Colors.accentPurple)
                }

                tabPicker
                summaryCard

                if vm.selectedTab == .weekly && vm.isWeeklyLocked {
                    weeklyLockedCard
                } else {
                    mealList
                }

                if let error = vm.errorMessage {
                    Text(error)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.errorRed)
                }

                PrimaryButton(
                    title: vm.isRegenerating ? "Generating..." : "Regenerate today's plan",
                    icon: "sparkles",
                    isLoading: vm.isRegenerating
                ) {
                    Task {
                        await vm.regenerateToday(
                            aiService: appState.aiService,
                            goal: MockData.user.goal,
                            calorieTarget: MockData.user.dailyCalorieTarget,
                            mealPrefs: appState.preferencesStore.meal
                        )
                    }
                }
            }

            // Inline backdrop + sheet (avoids relying on .sheet so the preview
            // canvas always shows the dismissed state).
            if let meal = vm.inspectedMeal {
                Color.black.opacity(0.45)
                    .ignoresSafeArea()
                    .onTapGesture { vm.dismissInspection() }
                    .transition(.opacity)

                IngredientModal(meal: meal, onDismiss: { vm.dismissInspection() })
                    .padding(.horizontal, AppTheme.Spacing.small)
                    .padding(.top, AppTheme.Spacing.xxLarge)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.85), value: vm.inspectedMeal)
    }

    // MARK: - Sections

    private var tabPicker: some View {
        SegmentedPicker(
            options: MealDayTab.allCases.map { $0.rawValue },
            selection: Binding(
                get: { vm.selectedTab.rawValue },
                set: { newValue in
                    if let tab = MealDayTab(rawValue: newValue) {
                        vm.selectTab(tab)
                    }
                }
            )
        )
    }

    private var summaryCard: some View {
        let totals = vm.totals
        return GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Text("Today's totals")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Spacer()
                    Text("\(totals.calories) kcal")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                HStack(spacing: AppTheme.Spacing.small) {
                    macroChip("P", value: totals.protein, color: AppTheme.Colors.accentBlue)
                    macroChip("C", value: totals.carbs,   color: AppTheme.Colors.successGreen)
                    macroChip("F", value: totals.fat,     color: AppTheme.Colors.goldStart)
                }
            }
        }
    }

    @ViewBuilder
    private func macroChip(_ letter: String, value: Int, color: Color) -> some View {
        HStack(spacing: 4) {
            Circle().fill(color).frame(width: 8, height: 8)
            Text("\(letter)  \(value)g")
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule().fill(Color.white.opacity(0.06))
        )
    }

    private var mealList: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            ForEach(vm.visiblePlan.meals) { meal in
                mealCard(meal)
            }
        }
    }

    @ViewBuilder
    private func mealCard(_ meal: Meal) -> some View {
        Button(action: { vm.inspect(meal) }) {
            GlassCard {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                    HStack {
                        Text(meal.type.rawValue.uppercased())
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.accentPurple)
                        Spacer()
                        Text("\(meal.calories) kcal")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                    }

                    Text(meal.title)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)

                    HStack(spacing: AppTheme.Spacing.small) {
                        Tag(title: "P \(meal.proteinGrams)g", variant: .neutral)
                        Tag(title: "C \(meal.carbsGrams)g", variant: .neutral)
                        Tag(title: "F \(meal.fatGrams)g", variant: .neutral)
                    }

                    HStack(spacing: AppTheme.Spacing.small) {
                        SecondaryGlassButton(title: "Replace", icon: "arrow.triangle.2.circlepath") {
                            Task {
                                await vm.replaceMeal(
                                    meal,
                                    aiService: appState.aiService,
                                    goal: MockData.user.goal,
                                    calorieTarget: MockData.user.dailyCalorieTarget,
                                    mealPrefs: appState.preferencesStore.meal
                                )
                            }
                        }
                        SecondaryGlassButton(title: "Details", icon: "chevron.right") {
                            vm.inspect(meal)
                        }
                    }
                }
            }
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var weeklyLockedCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 44, height: 44)
                        .background(Circle().fill(AppTheme.Gradients.gold))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Weekly plans are a Gold feature")
                            .font(AppTheme.Typography.headline)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text("See 7 days at a glance and shop ingredients in bulk.")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }
                .padding(.bottom, AppTheme.Spacing.xSmall)

                PrimaryButton(title: "Unlock Gold", icon: "sparkles") {
                    onUpgradeTapped?()
                }
            }
        }
    }
}

#Preview("MealPlanView - Free") {
    MealPlanView(viewModel: MealPlanViewModel(tier: .free))
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}

#Preview("MealPlanView - Gold") {
    MealPlanView(viewModel: MealPlanViewModel(tier: .gold))
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}
