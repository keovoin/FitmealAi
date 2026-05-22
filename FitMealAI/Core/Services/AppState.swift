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

    let config: FitMealConfig
    let authService: AuthService
    let preferencesStore: PreferencesStore
    lazy var aiService = AIService(config: config, authService: authService)
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
        rootFlow = .login
    }
}