package com.fitmealai.ui.screens.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.ui.AppSheet
import com.fitmealai.ui.AppState
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SecondaryGlassButton
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.launch

@Composable
fun AbaPaymentScreen(state: AppState, onClose: () -> Unit) {
    val tier = "gold"
    val amount = "\$9.99"
    var transactionId by remember { mutableStateOf("") }
    var screenshotName by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    ScreenContainer(modifier = Modifier.testTag("android-aba-payment-screen")) {
        TopBar(title = "ABA bank transfer", subtitle = "Pay $amount and submit your reference.", onBack = onClose)

        // QR placeholder
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Box(
                    modifier = Modifier
                        .size(160.dp)
                        .clip(RoundedCornerShape(FitMealRadius.medium))
                        .background(FitMealColors.GlassFillSoft)
                        .border(
                            width = 1.dp,
                            color = FitMealColors.GlassStroke,
                            shape = RoundedCornerShape(FitMealRadius.medium),
                        ),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("📲 QR", color = FitMealColors.TextSecondary, fontSize = 18.sp)
                }
                Text("Scan in the ABA app", color = FitMealColors.TextSecondary, fontSize = 13.sp)
            }
        }

        // Merchant card
        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-aba-merchant-card")) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                MerchantRow("Merchant", "FitMeal AI")
                MerchantRow("Account", "000 123 456")
                MerchantRow("Reference", "ABA-FITMEAL-001")
                MerchantRow("Amount", amount)
            }
        }

        // Transaction ID input
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Transaction ID", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                OutlinedTextField(
                    value = transactionId,
                    onValueChange = { transactionId = it },
                    placeholder = { Text("ABA #...", color = FitMealColors.TextTertiary) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = FitMealColors.TextPrimary,
                        unfocusedTextColor = FitMealColors.TextPrimary,
                        cursorColor = FitMealColors.AccentPurple,
                        focusedBorderColor = FitMealColors.AccentPurple,
                        unfocusedBorderColor = FitMealColors.GlassStroke,
                        focusedContainerColor = FitMealColors.GlassFillSoft,
                        unfocusedContainerColor = FitMealColors.GlassFillSoft,
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("android-aba-tx-input"),
                )
            }
        }

        // Screenshot attach
        SecondaryGlassButton(
            title = if (screenshotName != null) "Attached: $screenshotName" else "Attach screenshot",
            tag = "android-aba-attach-button",
        ) {
            // Phase-A4 will hook into the system PhotosPicker. For now we just
            // store a placeholder file name so the form can advance.
            screenshotName = "receipt-${System.currentTimeMillis() / 1000}.png"
        }

        if (error != null) {
            Text(error!!, color = FitMealColors.ErrorRed, fontSize = 12.sp)
        }

        PrimaryGradientButton(
            title = if (isSubmitting) "Submitting…" else "Submit payment request",
            isLoading = isSubmitting,
            enabled = !isSubmitting && transactionId.length >= 4 && screenshotName != null,
            tag = "android-aba-submit-button",
        ) {
            val session = state.session.value
            if (session == null) {
                error = "Sign in before submitting payment."
                return@PrimaryGradientButton
            }
            scope.launch {
                isSubmitting = true
                error = null
                try {
                    val result = state.paymentRepository.submitAbaPayment(
                        session = session,
                        tier = tier,
                        amount = amount,
                        transactionId = transactionId.trim(),
                    )
                    state.showSheet(
                        AppSheet.PaymentPending(
                            transactionId = transactionId.trim(),
                            amount = amount,
                        )
                    )
                } catch (t: Throwable) {
                    error = t.message ?: "Submit failed"
                } finally {
                    isSubmitting = false
                }
            }
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
private fun MerchantRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = FitMealColors.TextTertiary, fontSize = 11.sp)
        Text(value, color = FitMealColors.TextPrimary, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
    }
}
