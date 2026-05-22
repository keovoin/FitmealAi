package com.fitmealai.ui.screens.workout

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.Exercise
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.delay

@Composable
fun WorkoutScreen() {
    val plan = MockData.workout
    var restRemaining by remember { mutableStateOf(0) }
    var isResting by remember { mutableStateOf(false) }

    LaunchedEffect(isResting) {
        if (isResting && restRemaining > 0) {
            while (isResting && restRemaining > 0) {
                delay(1000)
                restRemaining -= 1
            }
            if (restRemaining == 0) isResting = false
        }
    }

    ScreenContainer(modifier = Modifier.testTag("android-workout-screen")) {
        TopBar(title = plan.title, subtitle = "${plan.estimatedMinutes} min · ${plan.exercises.size} exercises")

        if (isResting) {
            GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-workout-rest-timer")) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("REST", color = FitMealColors.AccentPurple, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "${restRemaining}s",
                        color = FitMealColors.TextPrimary,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    PrimaryGradientButton(title = "Skip rest", tag = "android-workout-skip-rest") {
                        isResting = false
                        restRemaining = 0
                    }
                }
            }
        }

        plan.exercises.forEach { exercise ->
            ExerciseRow(
                exercise = exercise,
                onStartRest = {
                    restRemaining = exercise.restSeconds
                    isResting = true
                },
            )
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
private fun ExerciseRow(exercise: Exercise, onStartRest: () -> Unit) {
    GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-exercise-row-${exercise.id}")) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                exercise.name,
                color = FitMealColors.TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("${exercise.sets} × ${exercise.reps}", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                Text("${exercise.restSeconds}s rest", color = FitMealColors.TextTertiary, fontSize = 13.sp)
            }
            exercise.notes?.let {
                Text(it, color = FitMealColors.TextTertiary, fontSize = 12.sp)
            }
            PrimaryGradientButton(
                title = "Start rest timer",
                tag = "android-exercise-start-rest-${exercise.id}",
                onClick = onStartRest,
            )
        }
    }
}
