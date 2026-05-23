package com.fitmealai.data

import com.fitmealai.domain.Exercise
import com.fitmealai.domain.FitnessGoal
import com.fitmealai.domain.Habit
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import com.fitmealai.domain.SubscriptionPlan
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.domain.UserProfile
import com.fitmealai.domain.WorkoutPlan

object MockData {
    val user = UserProfile(
        id = "preview-user",
        name = "Alex",
        email = "alex@fitmeal.ai",
        goal = FitnessGoal.EatHealthier,
        tier = SubscriptionTier.Free,
        dailyCalorieTarget = 2_000,
    )

    val mealPlan = MealPlan(
        dateLabel = "Today",
        meals = listOf(
            Meal(
                id = "breakfast",
                type = MealType.Breakfast,
                title = "Greek yogurt bowl",
                description = "Creamy yogurt with granola, fresh berries, and honey.",
                calories = 380,
                proteinGrams = 28,
                carbsGrams = 42,
                fatGrams = 9,
                ingredients = listOf(
                    Ingredient("Greek yogurt", 200, 200, 20, 12, 6),
                    Ingredient("Granola", 40, 160, 4, 24, 5),
                    Ingredient("Blueberries", 60, 35, 0, 9, 0),
                    Ingredient("Honey", 10, 30, 0, 8, 0),
                ),
                recipeSteps = listOf(
                    "Spoon yogurt into a bowl.",
                    "Top with granola and blueberries.",
                    "Drizzle honey on top.",
                ),
            ),
            Meal(
                id = "lunch",
                type = MealType.Lunch,
                title = "Grilled chicken quinoa bowl",
                description = "High-protein lunch with mixed greens and olive oil.",
                calories = 620,
                proteinGrams = 45,
                carbsGrams = 60,
                fatGrams = 18,
                ingredients = listOf(
                    Ingredient("Chicken breast", 180, 300, 36, 0, 12),
                    Ingredient("Quinoa", 120, 220, 8, 40, 4),
                    Ingredient("Mixed greens", 80, 60, 1, 12, 0),
                    Ingredient("Olive oil", 10, 90, 0, 0, 10),
                ),
                recipeSteps = listOf(
                    "Cook quinoa per package directions.",
                    "Season and grill chicken until 74C internal.",
                    "Plate greens, top with chicken and quinoa, finish with olive oil.",
                ),
            ),
            Meal(
                id = "dinner",
                type = MealType.Dinner,
                title = "Salmon with roasted veggies",
                description = "Omega-rich salmon with sweet potato and broccoli.",
                calories = 540,
                proteinGrams = 38,
                carbsGrams = 30,
                fatGrams = 22,
                ingredients = listOf(
                    Ingredient("Salmon fillet", 160, 320, 32, 0, 18),
                    Ingredient("Sweet potato", 150, 130, 2, 30, 0),
                    Ingredient("Roasted broccoli", 120, 90, 4, 14, 4),
                ),
                recipeSteps = listOf(
                    "Roast sweet potato and broccoli at 220C for 20 minutes.",
                    "Pan-sear salmon skin-side down 4 minutes, flip, 2 more.",
                    "Plate together.",
                ),
            ),
        ),
    )

    val workout = WorkoutPlan(
        title = "Upper body strength",
        estimatedMinutes = 45,
        exercises = listOf(
            Exercise("ex-1", "Push ups", sets = 3, reps = 12, restSeconds = 60),
            Exercise("ex-2", "Dumbbell rows", sets = 3, reps = 10, restSeconds = 75),
            Exercise("ex-3", "Shoulder press", sets = 3, reps = 10, restSeconds = 75),
            Exercise("ex-4", "Plank", sets = 3, reps = 1, restSeconds = 45, notes = "Hold 45s"),
        ),
    )

    val habits = listOf(
        Habit("h-1", "Drink 8 glasses of water", emoji = "💧", streakDays = 12, isCompleted = true),
        Habit("h-2", "Walk 8,000 steps", emoji = "🚶", streakDays = 6, isCompleted = false),
        Habit("h-3", "Sleep before 11 PM", emoji = "😴", streakDays = 9, isCompleted = false),
        Habit("h-4", "Stretch for 5 minutes", emoji = "🧘", streakDays = 4, isCompleted = true),
    )

    val plans = listOf(
        SubscriptionPlan(
            tier = SubscriptionTier.Free,
            priceLabel = "$0",
            tagline = "The basics, free forever",
            perks = listOf(
                "1 AI meal plan / day",
                "10 catalog shuffles / day",
                "Today's plan only",
                "Habit tracker",
            ),
        ),
        SubscriptionPlan(
            tier = SubscriptionTier.Silver,
            priceLabel = "$4.99 / mo",
            tagline = "Plenty of fresh plans every day",
            perks = listOf(
                "20 AI generations / day",
                "Unlimited catalog shuffles",
                "Tomorrow's plan",
                "Workout timer",
                "Saved preferences",
            ),
            highlight = true,
        ),
        SubscriptionPlan(
            tier = SubscriptionTier.Gold,
            priceLabel = "$9.99 / mo",
            tagline = "Coach-grade plans",
            perks = listOf(
                "30 AI generations / day",
                "Unlimited catalog shuffles",
                "Weekly meal plans",
                "Advanced progress charts",
                "Priority regeneration",
                "Image cache for every meal",
            ),
        ),
    )

    val mealCookTimes = listOf("15 min", "30 min", "45 min", "60 min")
    val workoutDayChoices = listOf("2-3 days", "3-4 days", "5-6 days", "Daily")
    val workoutDurationChoices = listOf("15-30 min", "30-45 min", "45-60 min", "60+ min")
}
