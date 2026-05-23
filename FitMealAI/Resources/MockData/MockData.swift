//
//  MockData.swift
//  FitMealAI
//
//  Centralized sample data for SwiftUI previews. Do NOT use in
//  production paths - replace with real services in later phases.
//

import Foundation

enum MockData {

    // MARK: - User Goal

    static let user = UserGoal(
        name: "Alex",
        goal: .loseWeight,
        diet: .noRestrictions,
        dailyCalorieTarget: 2200
    )

    // MARK: - Auth

    static let credentials = AuthCredentials(
        mode: .email,
        emailOrPhone: "alex@example.com",
        password: ""
    )

    // MARK: - Preferences

    static let workoutPrefs = WorkoutPrefs(
        types: ["strength", "hiit"],
        days: "4 days",
        duration: "45 min"
    )

    static let mealPrefs = MealPrefs(
        diets: ["balanced", "high-protein"],
        timings: ["breakfast", "lunch", "dinner"],
        cookTime: "30 min",
        allergies: ["Peanuts"]
    )

    // MARK: - Meal Plan with ingredients

    static let todayMealPlan = MealPlan(
        date: Date(),
        meals: [
            Meal(
                type: .breakfast,
                title: "Greek Yogurt Bowl",
                calories: 380,
                proteinGrams: 28,
                carbsGrams: 42,
                fatGrams: 9,
                ingredients: [
                    Ingredient(name: "Greek yogurt", grams: 200, calories: 200, proteinGrams: 20, carbsGrams: 12, fatGrams: 6),
                    Ingredient(name: "Granola",      grams: 40,  calories: 160, proteinGrams: 4,  carbsGrams: 24, fatGrams: 5),
                    Ingredient(name: "Blueberries",  grams: 60,  calories: 35,  proteinGrams: 0,  carbsGrams: 9,  fatGrams: 0),
                    Ingredient(name: "Honey",        grams: 10,  calories: 30,  proteinGrams: 0,  carbsGrams: 8,  fatGrams: 0)
                ]
            ),
            Meal(
                type: .lunch,
                title: "Grilled Chicken Quinoa",
                calories: 620,
                proteinGrams: 45,
                carbsGrams: 60,
                fatGrams: 18,
                ingredients: [
                    Ingredient(name: "Chicken breast", grams: 180, calories: 300, proteinGrams: 36, carbsGrams: 0,  fatGrams: 12),
                    Ingredient(name: "Quinoa",         grams: 120, calories: 220, proteinGrams: 8,  carbsGrams: 40, fatGrams: 4),
                    Ingredient(name: "Mixed greens",   grams: 80,  calories: 60,  proteinGrams: 1,  carbsGrams: 12, fatGrams: 0),
                    Ingredient(name: "Olive oil",      grams: 10,  calories: 90,  proteinGrams: 0,  carbsGrams: 0,  fatGrams: 10)
                ]
            ),
            Meal(
                type: .dinner,
                title: "Salmon with Veggies",
                calories: 540,
                proteinGrams: 38,
                carbsGrams: 30,
                fatGrams: 22,
                ingredients: [
                    Ingredient(name: "Salmon fillet",   grams: 160, calories: 320, proteinGrams: 32, carbsGrams: 0,  fatGrams: 18),
                    Ingredient(name: "Sweet potato",    grams: 150, calories: 130, proteinGrams: 2,  carbsGrams: 30, fatGrams: 0),
                    Ingredient(name: "Roasted broccoli", grams: 120, calories: 90, proteinGrams: 4, carbsGrams: 14, fatGrams: 4)
                ]
            ),
            Meal(
                type: .snack,
                title: "Almonds & Apple",
                calories: 220,
                proteinGrams: 6,
                carbsGrams: 24,
                fatGrams: 12,
                ingredients: [
                    Ingredient(name: "Almonds", grams: 25,  calories: 145, proteinGrams: 6, carbsGrams: 5,  fatGrams: 12),
                    Ingredient(name: "Apple",   grams: 150, calories: 75,  proteinGrams: 0, carbsGrams: 19, fatGrams: 0)
                ]
            )
        ]
    )

    // MARK: - Workout Plan

    static let todayWorkout = WorkoutPlan(
        title: "Full Body Strength",
        date: Date(),
        estimatedMinutes: 35,
        exercises: [
            Exercise(name: "Push-ups",        sets: 3, reps: 12, isCompleted: true),
            Exercise(name: "Squats",          sets: 3, reps: 15, isCompleted: true),
            Exercise(name: "Plank",           sets: 3, reps: 1, durationSeconds: 45),
            Exercise(name: "Lunges",          sets: 3, reps: 12),
            Exercise(name: "Mountain Climbers", sets: 3, reps: 20)
        ]
    )

    // MARK: - Habits

    static let habits: [Habit] = [
        Habit(title: "Drink 2L water",   iconSystemName: "drop.fill",         isCompleted: true,  streakDays: 7),
        Habit(title: "Sleep 8 hours",    iconSystemName: "moon.fill",         isCompleted: false, streakDays: 3),
        Habit(title: "10k steps",        iconSystemName: "figure.walk",       isCompleted: true,  streakDays: 12),
        Habit(title: "5 min meditation", iconSystemName: "leaf.fill",         isCompleted: false, streakDays: 0),
        Habit(title: "No sugar",         iconSystemName: "xmark.circle.fill", isCompleted: false, streakDays: 1)
    ]

    // MARK: - Subscription Plans

    static let plans: [SubscriptionPlan] = [
        SubscriptionPlan(
            tier: .free,
            pricePerMonth: "$0",
            features: ["1 AI meal plan / day", "10 catalog shuffles / day", "Daily plan + habit tracker"]
        ),
        SubscriptionPlan(
            tier: .silver,
            pricePerMonth: "$4.99",
            features: ["20 AI generations / day", "Unlimited catalog shuffles", "Weekly meal plans", "Workout variations"]
        ),
        SubscriptionPlan(
            tier: .gold,
            pricePerMonth: "$9.99",
            features: ["30 AI generations / day", "Unlimited catalog shuffles", "Advanced progress analytics", "Priority AI coaching"],
            isHighlighted: true
        )
    ]

    // MARK: - Payment Request

    static let pendingPayment = PaymentRequest(
        tier: .gold,
        amount: "$9.99",
        transactionId: "ABA-TX-00042",
        screenshotFileName: "receipt.png",
        status: .pending,
        submittedAt: Date()
    )
}
