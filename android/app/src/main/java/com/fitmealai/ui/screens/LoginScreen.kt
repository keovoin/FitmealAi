package com.fitmealai.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.GoogleIdResult
import com.fitmealai.ui.AppState
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.PrimaryGradientButton
import com.fitmealai.ui.components.SecondaryGlassButton
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing
import kotlinx.coroutines.launch

@Composable
fun LoginScreen(state: AppState) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val activityContext = LocalContext.current
    val scope = rememberCoroutineScopeStable()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
            .padding(FitMealSpacing.large)
            .testTag("android-login-screen"),
        verticalArrangement = Arrangement.spacedBy(FitMealSpacing.medium),
    ) {
        Spacer(Modifier.height(40.dp))
        Box(
            modifier = Modifier
                .size(56.dp)
                .clip(CircleShape)
                .background(FitMealBrushes.PrimaryButton),
        )
        Text(
            "Welcome back",
            color = FitMealColors.TextPrimary,
            fontSize = 30.sp,
            fontWeight = FontWeight.Bold,
        )
        Text(
            "Sign in to keep your plan moving forward.",
            color = FitMealColors.TextSecondary,
        )

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                verticalArrangement = Arrangement.spacedBy(FitMealSpacing.medium),
            ) {
                Text("Email", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("you@example.com", color = FitMealColors.TextTertiary) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    colors = textFieldColors(),
                    modifier = Modifier.fillMaxWidth().testTag("android-login-email-input"),
                )
                Text("Password", color = FitMealColors.TextSecondary, fontSize = 13.sp)
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    placeholder = { Text("••••••••", color = FitMealColors.TextTertiary) },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    colors = textFieldColors(),
                    modifier = Modifier.fillMaxWidth().testTag("android-login-password-input"),
                )
                if (errorMessage != null) {
                    Text(
                        errorMessage!!,
                        color = FitMealColors.ErrorRed,
                        fontSize = 12.sp,
                        modifier = Modifier.testTag("android-login-error"),
                    )
                }
                PrimaryGradientButton(
                    title = if (isSubmitting) "Signing in…" else "Sign In",
                    isLoading = isSubmitting,
                    enabled = email.isNotBlank() && password.length >= 6 && !isSubmitting,
                    tag = "android-login-submit-button",
                ) {
                    isSubmitting = true
                    errorMessage = null
                    state.signIn(email, password) { msg ->
                        errorMessage = msg
                        isSubmitting = false
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
        ) {
            Box(
                Modifier
                    .weight(1f)
                    .height(1.dp)
                    .background(FitMealColors.GlassStrokeSoft)
            )
            Text("OR CONTINUE WITH", color = FitMealColors.TextTertiary, fontSize = 11.sp)
            Box(
                Modifier
                    .weight(1f)
                    .height(1.dp)
                    .background(FitMealColors.GlassStrokeSoft)
            )
        }

        SecondaryGlassButton(
            title = "Continue with Google",
            leadingEmoji = "🅖",
            tag = "android-login-google-button",
            enabled = !isSubmitting,
        ) {
            scope.launch {
                isSubmitting = true
                errorMessage = null
                when (val result = state.googleSignInHelper.fetchIdToken(activityContext)) {
                    is GoogleIdResult.NotConfigured -> {
                        errorMessage = "Google Sign-In is not configured. Add FITMEAL_GOOGLE_WEB_CLIENT_ID."
                        isSubmitting = false
                    }
                    is GoogleIdResult.Error -> {
                        errorMessage = result.message
                        isSubmitting = false
                    }
                    is GoogleIdResult.Ok -> {
                        state.signInWithGoogleIdToken(result.idToken, result.nonce) { msg ->
                            errorMessage = msg
                            isSubmitting = false
                        }
                    }
                }
            }
        }

        Spacer(Modifier.weight(1f, fill = false))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
            Text("New to FitMeal? ", color = FitMealColors.TextSecondary)
            Text(
                "Get started free",
                color = FitMealColors.AccentBlue,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier
                    .testTag("android-login-signup-link")
                    .padding(start = 4.dp),
            )
        }
        SecondaryGlassButton(
            title = "Create account with email",
            tag = "android-login-signup-button",
            enabled = !isSubmitting && email.isNotBlank() && password.length >= 6,
        ) {
            isSubmitting = true
            errorMessage = null
            state.signUp(email, password) { msg ->
                errorMessage = msg
                isSubmitting = false
            }
        }
    }
}

@Composable
private fun textFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = FitMealColors.TextPrimary,
    unfocusedTextColor = FitMealColors.TextPrimary,
    cursorColor = FitMealColors.AccentPurple,
    focusedBorderColor = FitMealColors.AccentPurple,
    unfocusedBorderColor = FitMealColors.GlassStroke,
    focusedContainerColor = FitMealColors.GlassFillSoft,
    unfocusedContainerColor = FitMealColors.GlassFillSoft,
)

@Composable
private fun rememberCoroutineScopeStable() =
    androidx.compose.runtime.rememberCoroutineScope()
