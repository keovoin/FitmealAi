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
import com.fitmealai.ui.FitMealUiState
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors

@Composable
fun LoginScreen(
    state: FitMealUiState,
    onEmailSignIn: (String, String) -> Unit,
    onGoogleSignIn: () -> Unit,
    onContinueOffline: () -> Unit,
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

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
                ConfigStatus(state)
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("android-login-email-input"),
                )
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().testTag("android-login-password-input"),
                )
                if (state.message != null) {
                    Text(state.message, color = FitMealColors.TextSecondary, modifier = Modifier.testTag("android-login-message"))
                }
                PrimaryGradientButton(
                    title = if (state.isLoading) "Signing in..." else "Sign in",
                    tag = "android-login-continue-button",
                    enabled = !state.isLoading,
                    onClick = { onEmailSignIn(email, password) },
                )
                PrimaryGradientButton(
                    title = "Continue with Google",
                    tag = "android-login-google-button",
                    enabled = !state.isLoading,
                    onClick = onGoogleSignIn,
                )
                PrimaryGradientButton(
                    title = "Preview UI without login",
                    tag = "android-login-preview-button",
                    enabled = !state.isLoading,
                    onClick = onContinueOffline,
                )
            }
        }
    }
}

@Composable
private fun ConfigStatus(state: FitMealUiState) {
    val config = state.config
    val text = when {
        config.isSupabaseReady && config.isApiReady -> "Live config detected"
        else -> "Add Supabase/API values in Gradle properties before live auth"
    }
    Text(text, color = if (config.isSupabaseReady) FitMealColors.SuccessGreen else FitMealColors.TextSecondary)
}