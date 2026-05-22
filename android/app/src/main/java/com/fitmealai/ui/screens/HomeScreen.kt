package com.fitmealai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.Meal
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.config.AppConfig

private enum class AndroidTab(val label: String) { Home("Home"), Meals("Meals"), Workout("Workout"), Habits("Habits"), Progress("Progress"), Settings("Settings") }

@Composable
fun HomeScreen() {
    var selectedTab by remember { mutableStateOf(AndroidTab.Home) }
    val config = remember { AppConfig() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
            .padding(horizontal = 20.dp, vertical = 18.dp)
            .testTag("android-main-shell"),
    ) {
        LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item {
                Text(
                    text = selectedTab.label,
                    color = FitMealColors.TextPrimary,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.testTag("android-main-title"),
                )
                Text("Hi ${MockData.user.name}, your FitMeal plan is ready.", color = FitMealColors.TextSecondary)
            }
            when (selectedTab) {
                AndroidTab.Home -> homeContent(config)
                AndroidTab.Meals -> mealsContent()
                AndroidTab.Workout -> workoutContent()
                AndroidTab.Habits -> habitsContent()
                AndroidTab.Progress -> progressContent()
                AndroidTab.Settings -> settingsContent(config)
            }
        }

        NavigationBar(containerColor = FitMealColors.GlassFill, modifier = Modifier.testTag("android-bottom-nav")) {
            AndroidTab.entries.forEach { tab ->
                NavigationBarItem(
                    selected = selectedTab == tab,
                    onClick = { selectedTab = tab },
                    label = { Text(tab.label) },
                    icon = { Text(tab.label.first().toString()) },
                    modifier = Modifier.testTag("android-tab-${tab.label.lowercase()}"),
                )
            }
        }
    }
}

private fun androidx.compose.foundation.lazy.LazyListScope.homeContent(config: AppConfig) {
    item { ConfigCard(config) }
    item { SummaryCard() }
    item { PaywallCard() }
    items(MockData.mealPlan.meals.take(2)) { meal -> MealRow(meal) }
}

private fun androidx.compose.foundation.lazy.LazyListScope.mealsContent() {
    item { SummaryCard() }
    items(MockData.mealPlan.meals) { meal -> MealRow(meal) }
    item {
        PrimaryGradientButton(title = "Generate today's AI plan", tag = "android-meals-generate-button") {}
    }
}

private fun androidx.compose.foundation.lazy.LazyListScope.workoutContent() {
    item {
        FeatureCard("Strength + mobility", "45 min • Upper body • Gold intensity", "Start workout", "android-workout-start-button")
    }
    item {
        FeatureCard("Recovery yoga", "18 min • Stretch and breathing", "Open recovery", "android-workout-recovery-button")
    }
}

private fun androidx.compose.foundation.lazy.LazyListScope.habitsContent() {
    item { HabitCard("Drink water", "5 / 8 glasses") }
    item { HabitCard("10k steps", "7,240 steps") }
    item { HabitCard("Sleep by 11 PM", "On track") }
}

private fun androidx.compose.foundation.lazy.LazyListScope.progressContent() {
    item { FeatureCard("Weekly progress", "Calories steady • Protein +12% • Workouts 4/5", "View insights", "android-progress-insights-button") }
    item { FeatureCard("Body metrics", "Weight, photos, and habit streaks will sync after Supabase setup.", "Add metric", "android-progress-add-metric-button") }
}

private fun androidx.compose.foundation.lazy.LazyListScope.settingsContent(config: AppConfig) {
    item { ConfigCard(config) }
    item { FeatureCard("Meal preferences", "Diet, allergies, cook time, meal timing", "Edit meals", "android-settings-meals-button") }
    item { FeatureCard("Workout preferences", "Type, days, duration, equipment", "Edit workout", "android-settings-workout-button") }
    item { FeatureCard("ABA payment", "Manual payment request and receipt upload will connect in A4.", "Open payment", "android-settings-payment-button") }
}

@Composable
private fun SummaryCard() {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Today's plan", color = FitMealColors.TextPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Text("${MockData.mealPlan.totalCalories} kcal", color = FitMealColors.TextSecondary)
                Text("${MockData.mealPlan.totalProtein}g protein", color = FitMealColors.TextSecondary)
            }
        }
    }
}

@Composable
private fun ConfigCard(config: AppConfig) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Configuration", color = FitMealColors.TextPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            StatusRow("Supabase", config.isSupabaseReady)
            StatusRow("AI API", config.isApiReady)
            StatusRow("Google", config.isGoogleReady)
        }
    }
}

@Composable
private fun StatusRow(label: String, ready: Boolean) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = FitMealColors.TextSecondary)
        Text(if (ready) "Ready" else "Missing", color = if (ready) FitMealColors.SuccessGreen else FitMealColors.TextSecondary)
    }
}

@Composable
private fun PaywallCard() {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Upgrade to Gold", color = FitMealColors.TextPrimary, fontWeight = FontWeight.Bold, fontSize = 20.sp)
            Text("Weekly AI meal plans, richer workouts, progress insights, and priority regeneration.", color = FitMealColors.TextSecondary)
            PrimaryGradientButton(title = "Review Gold", tag = "android-paywall-button") {}
        }
    }
}

@Composable
private fun FeatureCard(title: String, subtitle: String, cta: String, tag: String) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, color = FitMealColors.TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(subtitle, color = FitMealColors.TextSecondary)
            PrimaryGradientButton(title = cta, tag = tag) {}
        }
    }
}

@Composable
private fun HabitCard(title: String, value: String) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Row {
                Box(
                    modifier = Modifier
                        .width(12.dp)
                        .height(12.dp)
                        .background(FitMealColors.SuccessGreen)
                )
                Spacer(Modifier.width(10.dp))
                Text(title, color = FitMealColors.TextPrimary, fontWeight = FontWeight.SemiBold)
            }
            Text(value, color = FitMealColors.TextSecondary)
        }
    }
}

@Composable
private fun MealRow(meal: Meal) {
    GlassCard(modifier = Modifier.fillMaxWidth()) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(meal.type.name, color = FitMealColors.AccentBlue, fontWeight = FontWeight.SemiBold)
            Text(meal.title, color = FitMealColors.TextPrimary, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(2.dp))
            Text("${meal.calories} kcal • ${meal.proteinGrams}g protein", color = FitMealColors.TextSecondary)
        }
    }
}