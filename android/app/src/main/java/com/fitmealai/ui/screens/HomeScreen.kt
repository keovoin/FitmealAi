package com.fitmealai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors

private enum class AndroidTab(val label: String) { Home("Home"), Meals("Meals"), Workout("Workout"), Habits("Habits"), Progress("Progress") }

@Composable
fun HomeScreen() {
    var selectedTab by remember { mutableStateOf(AndroidTab.Home) }

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
                Text("Hi ${MockData.user.name}, Android A1 is ready for the next porting phase.", color = FitMealColors.TextSecondary)
            }
            item { SummaryCard() }
            items(MockData.mealPlan.meals) { meal -> MealRow(meal) }
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