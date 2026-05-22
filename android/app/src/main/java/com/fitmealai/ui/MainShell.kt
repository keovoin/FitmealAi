package com.fitmealai.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.fitmealai.ui.screens.habits.HabitsScreen
import com.fitmealai.ui.screens.home.HomeScreen
import com.fitmealai.ui.screens.meals.MealPlanScreen
import com.fitmealai.ui.screens.payment.AbaPaymentScreen
import com.fitmealai.ui.screens.payment.PaymentPendingScreen
import com.fitmealai.ui.screens.paywall.PaywallScreen
import com.fitmealai.ui.screens.progress.ProgressScreen
import com.fitmealai.ui.screens.settings.SettingsMealSheet
import com.fitmealai.ui.screens.settings.SettingsScreen
import com.fitmealai.ui.screens.settings.SettingsWorkoutSheet
import com.fitmealai.ui.screens.workout.WorkoutScreen
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainShell(state: AppState) {
    val tab by state.selectedTab.collectAsState()
    val sheet by state.activeSheet.collectAsState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
            .testTag("android-main-shell"),
    ) {
        Box(modifier = Modifier.fillMaxSize().padding(bottom = 78.dp)) {
            when (tab) {
                MainTab.Home -> HomeScreen(state)
                MainTab.Meals -> MealPlanScreen(state)
                MainTab.Workout -> WorkoutScreen()
                MainTab.Habits -> HabitsScreen()
                MainTab.Progress -> ProgressScreen()
                MainTab.Settings -> SettingsScreen(state)
            }
        }

        NavigationBar(
            modifier = Modifier
                .align(androidx.compose.ui.Alignment.BottomCenter)
                .height(72.dp)
                .testTag("android-bottom-nav"),
            containerColor = FitMealColors.GlassFill,
            tonalElevation = 0.dp,
        ) {
            MainTab.entries.forEach { entry ->
                NavigationBarItem(
                    selected = entry == tab,
                    onClick = { state.selectTab(entry) },
                    icon = {
                        Icon(
                            imageVector = iconFor(entry),
                            contentDescription = entry.label,
                            modifier = Modifier.testTag("android-tab-icon-${entry.label.lowercase()}"),
                        )
                    },
                    label = { Text(entry.label) },
                    colors = NavigationBarItemDefaults.colors(
                        selectedIconColor = FitMealColors.AccentPurple,
                        selectedTextColor = FitMealColors.TextPrimary,
                        unselectedIconColor = FitMealColors.TextTertiary,
                        unselectedTextColor = FitMealColors.TextTertiary,
                        indicatorColor = Color.Transparent,
                    ),
                    modifier = Modifier.testTag("android-tab-${entry.label.lowercase()}"),
                )
            }
        }
    }

    if (sheet != null) {
        ModalBottomSheet(
            onDismissRequest = { state.showSheet(null) },
            containerColor = FitMealColors.GradientMid,
        ) {
            when (val s = sheet) {
                AppSheet.Paywall -> PaywallScreen(state, onClose = { state.showSheet(null) })
                AppSheet.AbaPayment -> AbaPaymentScreen(state, onClose = { state.showSheet(null) })
                is AppSheet.PaymentPending -> PaymentPendingScreen(
                    transactionId = s.transactionId,
                    amount = s.amount,
                    onDone = { state.showSheet(null) },
                )
                AppSheet.WorkoutSettings -> SettingsWorkoutSheet(
                    store = state.preferencesStore,
                    onDone = { state.showSheet(null) },
                )
                AppSheet.MealSettings -> SettingsMealSheet(
                    store = state.preferencesStore,
                    onDone = { state.showSheet(null) },
                )
                null -> Unit
            }
        }
    }
}

private fun iconFor(tab: MainTab): ImageVector = when (tab) {
    MainTab.Home -> Icons.Default.Home
    MainTab.Meals -> Icons.Default.Restaurant
    MainTab.Workout -> Icons.Default.FitnessCenter
    MainTab.Habits -> Icons.Default.Check
    MainTab.Progress -> Icons.Default.BarChart
    MainTab.Settings -> Icons.Default.Settings
}
