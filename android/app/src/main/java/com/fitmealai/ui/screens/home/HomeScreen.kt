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
import androidx.compose.runtime.LaunchedEffect
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.data.QuotaCounter
import com.fitmealai.data.QuotaState
import com.fitmealai.data.ShuffleException
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.ui.AppState
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.MainTab
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SecondaryGlassButton
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.launch

@Composable
fun HomeScreen(state: AppState) {
    val tier by state.tier.collectAsState()
    val quota by state.quotaState.collectAsState()
    var mealPlan by remember { mutableStateOf<MealPlan>(MockData.mealPlan) }
    var isGenerating by remember { mutableStateOf(false) }
    var isShuffling by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = androidx.compose.runtime.rememberCoroutineScope()

    // Refresh quotas every time we land on Home so the counters stay
    // honest if the user generated/shuffled from another tab. Cheap
    // (~1 GET) and idempotent server-side.
    LaunchedEffect(Unit) { state.refreshQuotas() }

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

        // -----------------------------------------------------------------
        // Shuffle + Generate action row.
        //
        // Both buttons live under today's plan summary. Each shows a
        // remaining-count subtitle pulled live from /api/quotas. When
        // the user has 0 remaining we route to AppSheet.Paywall instead
        // of calling the endpoint. Shuffle is hidden entirely if the
        // last shuffle attempt returned 503 catalog_not_ready.
        // -----------------------------------------------------------------
        QuotaActionRow(
            quota = quota,
            isShuffling = isShuffling,
            isGenerating = isGenerating,
            onShuffleTap = {
                if (quota.shuffles.isExhausted) {
                    state.showSheet(AppSheet.Paywall)
                    return@QuotaActionRow
                }
                val session = state.session.value
                if (session == null) {
                    error = "Sign in before shuffling recipes."
                    return@QuotaActionRow
                }
                val targetMealType = mealPlan.meals.firstOrNull()?.type ?: MealType.Lunch
                scope.launch {
                    isShuffling = true
                    error = null
                    try {
                        val result = state.shuffleRepository.shuffle(
                            session = session,
                            mealType = targetMealType,
                            count = quota.shuffleMealCount,
                        )
                        mealPlan = result.mealPlan
                        state.applyShuffleCounter(result.shuffles)
                    } catch (cap: ShuffleException.DailyCapReached) {
                        // Mirror the server-side counter and pop the paywall.
                        state.applyShuffleCounter(cap.shuffles)
                        state.showSheet(AppSheet.Paywall)
                    } catch (_: ShuffleException.CatalogNotReady) {
                        state.markCatalogNotReady()
                    } catch (_: ShuffleException.NoMatch) {
                        error = "No recipes match your diet, allergens, and cook-time."
                    } catch (t: Throwable) {
                        error = t.message ?: "Shuffle failed."
                    } finally {
                        isShuffling = false
                    }
                }
            },
            onGenerateTap = {
                if (quota.ai.isExhausted) {
                    state.showSheet(AppSheet.Paywall)
                    return@QuotaActionRow
                }
                val session = state.session.value
                if (session == null) {
                    error = "Sign in before generating a live AI plan."
                    return@QuotaActionRow
                }
                scope.launch {
                    isGenerating = true
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
                        // The /api/ai/meal-plan endpoint doesn't echo the
                        // post-bump quota, so mirror locally and kick off
                        // a background re-fetch to stay in sync.
                        state.applyAiUsedLocally()
                        state.refreshQuotas()
                    } catch (t: Throwable) {
                        error = t.message ?: "AI request failed"
                    } finally {
                        isGenerating = false
                    }
                }
            },
        )

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

/**
 * Two-up action row shown beneath today's plan card.
 *
 *   ┌─────────────────────┐  ┌─────────────────────┐
 *   │ 🔀 Shuffle (8 left) │  │ ✨ Generate (1 left)│
 *   ├─────────────────────┤  ├─────────────────────┤
 *   │ 2 of 10 used today  │  │ 0 of 1 used today   │
 *   └─────────────────────┘  └─────────────────────┘
 *
 * Mirrors the iOS layout in `HomeDashboardView.swift`. Hides Shuffle
 * entirely when [QuotaState.catalogNotReady] is true (server returned
 * 503 catalog_not_ready) so users don't tap into a known dead-end.
 */
@Composable
private fun QuotaActionRow(
    quota: QuotaState,
    isShuffling: Boolean,
    isGenerating: Boolean,
    onShuffleTap: () -> Unit,
    onGenerateTap: () -> Unit,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        if (!quota.catalogNotReady) {
            QuotaButtonColumn(
                modifier = Modifier.weight(1f),
                title = "🔀  ${shuffleButtonLabel(quota.shuffles)}",
                subtitle = quota.shuffles.subtitle,
                isLoading = isShuffling,
                isPrimary = false,
                tag = "android-home-shuffle-button",
                onClick = onShuffleTap,
            )
        }
        QuotaButtonColumn(
            modifier = Modifier.weight(1f),
            title = "✨  ${generateButtonLabel(quota.ai, isGenerating)}",
            subtitle = quota.ai.subtitle,
            isLoading = isGenerating,
            isPrimary = true,
            tag = "android-home-generate-button",
            onClick = onGenerateTap,
        )
    }
}

@Composable
private fun QuotaButtonColumn(
    modifier: Modifier = Modifier,
    title: String,
    subtitle: String,
    isLoading: Boolean,
    isPrimary: Boolean,
    tag: String,
    onClick: () -> Unit,
) {
    Column(
        modifier = modifier,
        verticalArrangement = Arrangement.spacedBy(4.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (isPrimary) {
            PrimaryGradientButton(
                title = title,
                isLoading = isLoading,
                tag = tag,
                onClick = onClick,
            )
        } else {
            SecondaryGlassButton(
                title = title,
                tag = tag,
                onClick = onClick,
            )
        }
        Text(
            subtitle,
            color = FitMealColors.TextSecondary,
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .testTag("$tag-subtitle"),
        )
    }
}

/**
 * "Shuffle (8 left)" / "Shuffle" for unlimited tiers / "Upgrade" when
 * Free has hit the cap. The wording mirrors iOS so QA can compare
 * screenshots.
 */
private fun shuffleButtonLabel(counter: QuotaCounter): String {
    if (counter.unlimited) return "Shuffle"
    if (counter.isExhausted) return "Upgrade"
    return "Shuffle (${counter.remaining} left)"
}

private fun generateButtonLabel(counter: QuotaCounter, isGenerating: Boolean): String {
    if (isGenerating) return "Generating…"
    if (counter.unlimited) return "Generate"
    if (counter.isExhausted) return "Upgrade"
    return "Generate (${counter.remaining} left)"
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
