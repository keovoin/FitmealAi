package com.fitmealai.ui.screens.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

@Composable
fun PaymentPendingScreen(
    transactionId: String,
    amount: String,
    onDone: () -> Unit,
) {
    ScreenContainer(modifier = Modifier.testTag("android-payment-pending-screen")) {
        TopBar(title = "Payment submitted", subtitle = "We'll review within 24 hours.")

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(FitMealSpacing.medium),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .clip(CircleShape)
                        .background(FitMealBrushes.PrimaryButton),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("⏳", fontSize = 30.sp)
                }
                Text(
                    "Thanks!",
                    color = FitMealColors.TextPrimary,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    "We'll bump your account to Gold once the transfer of $amount " +
                        "(reference $transactionId) is approved.",
                    color = FitMealColors.TextSecondary,
                    textAlign = TextAlign.Center,
                )
            }
        }

        Spacer(Modifier.height(FitMealSpacing.large))

        PrimaryGradientButton(title = "Back to app", tag = "android-payment-pending-done") {
            onDone()
        }
    }
}
