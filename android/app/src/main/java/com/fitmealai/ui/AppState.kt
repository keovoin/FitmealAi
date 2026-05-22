package com.fitmealai.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.fitmealai.config.AppConfig
import com.fitmealai.data.AIRepository
import com.fitmealai.data.AuthException
import com.fitmealai.data.AuthRepository
import com.fitmealai.data.AuthSession
import com.fitmealai.data.BillingEvent
import com.fitmealai.data.BillingHelper
import com.fitmealai.data.GoogleSignInHelper
import com.fitmealai.data.MockData
import com.fitmealai.data.PaymentRepository
import com.fitmealai.data.PreferencesStore
import com.fitmealai.data.SessionStore
import com.fitmealai.domain.FitnessGoal
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.domain.WorkoutPrefs
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

/**
 * Top-of-app state holder. Mirrors the iOS `AppState` ObservableObject:
 * one source of truth for the navigation flow, auth, session, current
 * tier, and a tiny event log used to surface error toasts.
 *
 * Created at the Activity level via `viewModel()`.
 */
class AppState(application: Application) : AndroidViewModel(application) {

    val config = AppConfig()
    val authRepository = AuthRepository(config)
    val aiRepository = AIRepository(config)
    val paymentRepository = PaymentRepository(config)
    val googleSignInHelper = GoogleSignInHelper(config)
    val sessionStore = SessionStore(application)
    val preferencesStore = PreferencesStore(application)
    val billingHelper = BillingHelper(application)

    private val _flow = MutableStateFlow(RootFlow.Splash)
    val flow: StateFlow<RootFlow> = _flow.asStateFlow()

    private val _session = MutableStateFlow<AuthSession?>(null)
    val session: StateFlow<AuthSession?> = _session.asStateFlow()

    private val _tier = MutableStateFlow(SubscriptionTier.Free)
    val tier: StateFlow<SubscriptionTier> = _tier.asStateFlow()

    private val _selectedTab = MutableStateFlow(MainTab.Home)
    val selectedTab: StateFlow<MainTab> = _selectedTab.asStateFlow()

    private val _activeSheet = MutableStateFlow<AppSheet?>(null)
    val activeSheet: StateFlow<AppSheet?> = _activeSheet.asStateFlow()

    private val _toast = MutableStateFlow<String?>(null)
    val toast: StateFlow<String?> = _toast.asStateFlow()

    private var pendingGoal: FitnessGoal = MockData.user.goal
    private var pendingWorkout: WorkoutPrefs = WorkoutPrefs.Default

    init {
        viewModelScope.launch {
            bootstrap()
        }
        // Observe billing events from Play, propagating to our local
        // tier state. The same flow handles Family-shared / Ask-to-Buy
        // events that arrive outside the purchase UI.
        viewModelScope.launch {
            billingHelper.activeTier.collect { _tier.value = it }
        }
        viewModelScope.launch {
            billingHelper.events.collect { event ->
                when (event) {
                    is BillingEvent.Purchased -> {
                        _tier.value = event.tier
                        _toast.value = "Welcome to FitMeal ${event.tier.displayName}!"
                        _activeSheet.value = null
                    }
                    is BillingEvent.Error -> _toast.value = event.message
                    BillingEvent.UserCanceled -> Unit
                }
            }
        }
    }

    /**
     * Initiates the Play Billing purchase flow for the given tier.
     * Caller must pass the current Activity (Compose: LocalActivity).
     */
    fun purchaseTier(activity: android.app.Activity, tier: SubscriptionTier) {
        viewModelScope.launch {
            if (!billingHelper.ensureConnected()) {
                _toast.value = "Google Play Billing is not available."
                return@launch
            }
            billingHelper.launchPurchaseForTier(activity, tier)
        }
    }

    fun restorePurchases() {
        viewModelScope.launch {
            billingHelper.refreshActiveTier()
            _toast.value =
                if (_tier.value == SubscriptionTier.Free)
                    "No active subscription found."
                else
                    "Restored: FitMeal ${_tier.value.displayName}"
        }
    }

    /** Splash → restore session → navigate. */
    private suspend fun bootstrap() {
        // Pull current Play Billing entitlements in the background; if a user
        // already has a subscription from a previous install we know it
        // before the paywall appears.
        viewModelScope.launch {
            runCatching { billingHelper.refreshActiveTier() }
        }
        val saved = sessionStore.load()
        if (saved == null) {
            _flow.value = RootFlow.Login
            return
        }
        if (saved.isExpired) {
            val refreshed = saved.refreshToken
                ?.let { runCatching { authRepository.refresh(it) }.getOrNull() }
            if (refreshed != null) {
                sessionStore.save(refreshed)
                _session.value = refreshed
                _flow.value = nextFlowAfterAuth()
            } else {
                sessionStore.clear()
                _flow.value = RootFlow.Login
            }
        } else {
            _session.value = saved
            _flow.value = nextFlowAfterAuth()
        }
    }

    private fun nextFlowAfterAuth(): RootFlow =
        if (sessionStore.hasOnboardingCompleted()) RootFlow.Main
        else RootFlow.OnboardingGoal

    // -----------------------------------------------------------------------
    // Auth intents
    // -----------------------------------------------------------------------

    fun signIn(email: String, password: String, onError: (String) -> Unit = {}) {
        viewModelScope.launch {
            try {
                val s = authRepository.signIn(email.trim(), password)
                handleAuthSuccess(s)
            } catch (e: Throwable) {
                onError(e.friendly())
                _toast.value = e.friendly()
            }
        }
    }

    fun signUp(email: String, password: String, onError: (String) -> Unit = {}) {
        viewModelScope.launch {
            try {
                val s = authRepository.signUp(email.trim(), password)
                handleAuthSuccess(s)
            } catch (e: Throwable) {
                onError(e.friendly())
                _toast.value = e.friendly()
            }
        }
    }

    fun signInWithGoogleIdToken(idToken: String, nonce: String?, onError: (String) -> Unit = {}) {
        viewModelScope.launch {
            try {
                val s = authRepository.signInWithGoogle(idToken, nonce)
                handleAuthSuccess(s)
            } catch (e: Throwable) {
                onError(e.friendly())
                _toast.value = e.friendly()
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            _session.value?.let { authRepository.signOut(it) }
            sessionStore.clear()
            _session.value = null
            _selectedTab.value = MainTab.Home
            _activeSheet.value = null
            _flow.value = RootFlow.Login
        }
    }

    private fun handleAuthSuccess(s: AuthSession) {
        sessionStore.save(s)
        _session.value = s
        _flow.value = nextFlowAfterAuth()
    }

    // -----------------------------------------------------------------------
    // Onboarding
    // -----------------------------------------------------------------------

    fun rememberGoal(goal: FitnessGoal) {
        pendingGoal = goal
        _flow.value = RootFlow.OnboardingWorkout
    }

    fun rememberWorkout(prefs: WorkoutPrefs) {
        pendingWorkout = prefs
        _flow.value = RootFlow.OnboardingMeal
    }

    fun completeOnboarding(mealPrefs: MealPrefs) {
        viewModelScope.launch {
            preferencesStore.saveWorkoutPrefs(pendingWorkout)
            preferencesStore.saveMealPrefs(mealPrefs)
            sessionStore.setOnboardingCompleted(true)

            _session.value?.let { s ->
                runCatching { authRepository.saveGoal(s, pendingGoal, MockData.user.dailyCalorieTarget) }
                runCatching { authRepository.saveWorkoutPrefs(s, pendingWorkout) }
                runCatching { authRepository.saveMealPrefs(s, mealPrefs) }
            }
            _flow.value = RootFlow.Main
        }
    }

    // -----------------------------------------------------------------------
    // Navigation helpers
    // -----------------------------------------------------------------------

    fun goToFlow(flow: RootFlow) { _flow.value = flow }
    fun selectTab(tab: MainTab) { _selectedTab.value = tab }
    fun showSheet(sheet: AppSheet?) { _activeSheet.value = sheet }
    fun upgradeTier(tier: SubscriptionTier) { _tier.value = tier }
    fun consumeToast() { _toast.value = null }
    fun setToast(msg: String?) { _toast.value = msg }
}

private fun Throwable.friendly(): String =
    if (this is AuthException) message.orEmpty().ifBlank { "Authentication failed" }
    else message ?: "Something went wrong"

enum class RootFlow {
    Splash,
    Login,
    OnboardingGoal,
    OnboardingWorkout,
    OnboardingMeal,
    Main,
}

enum class MainTab(val label: String) {
    Home("Home"),
    Meals("Meals"),
    Workout("Workout"),
    Habits("Habits"),
    Progress("Progress"),
    Settings("Settings"),
}

sealed interface AppSheet {
    data object Paywall : AppSheet
    data object AbaPayment : AppSheet
    data class PaymentPending(val transactionId: String, val amount: String) : AppSheet
    data object WorkoutSettings : AppSheet
    data object MealSettings : AppSheet
}
