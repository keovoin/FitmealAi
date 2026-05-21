//
//  UserGoal.swift
//  FitMealAI
//
//  User's high-level fitness goal captured during onboarding.
//

import Foundation

enum FitnessGoal: String, CaseIterable, Identifiable, Codable {
    case loseWeight = "Lose weight"
    case buildMuscle = "Build muscle"
    case stayFit = "Stay fit"
    case eatHealthier = "Eat healthier"

    var id: String { rawValue }
}

enum DietPreference: String, CaseIterable, Identifiable, Codable {
    case noRestrictions = "No restrictions"
    case vegetarian = "Vegetarian"
    case vegan = "Vegan"
    case keto = "Keto"
    case halal = "Halal"

    var id: String { rawValue }
}

struct UserGoal: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var goal: FitnessGoal
    var diet: DietPreference
    var dailyCalorieTarget: Int

    init(
        id: UUID = UUID(),
        name: String,
        goal: FitnessGoal,
        diet: DietPreference,
        dailyCalorieTarget: Int
    ) {
        self.id = id
        self.name = name
        self.goal = goal
        self.diet = diet
        self.dailyCalorieTarget = dailyCalorieTarget
    }
}
