//
//  MealPrefs.swift
//  FitMealAI
//
//  Mirrors the `MealPrefs` interface in React's `preferences.ts`.
//  Used by Onboarding Meal and Settings Meal screens.
//

import Foundation

// MARK: - Diet style

struct DietStyle: MultiSelectItem, Codable {
    let id: String
    let label: String
    let emoji: String
    let subtitle: String?

    static let all: [DietStyle] = [
        DietStyle(id: "balanced",      label: "Balanced",      emoji: "⚖️", subtitle: "Everything in moderation"),
        DietStyle(id: "high-protein",  label: "High Protein",  emoji: "🥩", subtitle: "Muscle-building focused"),
        DietStyle(id: "low-carb",      label: "Low Carb",      emoji: "🥦", subtitle: "Reduce carbohydrates"),
        DietStyle(id: "keto",          label: "Keto",          emoji: "🧀", subtitle: "Very low carb, high fat"),
        DietStyle(id: "vegan",         label: "Vegan",         emoji: "🌱", subtitle: "100% plant-based"),
        DietStyle(id: "vegetarian",    label: "Vegetarian",    emoji: "🥗", subtitle: "No meat or fish"),
        DietStyle(id: "mediterranean", label: "Mediterranean", emoji: "🫒", subtitle: "Whole foods & healthy fats"),
        DietStyle(id: "paleo",         label: "Paleo",         emoji: "🍖", subtitle: "Like our ancestors ate")
    ]
}

// MARK: - Meal timing

struct MealTiming: Identifiable, Codable, Hashable {
    let id: String
    let label: String
    let timeRange: String
    let emoji: String

    static let all: [MealTiming] = [
        MealTiming(id: "breakfast",       label: "Breakfast",       timeRange: "7-9 AM",     emoji: "🌅"),
        MealTiming(id: "morning-snack",   label: "Morning Snack",   timeRange: "10-11 AM",   emoji: "🍎"),
        MealTiming(id: "lunch",           label: "Lunch",           timeRange: "12-1 PM",    emoji: "☀️"),
        MealTiming(id: "afternoon-snack", label: "Afternoon Snack", timeRange: "3-4 PM",     emoji: "🥜"),
        MealTiming(id: "dinner",          label: "Dinner",          timeRange: "6-8 PM",     emoji: "🌙"),
        MealTiming(id: "evening-snack",   label: "Evening Snack",   timeRange: "After 8 PM", emoji: "🫐")
    ]
}

// MARK: - Constants

enum MealConstants {
    static let cookTimes: [String] = ["< 15 min", "30 min", "45 min", "1 hr+"]
    static let allergyTags: [String] = [
        "Peanuts", "Tree Nuts", "Gluten", "Dairy",
        "Eggs", "Shellfish", "Soy", "Fish"
    ]
}

// MARK: - Stored prefs

struct MealPrefs: Codable, Hashable {
    var diets: Set<String>
    var timings: Set<String>
    var cookTime: String
    var allergies: Set<String>

    static let `default` = MealPrefs(
        diets: ["balanced"],
        timings: ["breakfast", "lunch", "dinner"],
        cookTime: "30 min",
        allergies: []
    )
}
