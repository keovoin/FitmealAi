//
//  OnboardingGoalViewModel.swift
//  FitMealAI
//
//  Step 1 of 3. Captures the user's primary fitness goal.
//  No SwiftUI imports - portable to Jetpack Compose later.
//

import Foundation
import Combine

@MainActor
final class OnboardingGoalViewModel: ObservableObject {

    @Published var selectedGoal: FitnessGoal? = nil

    var canContinue: Bool { selectedGoal != nil }

    func select(_ goal: FitnessGoal) {
        selectedGoal = goal
    }
}

/// Display metadata for each goal. Lives in the ViewModel layer so the
/// View just renders rows without owning copy.
struct GoalChoice: Identifiable, Hashable {
    let goal: FitnessGoal
    let emoji: String
    let subtitle: String

    var id: FitnessGoal { goal }

    static let all: [GoalChoice] = [
        GoalChoice(goal: .loseWeight,   emoji: "🔥", subtitle: "Trim down with a calorie-aware plan"),
        GoalChoice(goal: .buildMuscle,  emoji: "💪", subtitle: "Higher protein, structured strength"),
        GoalChoice(goal: .stayFit,      emoji: "🏃", subtitle: "Maintain energy and steady habits"),
        GoalChoice(goal: .eatHealthier, emoji: "🥗", subtitle: "Whole foods with simple variety")
    ]
}
