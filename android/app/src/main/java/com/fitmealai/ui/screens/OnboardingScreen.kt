package com.fitmealai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors

@Composable
fun OnboardingScreen(onComplete: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
            .padding(24.dp)
            .testTag("android-onboarding-screen"),
        verticalArrangement = Arrangement.Center,
    ) {
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Goal setup", color = FitMealColors.TextPrimary, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text("A1 ships the shell; A2 ports the full goal, workout, and meal preference steps.", color = FitMealColors.TextSecondary)
                PrimaryGradientButton(title = "Use healthy eating goal", tag = "android-onboarding-complete-button", onClick = onComplete)
            }
        }
    }
}