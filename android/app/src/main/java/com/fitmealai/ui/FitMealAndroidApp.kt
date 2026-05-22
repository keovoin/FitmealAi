package com.fitmealai.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fitmealai.ui.screens.HomeScreen
import com.fitmealai.ui.screens.LoginScreen
import com.fitmealai.ui.screens.OnboardingScreen
import com.fitmealai.ui.screens.SplashScreen

private enum class RootRoute { Splash, Login, Onboarding, Home }

@Composable
fun FitMealAndroidApp() {
    var route by remember { mutableStateOf(RootRoute.Splash) }
    val viewModel: FitMealViewModel = viewModel()

    when (route) {
        RootRoute.Splash -> SplashScreen(onFinished = { route = RootRoute.Login })
        RootRoute.Login -> LoginScreen(
            state = viewModel.state,
            onEmailSignIn = { email, password -> viewModel.signIn(email, password) { route = RootRoute.Onboarding } },
            onGoogleSignIn = { viewModel.requestGoogleCredential() },
            onContinueOffline = { route = RootRoute.Onboarding },
        )
        RootRoute.Onboarding -> OnboardingScreen(onComplete = { route = RootRoute.Home })
        RootRoute.Home -> HomeScreen(
            state = viewModel.state,
            onGenerateMealPlan = viewModel::generateMealPlan,
            onSubmitPayment = viewModel::submitAbaPayment,
        )
    }
}