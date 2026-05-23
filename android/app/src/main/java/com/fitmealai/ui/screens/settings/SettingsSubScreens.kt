package com.fitmealai.ui.screens.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
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



// ===========================================================================
// Phase A5 sheets: Notifications / Referrals / Theme picker
// ===========================================================================

@androidx.compose.runtime.Composable
fun SettingsNotificationsSheet(state: com.fitmealai.ui.AppState, onDone: () -> Unit) {
    val prefs by state.notificationPrefs.collectAsState()
    val telegramEnabled = state.config.isTelegramReady
    val context = androidx.compose.ui.platform.LocalContext.current

    androidx.compose.runtime.LaunchedEffect(Unit) { state.refreshNotificationPrefs() }

    ScreenContainer(
        modifier = androidx.compose.ui.Modifier.testTag("android-settings-notifications-sheet"),
    ) {
        com.fitmealai.ui.components.TopBar(title = "Notifications", onBack = onDone)

        com.fitmealai.ui.components.GlassCard(modifier = androidx.compose.ui.Modifier.fillMaxWidth()) {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(2.dp),
            ) {
                NotificationToggleRow(
                    label = "Today's meal plan ready",
                    detail = "When the AI finishes a fresh plan",
                    value = prefs.mealPlanReady,
                    tag = "android-notif-meal_plan_ready",
                ) { state.updateNotificationPrefs(prefs.copy(mealPlanReady = it)) }
                NotificationToggleRow(
                    label = "Payment approved",
                    detail = "When admin approves your manual ABA receipt",
                    value = prefs.paymentApproved,
                    tag = "android-notif-payment_approved",
                ) { state.updateNotificationPrefs(prefs.copy(paymentApproved = it)) }
                NotificationToggleRow(
                    label = "Water reminder",
                    detail = "Hydration nudges through the day",
                    value = prefs.waterReminder,
                    tag = "android-notif-water_reminder",
                ) { state.updateNotificationPrefs(prefs.copy(waterReminder = it)) }
                NotificationToggleRow(
                    label = "Workout reminder",
                    detail = "Schedule-based reminders to move",
                    value = prefs.workoutReminder,
                    tag = "android-notif-workout_reminder",
                ) { state.updateNotificationPrefs(prefs.copy(workoutReminder = it)) }
                NotificationToggleRow(
                    label = "Habit streak milestones",
                    detail = "When you hit a 7/14/30-day streak",
                    value = prefs.habitStreak,
                    tag = "android-notif-habit_streak",
                ) { state.updateNotificationPrefs(prefs.copy(habitStreak = it)) }
                NotificationToggleRow(
                    label = "Weekly summary",
                    detail = "Sunday recap of the past 7 days",
                    value = prefs.weeklySummary,
                    tag = "android-notif-weekly_summary",
                ) { state.updateNotificationPrefs(prefs.copy(weeklySummary = it)) }
            }
        }

        // Telegram link row.
        com.fitmealai.ui.components.GlassCard(
            modifier = androidx.compose.ui.Modifier.fillMaxWidth().testTag("android-settings-telegram-row"),
        ) {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(6.dp),
            ) {
                androidx.compose.material3.Text(
                    if (prefs.telegramLinked) "Telegram connected" else "Mirror notifications to Telegram",
                    color = com.fitmealai.ui.theme.FitMealColors.TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                )
                androidx.compose.material3.Text(
                    if (prefs.telegramLinked)
                        "Tap below to re-link or remove from Telegram with /unlink."
                    else
                        "Open the FitMeal AI bot in Telegram with your account pre-filled.",
                    color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
                if (telegramEnabled) {
                    com.fitmealai.ui.components.SecondaryGlassButton(
                        title = if (prefs.telegramLinked) "Open Telegram bot" else "Link Telegram",
                        tag = "android-settings-telegram-link-button",
                    ) {
                        val url = state.telegramLinkUrl()
                        if (url == null) {
                            state.setToast("Sign in first to link Telegram.")
                        } else {
                            runCatching {
                                val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
                                intent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                                context.startActivity(intent)
                            }.onFailure {
                                state.setToast("Could not open Telegram. Install the app first.")
                            }
                        }
                    }
                } else {
                    androidx.compose.material3.Text(
                        "Telegram bot username not configured (FITMEAL_TELEGRAM_BOT_USERNAME).",
                        color = com.fitmealai.ui.theme.FitMealColors.TextTertiary,
                        fontSize = 11.sp,
                    )
                }
            }
        }

        Spacer(androidx.compose.ui.Modifier.height(FitMealSpacing.large))
    }
}

@androidx.compose.runtime.Composable
private fun NotificationToggleRow(
    label: String,
    detail: String,
    value: Boolean,
    tag: String,
    onChange: (Boolean) -> Unit,
) {
    androidx.compose.foundation.layout.Row(
        modifier = androidx.compose.ui.Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = androidx.compose.ui.Modifier.weight(1f),
        ) {
            androidx.compose.material3.Text(
                label,
                color = com.fitmealai.ui.theme.FitMealColors.TextPrimary,
                fontSize = 14.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
            )
            androidx.compose.material3.Text(
                detail,
                color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                fontSize = 12.sp,
            )
        }
        androidx.compose.material3.Switch(
            checked = value,
            onCheckedChange = onChange,
            modifier = androidx.compose.ui.Modifier.testTag(tag),
        )
    }
}

@androidx.compose.runtime.Composable
fun SettingsReferralSheet(state: com.fitmealai.ui.AppState, onDone: () -> Unit) {
    val stats by state.referralStats.collectAsState()
    val context = androidx.compose.ui.platform.LocalContext.current

    androidx.compose.runtime.LaunchedEffect(Unit) { state.refreshReferralStats() }

    val target = stats.target.coerceAtLeast(1)
    val progress = (stats.verified.toFloat() / target.toFloat()).coerceIn(0f, 1f)

    ScreenContainer(modifier = androidx.compose.ui.Modifier.testTag("android-settings-referrals-sheet")) {
        com.fitmealai.ui.components.TopBar(title = "Refer & earn", onBack = onDone)

        com.fitmealai.ui.components.GlassCard(modifier = androidx.compose.ui.Modifier.fillMaxWidth()) {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(FitMealSpacing.small),
            ) {
                androidx.compose.material3.Text(
                    "Your referral code",
                    color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                    fontSize = 12.sp,
                )
                androidx.compose.material3.Text(
                    text = stats.code ?: "—",
                    color = com.fitmealai.ui.theme.FitMealColors.TextPrimary,
                    fontSize = 28.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                    modifier = androidx.compose.ui.Modifier.testTag("android-referral-code"),
                )
                androidx.compose.material3.Text(
                    "Refer 3 friends to unlock 30 days of FitMeal Gold.",
                    color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                    fontSize = 13.sp,
                )
            }
        }

        // Progress card.
        com.fitmealai.ui.components.GlassCard(modifier = androidx.compose.ui.Modifier.fillMaxWidth()) {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(FitMealSpacing.small),
            ) {
                androidx.compose.foundation.layout.Row(
                    horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceBetween,
                    modifier = androidx.compose.ui.Modifier.fillMaxWidth(),
                ) {
                    androidx.compose.material3.Text(
                        "Verified referrals",
                        color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                        fontSize = 12.sp,
                    )
                    androidx.compose.material3.Text(
                        "${stats.verified} / $target",
                        color = com.fitmealai.ui.theme.FitMealColors.TextPrimary,
                        fontSize = 12.sp,
                        fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold,
                        modifier = androidx.compose.ui.Modifier.testTag("android-referral-progress-text"),
                    )
                }
                androidx.compose.material3.LinearProgressIndicator(
                    progress = { progress },
                    modifier = androidx.compose.ui.Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .testTag("android-referral-progress"),
                    color = com.fitmealai.ui.theme.FitMealColors.AccentPurple,
                    trackColor = com.fitmealai.ui.theme.FitMealColors.GlassStrokeSoft,
                )
                androidx.compose.material3.Text(
                    when {
                        stats.rewarded -> "🎉 You've earned 30 days of Gold."
                        stats.pending > 0 -> "${stats.pending} pending — they verify after the friend's first AI generation."
                        else -> "Share your code to start earning."
                    },
                    color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                    fontSize = 12.sp,
                )
            }
        }

        com.fitmealai.ui.components.PrimaryGradientButton(
            title = "Share my code",
            tag = "android-referral-share-button",
            enabled = stats.code != null,
        ) {
            val code = stats.code ?: return@PrimaryGradientButton
            val text = "Try FitMeal AI with my code $code — 50 AI-personalized meals, free to try."
            val send = android.content.Intent(android.content.Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(android.content.Intent.EXTRA_TEXT, text)
            }
            val chooser = android.content.Intent.createChooser(send, "Share your referral code")
            chooser.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
            runCatching { context.startActivity(chooser) }
        }

        Spacer(androidx.compose.ui.Modifier.height(FitMealSpacing.large))
    }
}

@androidx.compose.runtime.Composable
fun SettingsThemeSheet(state: com.fitmealai.ui.AppState, onDone: () -> Unit) {
    val active by state.colorScheme.collectAsState()
    ScreenContainer(modifier = androidx.compose.ui.Modifier.testTag("android-settings-theme-sheet")) {
        com.fitmealai.ui.components.TopBar(title = "Appearance", onBack = onDone)

        com.fitmealai.ui.components.GlassCard(modifier = androidx.compose.ui.Modifier.fillMaxWidth()) {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(2.dp),
            ) {
                com.fitmealai.domain.AppColorScheme.entries.forEach { option ->
                    ThemeOptionRow(
                        label = option.displayName,
                        detail = when (option) {
                            com.fitmealai.domain.AppColorScheme.System -> "Follow device setting"
                            com.fitmealai.domain.AppColorScheme.Dark -> "Premium emerald dark"
                            com.fitmealai.domain.AppColorScheme.Light -> "Soft mint on white"
                        },
                        selected = option == active,
                        tag = "android-theme-${option.storageValue}",
                    ) { state.setColorScheme(option) }
                }
            }
        }

        Spacer(androidx.compose.ui.Modifier.height(FitMealSpacing.large))
    }
}

@androidx.compose.runtime.Composable
private fun ThemeOptionRow(
    label: String,
    detail: String,
    selected: Boolean,
    tag: String,
    onClick: () -> Unit,
) {
    androidx.compose.foundation.layout.Row(
        modifier = androidx.compose.ui.Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .testTag(tag),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically,
        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = androidx.compose.ui.Modifier.weight(1f),
        ) {
            androidx.compose.material3.Text(
                label,
                color = com.fitmealai.ui.theme.FitMealColors.TextPrimary,
                fontSize = 15.sp,
                fontWeight = androidx.compose.ui.text.font.FontWeight.Medium,
            )
            androidx.compose.material3.Text(
                detail,
                color = com.fitmealai.ui.theme.FitMealColors.TextSecondary,
                fontSize = 12.sp,
            )
        }
        androidx.compose.material3.RadioButton(selected = selected, onClick = onClick)
    }
}

// Required imports added at bottom because the rest of the file already
// imports the basics. Kotlin allows multiple `import` blocks at the file
// level only at the very top; these references use fully-qualified names
// to avoid editing the existing import section.
