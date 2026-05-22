//
//  SettingsViewModel.swift
//  FitMealAI
//
//  Drives the Settings root screen. Pulls live workout/meal preferences
//  from PreferencesStore so the row summaries stay in sync after the
//  user edits in SettingsMeal/SettingsWorkout.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class SettingsViewModel: ObservableObject {

    // MARK: - Dependencies

    @Published private(set) var store: PreferencesStore
    private var bag: Set<AnyCancellable> = []

    // MARK: - Published

    @Published var user: UserGoal
    @Published var tier: SubscriptionTier

    init(
        store: PreferencesStore = PreferencesStore(),
        user: UserGoal = MockData.user,
        tier: SubscriptionTier = .free
    ) {
        self.store = store
        self.user = user
        self.tier = tier

        // Re-publish whenever the underlying store changes so SettingsView's
        // summary lines update immediately after returning from sub-screens.
        store.objectWillChange
            .sink { [weak self] in self?.objectWillChange.send() }
            .store(in: &bag)
    }

    // MARK: - Derived summaries

    var workoutSummary: String {
        let count = store.workout.types.count
        let typeWord = count == 1 ? "type" : "types"
        return "\(count) \(typeWord) . \(store.workout.days)"
    }

    var mealSummary: String {
        let slots = store.meal.timings.count
        let diets = store.meal.diets.count
        let slotWord = slots == 1 ? "slot" : "slots"
        let dietWord = diets == 1 ? "diet" : "diets"
        return "\(slots) \(slotWord) . \(diets) \(dietWord)"
    }

    var planTitle: String {
        "FitMeal \(tier.rawValue)"
    }

    var planSubtitle: String {
        switch tier {
        case .free:   return "Tap to upgrade"
        case .silver: return "Cancel anytime"
        case .gold:   return "All features unlocked"
        }
    }

    var showsUpgradeHighlight: Bool { tier == .free }

    var versionString: String { "FitMeal AI v1.0.0 (Phase 2)" }
}
