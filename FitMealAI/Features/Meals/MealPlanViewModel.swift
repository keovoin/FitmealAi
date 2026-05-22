//
//  MealPlanViewModel.swift
//  FitMealAI
//
//  Holds the user's day buckets (today/tomorrow/weekly), the current
//  selection, and the meal currently being inspected in the
//  IngredientModal. No SwiftUI imports.
//

import Foundation
import Combine

enum MealDayTab: String, CaseIterable, Identifiable {
    case today    = "Today"
    case tomorrow = "Tomorrow"
    case weekly   = "Weekly"

    var id: String { rawValue }
}

@MainActor
final class MealPlanViewModel: ObservableObject {

    @Published var selectedTab: MealDayTab = .today
    @Published var inspectedMeal: Meal? = nil

    @Published private(set) var todayPlan: MealPlan
    @Published private(set) var tomorrowPlan: MealPlan
    @Published private(set) var weeklyPlans: [MealPlan]
    @Published private(set) var tier: SubscriptionTier
    @Published var isRegenerating: Bool = false
    @Published var errorMessage: String? = nil

    init(
        todayPlan: MealPlan = MockData.todayMealPlan,
        tomorrowPlan: MealPlan = MockData.todayMealPlan,
        weeklyPlans: [MealPlan] = Array(repeating: MockData.todayMealPlan, count: 5),
        tier: SubscriptionTier = .free
    ) {
        self.todayPlan = todayPlan
        self.tomorrowPlan = tomorrowPlan
        self.weeklyPlans = weeklyPlans
        self.tier = tier
    }

    // MARK: - Derived

    /// Weekly view is locked behind Silver/Gold for Free users.
    var isWeeklyLocked: Bool { tier == .free }

    var visiblePlan: MealPlan {
        switch selectedTab {
        case .today:    return todayPlan
        case .tomorrow: return tomorrowPlan
        case .weekly:   return weeklyPlans.first ?? todayPlan
        }
    }

    var totals: NutritionTotals {
        let plan = visiblePlan
        return NutritionTotals(
            calories: plan.totalCalories,
            protein: plan.totalProtein,
            carbs: plan.totalCarbs,
            fat: plan.totalFat
        )
    }

    // MARK: - Intents

    func selectTab(_ tab: MealDayTab) {
        // Don't allow selecting weekly while locked - the UI shows the lock instead.
        if tab == .weekly, isWeeklyLocked {
            selectedTab = .weekly // we still flip so the lock state renders
            return
        }
        selectedTab = tab
    }

    func inspect(_ meal: Meal) {
        inspectedMeal = meal
    }

    func dismissInspection() {
        inspectedMeal = nil
    }

    func regenerateToday(aiService: AIService, goal: FitnessGoal, calorieTarget: Int, mealPrefs: MealPrefs) async {
        isRegenerating = true
        errorMessage = nil
        defer { isRegenerating = false }

        do {
            todayPlan = try await aiService.generateTodayMealPlan(
                goal: goal,
                calorieTarget: calorieTarget,
                mealPrefs: mealPrefs,
                reuseToday: false
            )
            selectedTab = .today
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func replaceMeal(_ meal: Meal, aiService: AIService? = nil, goal: FitnessGoal = MockData.user.goal, calorieTarget: Int = MockData.user.dailyCalorieTarget, mealPrefs: MealPrefs = .default) async {
        guard let aiService else {
            try? await Task.sleep(nanoseconds: 300_000_000)
            return
        }
        await regenerateToday(aiService: aiService, goal: goal, calorieTarget: calorieTarget, mealPrefs: mealPrefs)
    }
}

struct NutritionTotals: Hashable {
    let calories: Int
    let protein: Int
    let carbs: Int
    let fat: Int
}
