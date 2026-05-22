package com.fitmealai.ui.screens.paywall

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
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.SubscriptionPlan
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.AppState
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SecondaryGlassButton
import com.fitmealai.ui.components.TagPill
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing

@Composable
fun PaywallScreen(state: AppState, onClose: () -> Unit) {
    var selectedTier by remember { mutableStateOf(SubscriptionTier.Gold) }
    val paymentOptions by state.paymentOptions.collectAsState()

    // Refresh per-user payment availability the first time the paywall
    // sheet opens. The endpoint is uncached so the toggle in
    // /payment-settings flips live without app restart.
    LaunchedEffect(Unit) { state.refreshPaymentOptions() }

    ScreenContainer(modifier = Modifier.testTag("android-paywall-screen")) {
        TopBar(title = "Upgrade", subtitle = "Unlock unlimited AI plans", onBack = onClose)

        MockData.plans.forEach { plan ->
            PlanCard(
                plan = plan,
                selected = plan.tier == selectedTier,
                onSelect = { selectedTier = plan.tier },
            )
        }

        val cta = when (selectedTier) {
            SubscriptionTier.Free -> "Continue with Free"
            SubscriptionTier.Silver -> "Subscribe to Silver"
            SubscriptionTier.Gold -> "Subscribe to Gold"
        }

        val context = androidx.compose.ui.platform.LocalContext.current

        PrimaryGradientButton(
            title = cta,
            tag = "android-paywall-purchase-button",
        ) {
            if (selectedTier == SubscriptionTier.Free) {
                onClose()
            } else {
                val activity = context.findActivity()
                if (activity == null) {
                    state.setToast("Could not find host activity for billing flow.")
                } else {
                    // Real Google Play Billing flow. The PaywallScreen sheet
                    // stays mounted; AppState collects the BillingEvent and
                    // dismisses the sheet on success.
                    state.purchaseTier(activity, selectedTier)
                }
            }
        }

        // "Pay manually via ABA" is geo-locked: the admin toggle in
        // /payment-settings can disable it entirely, and the country
        // allow-list (default: Cambodia only) hides it everywhere else.
        if (paymentOptions.abaAvailableForUser) {
            SecondaryGlassButton(
                title = "Pay manually via ABA",
                tag = "android-paywall-aba-button",
            ) { state.showSheet(AppSheet.AbaPayment) }
        }

        SecondaryGlassButton(
            title = "Restore purchases",
            tag = "android-paywall-restore-button",
        ) { state.restorePurchases() }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

private fun android.content.Context.findActivity(): android.app.Activity? {
    var ctx: android.content.Context? = this
    while (ctx != null) {
        if (ctx is android.app.Activity) return ctx
        ctx = (ctx as? android.content.ContextWrapper)?.baseContext
    }
    return null
}

@Composable
private fun PlanCard(plan: SubscriptionPlan, selected: Boolean, onSelect: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(FitMealRadius.card))
            .background(if (selected) FitMealColors.AccentPurple.copy(alpha = 0.16f) else FitMealColors.GlassFill)
            .border(
                width = if (selected) 2.dp else 1.dp,
                color = if (selected) FitMealColors.AccentPurple else FitMealColors.GlassStroke,
                shape = RoundedCornerShape(FitMealRadius.card),
            )
            .clickable(onClick = onSelect)
            .padding(FitMealSpacing.medium)
            .testTag("android-paywall-plan-${plan.tier.displayName.lowercase()}"),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    "FitMeal ${plan.tier.displayName}",
                    color = FitMealColors.TextPrimary,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                )
                if (plan.highlight) TagPill("Most popular", foreground = FitMealColors.AccentPurple)
            }
            Text(plan.priceLabel, color = FitMealColors.TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Text(plan.tagline, color = FitMealColors.TextSecondary, fontSize = 13.sp)
            plan.perks.forEach { perk ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("✓", color = FitMealColors.SuccessGreen, fontWeight = FontWeight.Bold)
                    Text(perk, color = FitMealColors.TextSecondary, fontSize = 13.sp)
                }
            }
        }
    }
}
