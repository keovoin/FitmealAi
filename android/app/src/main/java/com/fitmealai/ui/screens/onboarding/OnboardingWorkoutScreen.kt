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
import com.fitmealai.domain.WorkoutPrefs
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

private val WORKOUT_TYPES = listOf(
    GridChoice("strength", "Strength", "🏋️"),
    GridChoice("cardio", "Cardio", "🏃"),
    GridChoice("hiit", "HIIT", "🔥"),
    GridChoice("yoga", "Yoga", "🧘"),
    GridChoice("mobility", "Mobility", "🤸"),
    GridChoice("sports", "Sports", "⚽"),
)

@Composable
fun OnboardingWorkoutScreen(
    initial: WorkoutPrefs,
    onContinue: (WorkoutPrefs) -> Unit,
    onBack: () -> Unit,
) {
    var types by remember { mutableStateOf(initial.types) }
    var days by remember { mutableStateOf(initial.days) }
    var duration by remember { mutableStateOf(initial.duration) }

    ScreenContainer {
        TopBar(title = "Workout style", subtitle = "Step 2 of 3", onBack = onBack)
        OnboardingStepIndicator(currentStep = 1, totalSteps = 3)
        Spacer(Modifier.height(FitMealSpacing.small))
        Text(
            "Pick what you enjoy",
            color = FitMealColors.TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Select all the workout styles you'd like FitMeal to mix into your plan.",
            color = FitMealColors.TextSecondary,
        )

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-workout-types")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text(
                    "Workout types",
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium,
                )
                MultiSelectGrid(
                    items = WORKOUT_TYPES,
                    selected = types,
                    columns = 3,
                    onToggle = { id ->
                        types = if (id in types) types - id else types + id
                    },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-workout-days")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Days per week", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.workoutDayChoices,
                    selected = days,
                    onSelect = { days = it },
                )
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-workout-duration")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text("Session length", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                SegmentedPicker(
                    options = MockData.workoutDurationChoices,
                    selected = duration,
                    onSelect = { duration = it },
                )
            }
        }

        PrimaryGradientButton(
            title = "Continue",
            tag = "android-onboarding-workout-continue",
            enabled = types.isNotEmpty(),
        ) {
            onContinue(WorkoutPrefs(types = types, days = days, duration = duration))
        }
    }
}
