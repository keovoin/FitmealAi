//
//  MockData.swift
//  FitMealAI
//
//  Centralized sample data for SwiftUI previews and early UI scaffolding.
//  Do NOT use in production code paths - replace with real services in
//  later phases.
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

    // MARK: - Meal Plan

    static let todayMealPlan = MealPlan(
        date: Date(),
        meals: [
            Meal(
                type: .breakfast,
                title: "Greek Yogurt Bowl",
                calories: 380,
                proteinGrams: 28,
                carbsGrams: 42,
                fatGrams: 9
            ),
            Meal(
                type: .lunch,
                title: "Grilled Chicken Quinoa",
                calories: 620,
                proteinGrams: 45,
                carbsGrams: 60,
                fatGrams: 18
            ),
            Meal(
                type: .dinner,
                title: "Salmon with Veggies",
                calories: 540,
                proteinGrams: 38,
                carbsGrams: 30,
                fatGrams: 22
            ),
            Meal(
                type: .snack,
                title: "Almonds & Apple",
                calories: 220,
                proteinGrams: 6,
                carbsGrams: 24,
                fatGrams: 12
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
        Habit(title: "Drink 2L water",     iconSystemName: "drop.fill",         isCompleted: true,  streakDays: 7),
        Habit(title: "Sleep 8 hours",      iconSystemName: "moon.fill",         isCompleted: false, streakDays: 3),
        Habit(title: "10k steps",          iconSystemName: "figure.walk",       isCompleted: true,  streakDays: 12),
        Habit(title: "5 min meditation",   iconSystemName: "leaf.fill",         isCompleted: false, streakDays: 0),
        Habit(title: "No sugar",           iconSystemName: "xmark.circle.fill", isCompleted: false, streakDays: 1)
    ]

    // MARK: - Subscription Plans

    static let plans: [SubscriptionPlan] = [
        SubscriptionPlan(
            tier: .free,
            pricePerMonth: "$0",
            features: [
                "Daily meal & workout plan",
                "Basic habit tracker",
                "Limited regenerations"
            ]
        ),
        SubscriptionPlan(
            tier: .silver,
            pricePerMonth: "$4.99",
            features: [
                "Unlimited regenerations",
                "Weekly meal plans",
                "Workout variations"
            ]
        ),
        SubscriptionPlan(
            tier: .gold,
            pricePerMonth: "$9.99",
            features: [
                "Everything in Silver",
                "Advanced progress analytics",
                "Priority AI coaching"
            ],
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
