//
//  AppState.swift
//  FitMealAI
//
//  App-wide auth, onboarding, navigation, and service container.
//

import Foundation
import Combine

enum RootFlow {
    case splash
    case login
    case onboardingGoal
    case onboardingWorkout
    case onboardingMeal
    case main
}

enum AppSheet: Identifiable {
    case paywall
    case abaPayment
    case paymentPending(PaymentRequest)
    case workoutSettings
    case mealSettings

    var id: String {
        switch self {
        case .paywall: return "paywall"
        case .abaPayment: return "aba-payment"
        case .paymentPending: return "payment-pending"
        case .workoutSettings: return "workout-settings"
        case .mealSettings: return "meal-settings"
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    @Published var rootFlow: RootFlow = .splash
    @Published var isAuthenticated = false
    @Published var hasCompletedOnboarding: Bool
    @Published var currentUser: AuthenticatedUser?
    @Published var selectedTab: AppTab = .home
    @Published var activeSheet: AppSheet?
    @Published var latestError: String?

    /// Today's AI + shuffle counters (`{tier, ai, shuffles, shuffle_meal_count}`).
    /// Refreshed once on bootstrap and after every successful Generate or
    /// Shuffle so the Home action row's "X of Y used today" subtitles stay
    /// honest without re-polling.
    @Published var quotaState: QuotaState = .loading

    let config: FitMealConfig
    let authService: AuthService
    let preferencesStore: PreferencesStore
    lazy var aiService = AIService(config: config, authService: authService)
    lazy var quotaService = QuotaService(config: config, authService: authService)
    lazy var shuffleService = ShuffleService(config: config, authService: authService)
    lazy var paymentOptionsService = PaymentOptionsService(config: config)
    let subscriptionManager: SubscriptionManager

    private let onboardingKey = "fitmeal_has_completed_onboarding"
    private var onboardingGoal: FitnessGoal = MockData.user.goal
    private var onboardingWorkout: WorkoutPrefs = .default

    init(
        config: FitMealConfig = .current,
        authService: AuthService? = nil,
        preferencesStore: PreferencesStore = PreferencesStore(),
        subscriptionManager: SubscriptionManager? = nil
    ) {
        self.config = config
        self.preferencesStore = preferencesStore
        self.authService = authService ?? AuthService(config: config)
        self.subscriptionManager = subscriptionManager ?? SubscriptionManager()
        self.hasCompletedOnboarding = UserDefaults.standard.bool(forKey: onboardingKey)
    }

    static var preview: AppState {
        let state = AppState(config: .preview)
        state.isAuthenticated = true
        state.currentUser = AuthenticatedUser(id: UUID().uuidString, email: "alex@example.com")
        state.rootFlow = .main
        state.hasCompletedOnboarding = true
        return state
    }

    func bootstrap() async {
        do {
            let restored = try await authService.restoreSession()
            currentUser = restored?.user
            isAuthenticated = restored != nil
        } catch {
            latestError = error.localizedDescription
            isAuthenticated = false
        }
        // Refresh the StoreKit-resolved tier in parallel - we do this
        // even when not authenticated so previews and offline launches
        // still see Free as the default.
        await subscriptionManager.refreshActiveTier()

        if isAuthenticated {
            await refreshQuotas()
        }
    }

    func routeAfterSplash() {
        if isAuthenticated {
            rootFlow = hasCompletedOnboarding ? .main : .onboardingGoal
        } else {
            rootFlow = .login
        }
    }

    func didAuthenticate(_ session: AuthSession) {
        currentUser = session.user
        isAuthenticated = true
        rootFlow = hasCompletedOnboarding ? .main : .onboardingGoal
        Task { await refreshQuotas() }
    }

    func rememberGoal(_ goal: FitnessGoal) {
        onboardingGoal = goal
        rootFlow = .onboardingWorkout
    }

    func rememberWorkout(_ prefs: WorkoutPrefs) {
        onboardingWorkout = prefs
        rootFlow = .onboardingMeal
    }

    func completeOnboarding(mealPrefs: MealPrefs) async {
        preferencesStore.saveWorkoutPrefs(onboardingWorkout)
        preferencesStore.saveMealPrefs(mealPrefs)
        UserDefaults.standard.set(true, forKey: onboardingKey)
        hasCompletedOnboarding = true

        do {
            try await authService.saveGoal(onboardingGoal, calorieTarget: MockData.user.dailyCalorieTarget)
            try await authService.saveWorkoutPrefs(onboardingWorkout)
            try await authService.saveMealPrefs(mealPrefs)
        } catch {
            // Keep the app usable offline; local preferences remain saved.
            latestError = error.localizedDescription
        }
        rootFlow = .main
    }

    func signOut() async {
        await authService.signOut()
        currentUser = nil
        isAuthenticated = false
        selectedTab = .home
        activeSheet = nil
        quotaState = .loading
        rootFlow = .login
    }

    // MARK: - Quota helpers (AI + Shuffle)

    /// Pulls the latest /api/quotas snapshot. Silent on failure so the
    /// Home tab doesn't spam toasts when offline; the previous values
    /// keep displaying.
    func refreshQuotas() async {
        do {
            let fresh = try await quotaService.fetch()
            // Preserve the catalog_not_ready flag — /api/quotas doesn't
            // expose it; only /api/recipes/shuffle does.
            var next = fresh
            next.catalogNotReady = quotaState.catalogNotReady
            quotaState = next
        } catch {
            // Intentionally swallowed.
        }
    }

    /// Bumps the local AI counter after a successful /api/ai/meal-plan.
    /// The server already incremented its own counter; we mirror that
    /// locally so the Home button updates without re-polling.
    func applyAiUsedLocally() {
        guard !quotaState.ai.unlimited else { return }
        quotaState.ai.used += 1
    }

    /// Replaces the shuffle counter with the post-bump snapshot returned
    /// inline by /api/recipes/shuffle.
    func applyShuffleCounter(_ counter: QuotaCounter) {
        quotaState.shuffles = counter
        // A successful shuffle implies the catalog is ready.
        quotaState.catalogNotReady = false
    }

    /// Set when /api/recipes/shuffle returned 503 catalog_not_ready.
    func markCatalogNotReady() {
        quotaState.catalogNotReady = true
    }
}