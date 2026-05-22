package com.fitmealai.ui.screens.settings

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
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.data.PreferencesStore
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.WorkoutPrefs
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.GridChoice
import com.fitmealai.ui.components.MultiSelectGrid
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SegmentedPicker
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

private val WORKOUT_TYPES = listOf(
    GridChoice("strength", "Strength", "🏋️"),
    GridChoice("cardio", "Cardio", "🏃"),
    GridChoice("hiit", "HIIT", "🔥"),
    GridChoice("yoga", "Yoga", "🧘"),
    GridChoice("mobility", "Mobility", "🤸"),
    GridChoice("sports", "Sports", "⚽"),
)

private val DIET_CHOICES = listOf(
    GridChoice("balanced", "Balanced", "⚖️"),
    GridChoice("high-protein", "High Protein", "🥩"),
    GridChoice("low-carb", "Low Carb", "🥦"),
    GridChoice("keto", "Keto", "🧀"),
    GridChoice("vegetarian", "Vegetarian", "🥕"),
    GridChoice("vegan", "Vegan", "🌱"),
)

private val ALLERGY_CHOICES = listOf(
    GridChoice("nuts", "Nuts", "🥜"),
    GridChoice("dairy", "Dairy", "🥛"),
    GridChoice("eggs", "Eggs", "🥚"),
    GridChoice("gluten", "Gluten", "🌾"),
)

@Composable
fun SettingsWorkoutSheet(store: PreferencesStore, onDone: () -> Unit) {
    var prefs by remember { mutableStateOf(store.workoutPrefs) }

    ScreenContainer(modifier = Modifier.testTag("android-settings-workout-sheet")) {
        TopBar(title = "Workout preferences", onBack = onDone)

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Types", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = WORKOUT_TYPES,
                    selected = prefs.types,
                    columns = 3,
                    onToggle = { id ->
                        prefs = prefs.copy(types = if (id in prefs.types) prefs.types - id else prefs.types + id)
                    },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Days per week", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.workoutDayChoices,
                    selected = prefs.days,
                    onSelect = { prefs = prefs.copy(days = it) },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Session length", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.workoutDurationChoices,
                    selected = prefs.duration,
                    onSelect = { prefs = prefs.copy(duration = it) },
                )
            }
        }

        PrimaryGradientButton(title = "Save", tag = "android-settings-workout-save") {
            store.saveWorkoutPrefs(prefs)
            onDone()
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
fun SettingsMealSheet(store: PreferencesStore, onDone: () -> Unit) {
    var prefs by remember { mutableStateOf(store.mealPrefs) }

    ScreenContainer(modifier = Modifier.testTag("android-settings-meal-sheet")) {
        TopBar(title = "Meal preferences", onBack = onDone)

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Diets", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = DIET_CHOICES,
                    selected = prefs.diets,
                    columns = 3,
                    onToggle = { id ->
                        prefs = prefs.copy(diets = if (id in prefs.diets) prefs.diets - id else prefs.diets + id)
                    },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Cook time", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.mealCookTimes,
                    selected = prefs.cookTime,
                    onSelect = { prefs = prefs.copy(cookTime = it) },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Allergies", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                MultiSelectGrid(
                    items = ALLERGY_CHOICES,
                    selected = prefs.allergies,
                    columns = 4,
                    onToggle = { id ->
                        prefs = prefs.copy(allergies = if (id in prefs.allergies) prefs.allergies - id else prefs.allergies + id)
                    },
                )
            }
        }

        PrimaryGradientButton(
            title = "Save",
            tag = "android-settings-meal-save",
            enabled = prefs.diets.isNotEmpty(),
        ) {
            // Default MealPrefs uses three timings; we don't edit timings here, just diet/cook/allergy.
            store.saveMealPrefs(MealPrefs(
                diets = prefs.diets,
                timings = prefs.timings.ifEmpty { MealPrefs.Default.timings },
                cookTime = prefs.cookTime,
                allergies = prefs.allergies,
            ))
            onDone()
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

private fun <T> Set<T>.ifEmpty(default: () -> Set<T>): Set<T> =
    if (this.isEmpty()) default() else this
