package com.fitmealai.ui

import android.app.Application
import android.provider.Settings
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
import com.fitmealai.data.MealPlanCache
import com.fitmealai.data.MockData
import com.fitmealai.data.NotificationsRepository
import com.fitmealai.data.PaymentOptionsService
import com.fitmealai.data.PaymentRepository
import com.fitmealai.data.PreferencesStore
import com.fitmealai.data.PushTokenRepository
import com.fitmealai.data.QuotaCounter
import com.fitmealai.data.QuotaRepository
import com.fitmealai.data.QuotaState
import com.fitmealai.data.ReferralsRepository
import com.fitmealai.data.SessionStore
import com.fitmealai.data.ShuffleRepository
import com.fitmealai.domain.AppColorScheme
import com.fitmealai.domain.FitnessGoal
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.NotificationPrefs
import com.fitmealai.domain.ReferralStats
import com.fitmealai.domain.SubscriptionTier
import com.fitmealai.domain.WorkoutPrefs
import com.fitmealai.push.FirebaseTokenRegistrar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
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
    val paymentOptionsService = PaymentOptionsService(config)
    val pushTokenRepository = PushTokenRepository(config)
    val notificationsRepository = NotificationsRepository(config)
    val referralsRepository = ReferralsRepository(config)
    val quotaRepository = QuotaRepository(config)
    val shuffleRepository = ShuffleRepository(config)
    val googleSignInHelper = GoogleSignInHelper(config)
    val sessionStore = SessionStore(application)
    val preferencesStore = PreferencesStore(application)
    val mealPlanCache = MealPlanCache(application)
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

    private val _paymentOptions =
        MutableStateFlow(PaymentOptionsService.Options.Unavailable)
    val paymentOptions: StateFlow<PaymentOptionsService.Options> =
        _paymentOptions.asStateFlow()

    private val _notificationPrefs = MutableStateFlow(preferencesStore.notificationPrefs)
    val notificationPrefs: StateFlow<NotificationPrefs> = _notificationPrefs.asStateFlow()

    private val _referralStats = MutableStateFlow(ReferralStats.Empty)
    val referralStats: StateFlow<ReferralStats> = _referralStats.asStateFlow()

    /**
     * Today's AI + shuffle counters (`{tier, ai, shuffles, shuffle_meal_count}`).
     * Refreshed once on session bootstrap and after every successful
     * Generate / Shuffle so the Home buttons can render their
     * "3 of 10 used today" subtitles without re-polling.
     */
    private val _quotaState = MutableStateFlow(QuotaState.Loading)
    val quotaState: StateFlow<QuotaState> = _quotaState.asStateFlow()

    /** Active light/dark/system selection. Mirrors the StateFlow from PreferencesStore. */
    val colorScheme: StateFlow<AppColorScheme> = preferencesStore.colorScheme

    private var pendingGoal: FitnessGoal = MockData.user.goal
    private var pendingWorkout: WorkoutPrefs = WorkoutPrefs.Default

    init {
        viewModelScope.launch {
            bootstrap()
        }
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

    fun refreshPaymentOptions() {
        viewModelScope.launch {
            _paymentOptions.value = paymentOptionsService.fetch()
        }
    }

    /** Theme picker action. Persists immediately; theme switches on the next frame. */
    fun setColorScheme(scheme: AppColorScheme) {
        preferencesStore.saveColorScheme(scheme)
    }

    // ----- Notification preferences -------------------------------------

    fun refreshNotificationPrefs() {
        val s = _session.value ?: return
        viewModelScope.launch {
            val fresh = notificationsRepository.load(s)
            _notificationPrefs.value = fresh
            preferencesStore.saveNotificationPrefs(fresh)
        }
    }

    fun updateNotificationPrefs(next: NotificationPrefs) {
        _notificationPrefs.value = next
        preferencesStore.saveNotificationPrefs(next)
        val s = _session.value ?: return
        viewModelScope.launch {
            notificationsRepository.update(s, next)
        }
    }

    // ----- Referrals ----------------------------------------------------

    fun refreshReferralStats() {
        val s = _session.value ?: return
        viewModelScope.launch {
            _referralStats.value = referralsRepository.fetchStats(s)
        }
    }

    /**
     * Telegram deep link to start a chat with the bot pre-populated with
     * the current user's id. `BOT_USERNAME` is configured via gradle
     * BuildConfig (`FITMEAL_TELEGRAM_BOT_USERNAME`); falls back to a
     * placeholder so the row stays clickable.
     */
    fun telegramLinkUrl(): String? {
        val s = _session.value ?: return null
        val bot = config.telegramBotUsername.ifBlank { return null }
        return "https://t.me/$bot?start=${s.userId}"
    }

    // ----- Push token registration --------------------------------------

    /**
     * Pulls a fresh FCM token (if Firebase is configured) and POSTs it
     * to /api/push/register. Safe to call multiple times. Silent no-op
     * when Firebase isn't initialized (no google-services.json).
     */
    fun registerPushToken() {
        val s = _session.value ?: return
        viewModelScope.launch {
            val token = FirebaseTokenRegistrar.fetchToken() ?: return@launch
            pushTokenRepository.register(s, token)
        }
    }

    /** Splash → restore session → navigate. */
    private suspend fun bootstrap() {
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
                onSessionEstablished()
                _flow.value = nextFlowAfterAuth()
            } else {
                sessionStore.clear()
                _flow.value = RootFlow.Login
            }
        } else {
            _session.value = saved
            onSessionEstablished()
            _flow.value = nextFlowAfterAuth()
        }
    }

    /**
     * Triggered the moment we have a valid session. Kicks off the
     * always-on background tasks: push token registration, referral
     * stats, and notification prefs sync. Each one fails gracefully so
     * a missing API base URL or Firebase config doesn't break the app.
     */
    private fun onSessionEstablished() {
        registerPushToken()
        refreshNotificationPrefs()
        refreshReferralStats()
        refreshQuotas()
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
            mealPlanCache.clearAll()
            _session.value = null
            _selectedTab.value = MainTab.Home
            _activeSheet.value = null
            _quotaState.value = QuotaState.Loading
            _flow.value = RootFlow.Login
        }
    }

    private fun handleAuthSuccess(s: AuthSession) {
        sessionStore.save(s)
        _session.value = s
        onSessionEstablished()
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

    // -----------------------------------------------------------------------
    // Quota helpers (AI + Shuffle)
    // -----------------------------------------------------------------------

    /**
     * Pulls the latest /api/quotas snapshot for the signed-in user.
     * Silent on failure (counters fall back to zero) so the Home tab
     * doesn't toast every time the device is offline.
     */
    fun refreshQuotas() {
        val s = _session.value ?: return
        viewModelScope.launch {
            runCatching { quotaRepository.fetch(s) }
                .onSuccess { fresh ->
                    // Preserve the catalog_not_ready flag — /api/quotas
                    // doesn't expose it, only /api/recipes/shuffle does.
                    _quotaState.value = fresh.copy(
                        catalogNotReady = _quotaState.value.catalogNotReady,
                    )
                }
        }
    }

    /**
     * Bumps the local AI counter after a successful /api/ai/meal-plan.
     * The server already incremented its own counter; we mirror that
     * locally so the Home button updates without re-polling.
     */
    fun applyAiUsedLocally() {
        val current = _quotaState.value
        if (current.ai.unlimited) return
        _quotaState.value = current.copy(
            ai = current.ai.copy(used = current.ai.used + 1),
        )
    }

    /**
     * Replaces the shuffle counter with the post-bump snapshot returned
     * inline by /api/recipes/shuffle.
     */
    fun applyShuffleCounter(counter: QuotaCounter) {
        _quotaState.value = _quotaState.value.copy(
            shuffles = counter,
            // A successful shuffle implies the catalog is ready.
            catalogNotReady = false,
        )
    }

    /** Set when /api/recipes/shuffle returned 503 catalog_not_ready. */
    fun markCatalogNotReady() {
        _quotaState.value = _quotaState.value.copy(catalogNotReady = true)
    }

    /**
     * Stable per-install device id used as the referral fingerprint.
     * Falls back to a hashed timestamp when the system value isn't
     * available. Not tied to a Google account; just a debounce key
     * server-side.
     */
    fun deviceFingerprint(): String {
        val cr = getApplication<Application>().contentResolver
        return runCatching {
            Settings.Secure.getString(cr, Settings.Secure.ANDROID_ID).orEmpty()
        }.getOrDefault("").ifBlank {
            "anon-${getApplication<Application>().packageName.hashCode()}"
        }
    }
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
    data object NotificationSettings : AppSheet
    data object Referrals : AppSheet
    data object ThemePicker : AppSheet
}
