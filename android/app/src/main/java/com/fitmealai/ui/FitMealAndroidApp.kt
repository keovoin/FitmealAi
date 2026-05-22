package com.fitmealai.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.material3.Snackbar
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.fitmealai.ui.screens.LoginScreen
import com.fitmealai.ui.screens.SplashScreen
import com.fitmealai.ui.screens.onboarding.OnboardingGoalScreen
import com.fitmealai.ui.screens.onboarding.OnboardingMealScreen
import com.fitmealai.ui.screens.onboarding.OnboardingWorkoutScreen

/**
 * App-level router. Mirrors iOS RootView's enum-based RootFlow switch.
 * AppState owns the current flow and the route changes animate via
 * AnimatedContent.
 */
@Composable
fun FitMealAndroidApp() {
    val state: AppState = viewModel()
    val flow by state.flow.collectAsState()
    val toast by state.toast.collectAsState()
    val snackbarHost = remember { SnackbarHostState() }

    LaunchedEffect(toast) {
        val msg = toast ?: return@LaunchedEffect
        snackbarHost.showSnackbar(msg)
        state.consumeToast()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AnimatedContent(
            targetState = flow,
            label = "root-flow",
            transitionSpec = {
                fadeIn(animationSpec = tween(220)) togetherWith fadeOut(animationSpec = tween(180))
            },
            modifier = Modifier.fillMaxSize(),
        ) { route ->
            when (route) {
                RootFlow.Splash -> SplashScreen()
                RootFlow.Login -> LoginScreen(state)
                RootFlow.OnboardingGoal -> OnboardingGoalScreen(
                    onContinue = { goal -> state.rememberGoal(goal) },
                    onBack = { state.goToFlow(RootFlow.Login) },
                )
                RootFlow.OnboardingWorkout -> OnboardingWorkoutScreen(
                    initial = state.preferencesStore.workoutPrefs,
                    onContinue = { prefs -> state.rememberWorkout(prefs) },
                    onBack = { state.goToFlow(RootFlow.OnboardingGoal) },
                )
                RootFlow.OnboardingMeal -> OnboardingMealScreen(
                    initial = state.preferencesStore.mealPrefs,
                    onContinue = { prefs -> state.completeOnboarding(prefs) },
                    onBack = { state.goToFlow(RootFlow.OnboardingWorkout) },
                )
                RootFlow.Main -> MainShell(state)
            }
        }

        SnackbarHost(
            hostState = snackbarHost,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(16.dp),
        ) { data ->
            Snackbar(snackbarData = data)
        }
    }
}
