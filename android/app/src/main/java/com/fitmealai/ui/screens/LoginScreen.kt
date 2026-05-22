package com.fitmealai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.OutlinedTextField
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
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors

@Composable
fun LoginScreen(onContinue: () -> Unit) {
    var email by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
            .padding(24.dp)
            .testTag("android-login-screen"),
        verticalArrangement = Arrangement.Center,
    ) {
        Text("Welcome back", color = FitMealColors.TextPrimary, fontSize = 34.sp, fontWeight = FontWeight.Bold)
        Text("Android A1 foundation mirrors the iOS flow.", color = FitMealColors.TextSecondary)
        Spacer(Modifier.height(24.dp))
        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("android-login-email-input"),
                )
                PrimaryGradientButton(title = "Continue", tag = "android-login-continue-button", onClick = onContinue)
            }
        }
    }
}