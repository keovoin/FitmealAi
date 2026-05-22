package com.fitmealai.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.fitmealai.config.AppConfig
import com.fitmealai.data.AIRepository
import com.fitmealai.data.AuthRepository
import com.fitmealai.data.AuthSession
import com.fitmealai.data.MockData
import com.fitmealai.data.PaymentRepository
import com.fitmealai.domain.MealPlan
import kotlinx.coroutines.launch

data class FitMealUiState(
    val config: AppConfig = AppConfig(),
    val session: AuthSession? = null,
    val mealPlan: MealPlan = MockData.mealPlan,
    val isLoading: Boolean = false,
    val message: String? = null,
)

class FitMealViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
    private val aiRepository: AIRepository = AIRepository(),
    private val paymentRepository: PaymentRepository = PaymentRepository(),
) : ViewModel() {
    var state by mutableStateOf(FitMealUiState())
        private set

    fun signIn(email: String, password: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            runLoading {
                val session = authRepository.signIn(email, password)
                state = state.copy(session = session, message = "Signed in as ${session.email}")
                onSuccess()
            }
        }
    }

    fun signInWithGoogleIdToken(idToken: String, onSuccess: () -> Unit) {
        viewModelScope.launch {
            runLoading {
                val session = authRepository.signInWithGoogle(idToken)
                state = state.copy(session = session, message = "Google sign-in complete")
                onSuccess()
            }
        }
    }

    fun requestGoogleCredential() {
        state = state.copy(message = "Add Android Credential Manager to collect a Google ID token, then call signInWithGoogleIdToken().")
    }

    fun generateMealPlan() {
        val session = state.session
        if (session == null) {
            state = state.copy(message = "Sign in before generating a live AI plan.")
            return
        }

        viewModelScope.launch {
            runLoading {
                val plan = aiRepository.generateMealPlan(
                    session = session,
                    goal = "eat_healthier",
                    calorieTarget = MockData.user.dailyCalorieTarget,
                    diets = listOf("balanced"),
                    allergies = emptyList(),
                    cookTime = "30 min",
                    mealTypes = listOf("breakfast", "lunch", "dinner"),
                )
                state = state.copy(mealPlan = plan, message = "AI meal plan regenerated")
            }
        }
    }

    fun submitAbaPayment() {
        val session = state.session
        if (session == null) {
            state = state.copy(message = "Sign in before submitting ABA payment.")
            return
        }

        viewModelScope.launch {
            runLoading {
                val payment = paymentRepository.submitAbaPayment(
                    session = session,
                    tier = "gold",
                    amount = "\$9.99",
                    transactionId = "ANDROID-MANUAL-${System.currentTimeMillis()}",
                )
                state = state.copy(message = "Payment request ${payment.status}: ${payment.id}")
            }
        }
    }

    private suspend fun runLoading(block: suspend () -> Unit) {
        state = state.copy(isLoading = true, message = null)
        try {
            block()
        } catch (error: Throwable) {
            state = state.copy(message = error.message ?: "Something went wrong")
        } finally {
            state = state.copy(isLoading = false)
        }
    }
}