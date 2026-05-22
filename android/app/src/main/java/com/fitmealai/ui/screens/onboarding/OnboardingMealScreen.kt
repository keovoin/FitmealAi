package com.fitmealai.ui.screens.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.MealPrefs
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.GridChoice
import com.fitmealai.ui.components.MultiSelectGrid
import com.fitmealai.ui.components.OnboardingStepIndicator
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SegmentedPicker
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

private val DIET_CHOICES = listOf(
    GridChoice("balanced", "Balanced", "⚖️"),
    GridChoice("high-protein", "High Protein", "🥩"),
    GridChoice("low-carb", "Low Carb", "🥦"),
    GridChoice("keto", "Keto", "🧀"),
    GridChoice("vegetarian", "Vegetarian", "🥕"),
    GridChoice("vegan", "Vegan", "🌱"),
    GridChoice("pescatarian", "Pescatarian", "🐟"),
    GridChoice("mediterranean", "Med", "🫒"),
)

private val TIMING_CHOICES = listOf(
    GridChoice("breakfast", "Breakfast", "☀️"),
    GridChoice("lunch", "Lunch", "🥗"),
    GridChoice("dinner", "Dinner", "🌙"),
    GridChoice("snack", "Snack", "🍎"),
)

private val ALLERGY_CHOICES = listOf(
    GridChoice("nuts", "Nuts", "🥜"),
    GridChoice("dairy", "Dairy", "🥛"),
    GridChoice("eggs", "Eggs", "🥚"),
    GridChoice("gluten", "Gluten", "🌾"),
    GridChoice("shellfish", "Shellfish", "🦐"),
    GridChoice("soy", "Soy", "🌱"),
)

@Composable
fun OnboardingMealScreen(
    initial: MealPrefs,
    onContinue: (MealPrefs) -> Unit,
    onBack: () -> Unit,
) {
    var diets by remember { mutableStateOf(initial.diets) }
    var timings by remember { mutableStateOf(initial.timings) }
    var cookTime by remember { mutableStateOf(initial.cookTime) }
    var allergies by remember { mutableStateOf(initial.allergies) }

    ScreenContainer {
        TopBar(title = "Meal preferences", subtitle = "Step 3 of 3", onBack = onBack)
        OnboardingStepIndicator(currentStep = 2, totalSteps = 3)
        Spacer(Modifier.height(FitMealSpacing.small))
        Text(
            "Tell us how you like to eat",
            color = FitMealColors.TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "We'll respect your diets and avoid every allergy in this list.",
            color = FitMealColors.TextSecondary,
        )

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-meal-diets")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Diets", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = DIET_CHOICES,
                    selected = diets,
                    columns = 4,
                    onToggle = { id -> diets = if (id in diets) diets - id else diets + id },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-meal-timings")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Meals per day", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = TIMING_CHOICES,
                    selected = timings,
                    columns = 4,
                    onToggle = { id -> timings = if (id in timings) timings - id else timings + id },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-meal-cooktime")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Time to cook", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.mealCookTimes,
                    selected = cookTime,
                    onSelect = { cookTime = it },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-meal-allergies")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Allergies (optional)", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = ALLERGY_CHOICES,
                    selected = allergies,
                    columns = 3,
                    onToggle = { id -> allergies = if (id in allergies) allergies - id else allergies + id },
                )
            }
        }

        PrimaryGradientButton(
            title = "Finish setup",
            tag = "android-onboarding-meal-continue",
            enabled = diets.isNotEmpty() && timings.isNotEmpty(),
        ) {
            onContinue(
                MealPrefs(diets = diets, timings = timings, cookTime = cookTime, allergies = allergies),
            )
        }
    }
}
