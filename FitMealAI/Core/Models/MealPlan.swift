//
//  MealPlan.swift
//  FitMealAI
//
//  Daily meal plan with breakfast, lunch, dinner, and totals.
//

import Foundation

enum MealType: String, CaseIterable, Identifiable, Codable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    case snack = "Snack"

    var id: String { rawValue }
}

struct Meal: Identifiable, Codable, Hashable {
    let id: UUID
    var type: MealType
    var title: String
    var calories: Int
    var proteinGrams: Int
    var carbsGrams: Int
    var fatGrams: Int
    var imageName: String?

    init(
        id: UUID = UUID(),
        type: MealType,
        title: String,
        calories: Int,
        proteinGrams: Int,
        carbsGrams: Int,
        fatGrams: Int,
        imageName: String? = nil
    ) {
        self.id = id
        self.type = type
        self.title = title
        self.calories = calories
        self.proteinGrams = proteinGrams
        self.carbsGrams = carbsGrams
        self.fatGrams = fatGrams
        self.imageName = imageName
    }
}

struct MealPlan: Identifiable, Codable, Hashable {
    let id: UUID
    var date: Date
    var meals: [Meal]

    init(id: UUID = UUID(), date: Date, meals: [Meal]) {
        self.id = id
        self.date = date
        self.meals = meals
    }

    var totalCalories: Int   { meals.reduce(0) { $0 + $1.calories } }
    var totalProtein: Int    { meals.reduce(0) { $0 + $1.proteinGrams } }
    var totalCarbs: Int      { meals.reduce(0) { $0 + $1.carbsGrams } }
    var totalFat: Int        { meals.reduce(0) { $0 + $1.fatGrams } }
}
