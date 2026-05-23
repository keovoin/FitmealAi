package com.fitmealai.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.domain.AppColorScheme
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.AppState
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SecondaryGlassButton
import com.fitmealai.ui.components.TagPill
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

@Composable
fun SettingsScreen(state: AppState) {
    val tier by state.tier.collectAsState()
    val session by state.session.collectAsState()
    val colorScheme by state.colorScheme.collectAsState()
    val notificationPrefs by state.notificationPrefs.collectAsState()
    val referralStats by state.referralStats.collectAsState()
    val workout = state.preferencesStore.workoutPrefs
    val meal = state.preferencesStore.mealPrefs

    ScreenContainer(modifier = Modifier.testTag("android-settings-screen")) {
        TopBar(title = "Settings", subtitle = session?.email ?: "Not signed in")

        // Plan card
        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-settings-plan-card")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text(
                    "FitMeal ${tier.displayName}",
                    color = FitMealColors.TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    when (tier) {
                        SubscriptionTier.Free -> "Tap to upgrade"
                        SubscriptionTier.Silver -> "Cancel anytime"
                        SubscriptionTier.Gold -> "All features unlocked"
                    },
                    color = FitMealColors.TextSecondary,
                )
                if (tier == SubscriptionTier.Free) {
                    PrimaryGradientButton(title = "View plans", tag = "android-settings-paywall-button") {
                        state.showSheet(AppSheet.Paywall)
                    }
                }
            }
        }

        // Workout settings
        GlassCard(
            modifier = Modifier.fillMaxWidth().testTag("android-settings-workout-button"),
            onClick = { state.showSheet(AppSheet.WorkoutSettings) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Workout preferences", color = FitMealColors.TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "${workout.types.size} types · ${workout.days} · ${workout.duration}",
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    workout.types.take(4).forEach { TagPill(it) }
                }
            }
        }

        // Meal settings
        GlassCard(
            modifier = Modifier.fillMaxWidth().testTag("android-settings-meal-button"),
            onClick = { state.showSheet(AppSheet.MealSettings) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Meal preferences", color = FitMealColors.TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    "${meal.diets.size} diets · ${meal.timings.size} slots · ${meal.cookTime}",
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    meal.diets.take(4).forEach { TagPill(it) }
                }
            }
        }

        // Notifications row
        GlassCard(
            modifier = Modifier.fillMaxWidth().testTag("android-settings-notifications-button"),
            onClick = { state.showSheet(AppSheet.NotificationSettings) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Notifications", color = FitMealColors.TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    notificationSummary(notificationPrefs),
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
            }
        }

        // Referrals row
        GlassCard(
            modifier = Modifier.fillMaxWidth().testTag("android-settings-referrals-button"),
            onClick = { state.showSheet(AppSheet.Referrals) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Refer & earn", color = FitMealColors.TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    when {
                        referralStats.code == null -> "Open to generate your code"
                        referralStats.rewarded -> "Reward earned · 30 days Gold"
                        else -> "${referralStats.verified}/${referralStats.target.coerceAtLeast(1)} verified"
                    },
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
            }
        }

        // Theme picker row
        GlassCard(
            modifier = Modifier.fillMaxWidth().testTag("android-settings-theme-button"),
            onClick = { state.showSheet(AppSheet.ThemePicker) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Appearance", color = FitMealColors.TextPrimary, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Text(
                    when (colorScheme) {
                        AppColorScheme.System -> "System default"
                        AppColorScheme.Dark -> "Dark"
                        AppColorScheme.Light -> "Light"
                    },
                    color = FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
            }
        }

        // ABA payment shortcut
        SecondaryGlassButton(
            title = "Submit ABA payment",
            tag = "android-settings-aba-button",
        ) { state.showSheet(AppSheet.AbaPayment) }

        SecondaryGlassButton(
            title = "Sign out",
            tag = "android-settings-signout-button",
        ) { state.signOut() }

        Text(
            "FitMeal AI v0.3.0 (Android A5)",
            color = FitMealColors.TextTertiary,
            fontSize = 11.sp,
        )

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

/**
 * One-line summary of which notification toggles are on. Mirrors the
 * iOS pattern of "Daily reminders on" / "All off" / "X of 6 enabled".
 */
private fun notificationSummary(prefs: com.fitmealai.domain.NotificationPrefs): String {
    val flags = listOf(
        prefs.mealPlanReady,
        prefs.paymentApproved,
        prefs.waterReminder,
        prefs.workoutReminder,
        prefs.habitStreak,
        prefs.weeklySummary,
    )
    val on = flags.count { it }
    val telegram = if (prefs.telegramLinked) " · Telegram linked" else ""
    return when (on) {
        0 -> "All notifications off$telegram"
        flags.size -> "All notifications on$telegram"
        else -> "$on of ${flags.size} enabled$telegram"
    }
}
