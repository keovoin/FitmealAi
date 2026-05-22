package com.fitmealai.ui.screens.meals

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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.AppState
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SegmentedPicker
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.launch

private val DAY_TABS = listOf("Today", "Tomorrow", "Weekly")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MealPlanScreen(state: AppState) {
    var selectedTab by remember { mutableStateOf("Today") }
    var todayPlan by remember { mutableStateOf<MealPlan>(MockData.mealPlan) }
    val tomorrowPlan = remember { MockData.mealPlan.copy(dateLabel = "Tomorrow") }
    var inspected by remember { mutableStateOf<Meal?>(null) }
    var isRegenerating by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val tier by state.tier.collectAsState()
    val isWeeklyLocked = tier == SubscriptionTier.Free

    val visiblePlan = when (selectedTab) {
        "Today" -> todayPlan
        "Tomorrow" -> tomorrowPlan
        else -> todayPlan
    }

    ScreenContainer(modifier = Modifier.testTag("android-meals-screen")) {
        TopBar(title = "Meal plan", subtitle = "AI-curated for ${MockData.user.goal.label.lowercase()}")

        SegmentedPicker(
            options = DAY_TABS,
            selected = selectedTab,
            onSelect = { selectedTab = it },
        )

        if (selectedTab == "Weekly" && isWeeklyLocked) {
            GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-meals-weekly-lock")) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Weekly plans are a Silver perk",
                        color = FitMealColors.TextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Text(
                        "Upgrade to see all 7 days at a glance, with macros rolled up.",
                        color = FitMealColors.TextSecondary,
                        fontSize = 13.sp,
                    )
                    PrimaryGradientButton(title = "Upgrade", tag = "android-meals-weekly-upgrade") {
                        state.showSheet(AppSheet.Paywall)
                    }
                }
            }
        } else {
            // Totals card
            GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-meals-totals")) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        "${visiblePlan.totalCalories} kcal · ${visiblePlan.totalProtein}g protein",
                        color = FitMealColors.TextPrimary,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "Carbs ${visiblePlan.totalCarbs}g · Fat ${visiblePlan.totalFat}g",
                        color = FitMealColors.TextSecondary,
                    )
                }
            }

            visiblePlan.meals.forEach { meal ->
                MealRow(meal = meal, onClick = { inspected = meal })
            }

            if (error != null) {
                Text(error!!, color = FitMealColors.ErrorRed, fontSize = 12.sp)
            }

            PrimaryGradientButton(
                title = if (isRegenerating) "Regenerating…" else "Regenerate today's plan",
                isLoading = isRegenerating,
                tag = "android-meals-regenerate-button",
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
                        todayPlan = plan
                        selectedTab = "Today"
                    } catch (t: Throwable) {
                        error = t.message ?: "AI request failed"
                    } finally {
                        isRegenerating = false
                    }
                }
            }
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }

    if (inspected != null) {
        ModalBottomSheet(
            onDismissRequest = { inspected = null },
            containerColor = FitMealColors.GradientMid,
        ) {
            IngredientSheetContent(meal = inspected!!)
        }
    }
}

@Composable
private fun MealRow(meal: Meal, onClick: () -> Unit) {
    GlassCard(
        modifier = Modifier.fillMaxWidth().testTag("android-meal-row-${meal.id}"),
        onClick = onClick,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                meal.type.label.uppercase(),
                color = FitMealColors.AccentPurple,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
            )
            Text(
                meal.title,
                color = FitMealColors.TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.SemiBold,
            )
            meal.description?.let {
                Text(it, color = FitMealColors.TextSecondary, fontSize = 13.sp)
            }
            Text(
                "${meal.calories} kcal · ${meal.proteinGrams}g P · ${meal.carbsGrams}g C · ${meal.fatGrams}g F",
                color = FitMealColors.TextTertiary,
                fontSize = 12.sp,
            )
        }
    }
}

@Composable
private fun IngredientSheetContent(meal: Meal) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(FitMealSpacing.large),
        verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        Text(
            meal.type.label.uppercase(),
            color = FitMealColors.AccentPurple,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            meal.title,
            color = FitMealColors.TextPrimary,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
        )
        meal.description?.let {
            Text(it, color = FitMealColors.TextSecondary)
        }
        Spacer(Modifier.height(FitMealSpacing.small))
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(FitMealRadius.medium))
                .background(FitMealColors.GlassFillSoft)
                .border(
                    width = 1.dp,
                    color = FitMealColors.GlassStrokeSoft,
                    shape = RoundedCornerShape(FitMealRadius.medium),
                )
                .padding(FitMealSpacing.medium),
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                MacroBadge("Calories", "${meal.calories}")
                MacroBadge("Protein", "${meal.proteinGrams}g")
                MacroBadge("Carbs", "${meal.carbsGrams}g")
                MacroBadge("Fat", "${meal.fatGrams}g")
            }
        }

        if (meal.ingredients.isNotEmpty()) {
            Spacer(Modifier.height(FitMealSpacing.small))
            Text("Ingredients", color = FitMealColors.TextPrimary, fontWeight = FontWeight.Bold)
            meal.ingredients.forEach { ing ->
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(ing.name, color = FitMealColors.TextSecondary)
                    Text("${ing.grams}g", color = FitMealColors.TextTertiary)
                }
            }
        }

        if (meal.recipeSteps.isNotEmpty()) {
            Spacer(Modifier.height(FitMealSpacing.small))
            Text("Recipe", color = FitMealColors.TextPrimary, fontWeight = FontWeight.Bold)
            meal.recipeSteps.forEachIndexed { idx, step ->
                Text("${idx + 1}. $step", color = FitMealColors.TextSecondary)
            }
        }
    }
}

@Composable
private fun MacroBadge(label: String, value: String) {
    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
        Text(label.uppercase(), color = FitMealColors.TextTertiary, fontSize = 10.sp)
        Text(value, color = FitMealColors.TextPrimary, fontWeight = FontWeight.SemiBold)
    }
}
