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

        PrimaryGradientButton(
            title = cta,
            tag = "android-paywall-purchase-button",
        ) {
            // Phase A4: in production this triggers BillingHelper.launchPurchase().
            // For now, locally upgrade the tier so the rest of the app reflects the change.
            state.upgradeTier(selectedTier)
            onClose()
        }

        SecondaryGlassButton(
            title = "Pay manually via ABA",
            tag = "android-paywall-aba-button",
        ) { state.showSheet(AppSheet.AbaPayment) }

        SecondaryGlassButton(
            title = "Restore purchases",
            tag = "android-paywall-restore-button",
        ) { state.setToast("Restore purchases will hit Play Billing once products are configured.") }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
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
