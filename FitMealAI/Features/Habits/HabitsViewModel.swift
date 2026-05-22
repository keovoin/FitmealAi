//
//  HabitsViewModel.swift
//  FitMealAI
//
//  Owns the habit list and exposes derived completion stats.
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class HabitsViewModel: ObservableObject {

    @Published var habits: [Habit]

    init(habits: [Habit] = MockData.habits) {
        self.habits = habits
    }

    // MARK: - Derived

    var completedCount: Int { habits.filter { $0.isCompleted }.count }
    var totalCount: Int { habits.count }

    var progress: Double {
        guard totalCount > 0 else { return 0 }
        return Double(completedCount) / Double(totalCount)
    }

    var headerLine: String {
        "\(completedCount) of \(totalCount) done today"
    }

    var bestStreak: Int {
        habits.map { $0.streakDays }.max() ?? 0
    }

    // MARK: - Intents

    func toggle(_ habit: Habit) {
        guard let idx = habits.firstIndex(where: { $0.id == habit.id }) else { return }
        habits[idx].isCompleted.toggle()
        // Increment streak when checking, decrement (min 0) when unchecking.
        if habits[idx].isCompleted {
            habits[idx].streakDays += 1
        } else {
            habits[idx].streakDays = max(habits[idx].streakDays - 1, 0)
        }
    }
}
