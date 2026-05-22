package com.fitmealai.data

import com.fitmealai.domain.FitnessGoal
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.domain.UserProfile

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
                title = "Protein mango oats",
                description = "Creamy oats with tart yogurt and bright mango.",
                calories = 420,
                proteinGrams = 28,
                carbsGrams = 54,
                fatGrams = 12,
                ingredients = listOf(
                    Ingredient("Rolled oats", 60, 228, 8, 40, 4),
                    Ingredient("Greek yogurt", 140, 130, 18, 8, 2),
                    Ingredient("Mango", 80, 62, 1, 16, 0),
                ),
                recipeSteps = listOf("Simmer oats", "Fold in yogurt", "Top with mango"),
            ),
            Meal(
                id = "lunch",
                type = MealType.Lunch,
                title = "Lemongrass chicken rice bowl",
                description = "A high-protein bowl with fragrant Cambodian-inspired aromatics.",
                calories = 610,
                proteinGrams = 42,
                carbsGrams = 68,
                fatGrams = 18,
            ),
            Meal(
                id = "dinner",
                type = MealType.Dinner,
                title = "Salmon herb salad",
                description = "Omega-rich salmon with herbs and crisp greens.",
                calories = 540,
                proteinGrams = 38,
                carbsGrams = 28,
                fatGrams = 30,
            ),
        ),
    )
}