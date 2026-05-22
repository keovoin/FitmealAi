package com.fitmealai.ui.screens.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.ui.AppState
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.MainTab
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(state: AppState) {
    val tier by state.tier.collectAsState()
    var mealPlan by remember { mutableStateOf<MealPlan>(MockData.mealPlan) }
    var isRegenerating by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    val greeting = remember {
        val hour = java.time.LocalTime.now().hour
        when (hour) {
            in 5..11 -> "Good morning"
            in 12..16 -> "Good afternoon"
            in 17..21 -> "Good evening"
            else -> "Hello"
        }
    }

    val calorieGoal = MockData.user.dailyCalorieTarget
    val consumed = mealPlan.totalCalories
    val ratio = if (calorieGoal > 0) (consumed.toFloat() / calorieGoal).coerceIn(0f, 1f) else 0f
    val remaining = (calorieGoal - consumed).coerceAtLeast(0)

    ScreenContainer(modifier = Modifier.testTag("android-home-screen")) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                "$greeting, ${MockData.user.name}",
                color = FitMealColors.TextPrimary,
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                java.time.LocalDate.now().format(
                    java.time.format.DateTimeFormatter.ofPattern("EEEE, MMM d"),
                ),
                color = FitMealColors.TextSecondary,
                fontSize = 13.sp,
            )
        }

        // Calorie ring card
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.large),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Box(
                    modifier = Modifier.size(96.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(
                        progress = { ratio },
                        modifier = Modifier.size(96.dp),
                        strokeWidth = 8.dp,
                        color = FitMealColors.AccentPurple,
                        trackColor = FitMealColors.GlassStroke,
                    )
                    Text(
                        "${(ratio * 100).toInt()}%",
                        color = FitMealColors.TextPrimary,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                    )
                }
                Column {
                    Text("Today's calories", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                    Text(
                        "$consumed / $calorieGoal",
                        color = FitMealColors.TextPrimary,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text("$remaining kcal remaining", color = FitMealColors.SuccessGreen, fontSize = 13.sp)
                }
            }
        }

        // Quick links
        SummaryLink(
            label = "Meals",
            title = mealPlan.meals.firstOrNull()?.let { "${it.type.label}: ${it.title}" } ?: "Plan is empty",
            detail = "${mealPlan.meals.size} meals planned",
            tint = FitMealColors.AccentPurple,
            tag = "android-home-meals-link",
        ) { state.selectTab(MainTab.Meals) }

        SummaryLink(
            label = "Workout",
            title = MockData.workout.title,
            detail = "${MockData.workout.estimatedMinutes} min · ${MockData.workout.exercises.size} exercises",
            tint = FitMealColors.AccentBlue,
            tag = "android-home-workout-link",
        ) { state.selectTab(MainTab.Workout) }

        SummaryLink(
            label = "Habits",
            title = "${MockData.habits.count { it.isCompleted }} of ${MockData.habits.size} done today",
            detail = "Tap to mark them off",
            tint = FitMealColors.SuccessGreen,
            tag = "android-home-habits-link",
        ) { state.selectTab(MainTab.Habits) }

        if (tier == SubscriptionTier.Free) {
            UpgradeBanner { state.showSheet(AppSheet.Paywall) }
        }

        if (error != null) {
            Text(error!!, color = FitMealColors.ErrorRed, fontSize = 12.sp)
        }

        PrimaryGradientButton(
            title = if (isRegenerating) "Regenerating…" else "Regenerate today's plan",
            isLoading = isRegenerating,
            tag = "android-home-regenerate-button",
        ) {
            val session = state.session.value
            if (session == null) {
                error = "Sign in before generating a live AI plan."
                return@PrimaryGradientButton
            }
            scope.launch {
                isRegenerating = true
                error = null
                try {
                    val plan = state.aiRepository.generateMealPlan(
                        session = session,
                        goal = MockData.user.goal.apiValue,
                        calorieTarget = MockData.user.dailyCalorieTarget,
                        diets = state.preferencesStore.mealPrefs.diets.toList().sorted(),
                        allergies = state.preferencesStore.mealPrefs.allergies.toList().sorted(),
                        cookTime = state.preferencesStore.mealPrefs.cookTime,
                        mealTypes = state.preferencesStore.mealPrefs.timings.toList().sorted(),
                    )
                    mealPlan = plan
                } catch (t: Throwable) {
                    error = t.message ?: "AI request failed"
                } finally {
                    isRegenerating = false
                }
            }
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
private fun SummaryLink(
    label: String,
    title: String,
    detail: String,
    tint: androidx.compose.ui.graphics.Color,
    tag: String,
    onClick: () -> Unit,
) {
    GlassCard(
        modifier = Modifier.fillMaxWidth().testTag(tag),
        onClick = onClick,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.medium)) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(tint.copy(alpha = 0.85f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(label.first().toString(), color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(label, color = FitMealColors.TextSecondary, fontSize = 11.sp)
                Text(
                    title,
                    color = FitMealColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    maxLines = 1,
                )
                Text(detail, color = FitMealColors.TextSecondary, fontSize = 12.sp)
            }
            Text("›", color = FitMealColors.TextTertiary, fontSize = 22.sp)
        }
    }
}

@Composable
private fun UpgradeBanner(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(FitMealRadius.card))
            .background(FitMealColors.GlassFill)
            .border(
                width = 1.dp,
                color = FitMealColors.GoldStart.copy(alpha = 0.5f),
                shape = RoundedCornerShape(FitMealRadius.card),
            )
            .padding(FitMealSpacing.medium)
            .testTag("android-home-upgrade-banner"),
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.medium),
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(FitMealBrushes.Gold),
                contentAlignment = Alignment.Center,
            ) {
                Text("✨", fontSize = 20.sp)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    "Unlock Gold",
                    color = FitMealColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "Unlimited regenerations, advanced analytics",
                    color = FitMealColors.TextSecondary,
                    fontSize = 12.sp,
                )
            }
            Text(
                "Tap",
                color = FitMealColors.GoldStart,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .clickable(onClick = onClick)
                    .padding(8.dp),
            )
        }
    }
}
