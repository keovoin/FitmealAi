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
import com.fitmealai.domain.FitnessGoal
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.GridChoice
import com.fitmealai.ui.components.MultiSelectGrid
import com.fitmealai.ui.components.OnboardingStepIndicator
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

@Composable
fun OnboardingGoalScreen(
    onContinue: (FitnessGoal) -> Unit,
    onBack: () -> Unit,
) {
    var selected by remember { mutableStateOf<FitnessGoal?>(null) }

    ScreenContainer {
        TopBar(title = "Your goal", subtitle = "Step 1 of 3", onBack = onBack)
        OnboardingStepIndicator(currentStep = 0, totalSteps = 3)

        Spacer(Modifier.height(FitMealSpacing.small))
        Text(
            "What outcome are you aiming for?",
            color = FitMealColors.TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "We tune the AI plan to your goal so the meals and workouts move you in the right direction.",
            color = FitMealColors.TextSecondary,
        )

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-onboarding-goal-card")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.medium)) {
                MultiSelectGrid(
                    items = FitnessGoal.entries.map { goal ->
                        GridChoice(
                            id = goal.apiValue,
                            label = goal.label,
                            emoji = goal.emoji,
                        )
                    },
                    selected = setOfNotNull(selected?.apiValue),
                    columns = 2,
                    onToggle = { id ->
                        selected = FitnessGoal.entries.firstOrNull { it.apiValue == id }
                    },
                )
            }
        }

        PrimaryGradientButton(
            title = "Continue",
            tag = "android-onboarding-goal-continue",
            enabled = selected != null,
        ) { selected?.let(onContinue) }
    }
}
