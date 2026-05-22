package com.fitmealai.domain

enum class FitnessGoal { LoseWeight, BuildMuscle, StayFit, EatHealthier }
enum class SubscriptionTier { Free, Silver, Gold }
enum class MealType { Breakfast, Lunch, Dinner, Snack }

data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val goal: FitnessGoal,
    val tier: SubscriptionTier,
    val dailyCalorieTarget: Int,
)

data class Ingredient(
    val name: String,
    val grams: Int,
    val calories: Int,
    val proteinGrams: Int,
    val carbsGrams: Int,
    val fatGrams: Int,
)

data class Meal(
    val id: String,
    val type: MealType,
    val title: String,
    val calories: Int,
    val proteinGrams: Int,
    val carbsGrams: Int,
    val fatGrams: Int,
    val imageUrl: String? = null,
    val ingredients: List<Ingredient> = emptyList(),
)

data class MealPlan(
    val dateLabel: String,
    val meals: List<Meal>,
) {
    val totalCalories: Int get() = meals.sumOf { it.calories }
    val totalProtein: Int get() = meals.sumOf { it.proteinGrams }
}