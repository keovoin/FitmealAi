//
//  HomeDashboardViewModel.swift
//  FitMealAI
//
//  Aggregates the data shown on the Home tab: greeting, today's
//  calories, today's meal plan, today's workout, today's habits,
//  and current subscription tier (drives the upgrade banner).
//
//  No SwiftUI imports - portable to Jetpack Compose later.
//

import Foundation
import Combine

@MainActor
final class HomeDashboardViewModel: ObservableObject {

    @Published private(set) var user: UserGoal
    @Published private(set) var mealPlan: MealPlan
    @Published private(set) var workout: WorkoutPlan
    @Published var habits: [Habit]
    @Published private(set) var tier: SubscriptionTier
    @Published var errorMessage: String? = nil

    init(
        user: UserGoal = MockData.user,
        mealPlan: MealPlan = MockData.todayMealPlan,
        workout: WorkoutPlan = MockData.todayWorkout,
        habits: [Habit] = MockData.habits,
        tier: SubscriptionTier = .free
    ) {
        self.user = user
        self.mealPlan = mealPlan
        self.workout = workout
        self.habits = habits
        self.tier = tier
    }

    // MARK: - Greeting

    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12:  return "Good morning"
        case 12..<17: return "Good afternoon"
        case 17..<22: return "Good evening"
        default:      return "Hello"
        }
    }

    var dateLine: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEEE, MMM d"
        return formatter.string(from: Date())
    }

    // MARK: - Derived stats

    var calorieGoal: Int { user.dailyCalorieTarget }
    var caloriesConsumed: Int { mealPlan.totalCalories }

    /// Capped at 1.0 so the ring never overshoots.
    var calorieProgress: Double {
        guard calorieGoal > 0 else { return 0 }
        return min(Double(caloriesConsumed) / Double(calorieGoal), 1.0)
    }

    var caloriesRemaining: Int {
        max(calorieGoal - caloriesConsumed, 0)
    }

    var habitsCompletedCount: Int {
        habits.filter { $0.isCompleted }.count
    }

    var habitsProgress: Double {
        guard !habits.isEmpty else { return 0 }
        return Double(habitsCompletedCount) / Double(habits.count)
    }

    var nextMealTitle: String {
        // Pick the first meal that "hasn't happened yet" by ordering: breakfast -> lunch -> dinner -> snack
        let order: [MealType] = [.breakfast, .lunch, .dinner, .snack]
        for type in order {
            if let meal = mealPlan.meals.first(where: { $0.type == type }) {
                return "\(type.rawValue): \(meal.title)"
            }
        }
        return "Plan is empty"
    }

    var showsUpgradeBanner: Bool {
        tier == .free
    }

    // MARK: - Intents

    func toggleHabit(_ habit: Habit) {
        guard let idx = habits.firstIndex(where: { $0.id == habit.id }) else { return }
        habits[idx].isCompleted.toggle()
    }

    /// Replaces the displayed plan with the recipes returned by
    /// /api/recipes/shuffle. Swift's `@Published` triggers a redraw on
    /// the Home tab so the calorie ring + meal card update in place.
    func applyShuffleResult(_ result: ShuffleResult) {
        mealPlan = result.mealPlan
        errorMessage = nil
    }

    /// Stub. Phase-3 will trigger AIService to regenerate the day's plan.
    func regeneratePlan(aiService: AIService? = nil, mealPrefs: MealPrefs = .default) async {
        guard let aiService else {
            try? await Task.sleep(nanoseconds: 500_000_000)
            return
        }

        do {
            mealPlan = try await aiService.generateTodayMealPlan(
                goal: user.goal,
                calorieTarget: user.dailyCalorieTarget,
                mealPrefs: mealPrefs,
                reuseToday: false
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadLiveProfile(authService: AuthService) async {
        do {
            guard let summary = try await authService.fetchProfileSummary() else { return }
            user.name = summary.name
            tier = summary.tier
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
