package com.fitmealai.domain

// ---------------------------------------------------------------------------
// Enums (mirror iOS Core/Models)
// ---------------------------------------------------------------------------

enum class FitnessGoal(val apiValue: String, val label: String, val emoji: String) {
    LoseWeight("lose_weight", "Lose Weight", "🔥"),
    BuildMuscle("build_muscle", "Build Muscle", "💪"),
    StayFit("stay_fit", "Stay Fit", "⚡"),
    EatHealthier("eat_healthier", "Eat Healthier", "🥗"),
}

enum class SubscriptionTier(val displayName: String) {
    Free("Free"),
    Silver("Silver"),
    Gold("Gold"),
}

enum class MealType(val apiValue: String, val label: String) {
    Breakfast("breakfast", "Breakfast"),
    Lunch("lunch", "Lunch"),
    Dinner("dinner", "Dinner"),
    Snack("snack", "Snack"),
}

enum class PaymentStatus(val apiValue: String) {
    Draft("draft"),
    Pending("pending"),
    Approved("approved"),
    Rejected("rejected"),
}

// ---------------------------------------------------------------------------
// Profile + auth
// ---------------------------------------------------------------------------

data class UserProfile(
    val id: String,
    val name: String,
    val email: String,
    val goal: FitnessGoal,
    val tier: SubscriptionTier,
    val dailyCalorieTarget: Int,
)

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

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
    val description: String? = null,
    val calories: Int,
    val proteinGrams: Int,
    val carbsGrams: Int,
    val fatGrams: Int,
    val imageUrl: String? = null,
    val ingredients: List<Ingredient> = emptyList(),
    val recipeSteps: List<String> = emptyList(),
)

data class MealPlan(
    val dateLabel: String,
    val meals: List<Meal>,
) {
    val totalCalories: Int get() = meals.sumOf { it.calories }
    val totalProtein: Int get() = meals.sumOf { it.proteinGrams }
    val totalCarbs: Int get() = meals.sumOf { it.carbsGrams }
    val totalFat: Int get() = meals.sumOf { it.fatGrams }
}

// ---------------------------------------------------------------------------
// Workout
// ---------------------------------------------------------------------------

data class Exercise(
    val id: String,
    val name: String,
    val sets: Int,
    val reps: Int,
    val restSeconds: Int,
    val notes: String? = null,
)

data class WorkoutPlan(
    val title: String,
    val estimatedMinutes: Int,
    val exercises: List<Exercise>,
)

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------

data class Habit(
    val id: String,
    val title: String,
    val emoji: String,
    val streakDays: Int,
    val isCompleted: Boolean = false,
)

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

data class MealPrefs(
    val diets: Set<String>,
    val timings: Set<String>,
    val cookTime: String,
    val allergies: Set<String>,
) {
    companion object {
        val Default = MealPrefs(
            diets = setOf("balanced"),
            timings = setOf("breakfast", "lunch", "dinner"),
            cookTime = "30 min",
            allergies = emptySet(),
        )
    }
}

data class WorkoutPrefs(
    val types: Set<String>,
    val days: String,
    val duration: String,
) {
    companion object {
        val Default = WorkoutPrefs(
            types = setOf("strength", "cardio"),
            days = "3-4 days",
            duration = "30-45 min",
        )
    }
}

// ---------------------------------------------------------------------------
// Subscriptions + payments
// ---------------------------------------------------------------------------

data class SubscriptionPlan(
    val tier: SubscriptionTier,
    val priceLabel: String,
    val tagline: String,
    val perks: List<String>,
    val highlight: Boolean = false,
)

data class PaymentRequest(
    val id: String? = null,
    val tier: SubscriptionTier,
    val amount: String,
    val transactionId: String = "",
    val screenshotFileName: String? = null,
    val status: PaymentStatus = PaymentStatus.Draft,
    val submittedAt: Long? = null,
)
