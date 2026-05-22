//
//  OnboardingMealViewModel.swift
//  FitMealAI
//
//  Step 3 of 3. Captures diet styles (multi-select), meal timings,
//  max cook time, and optional allergies. Persists via PreferencesStore.
//
//  No SwiftUI imports - portable to Jetpack Compose later.
//

import Foundation
import Combine

@MainActor
final class OnboardingMealViewModel: ObservableObject {

    @Published var prefs: MealPrefs

    private let store: PreferencesStore

    init(store: PreferencesStore = PreferencesStore(), seed: MealPrefs? = nil) {
        self.store = store
        self.prefs = seed ?? store.meal
    }

    // MARK: - Derived

    var canContinue: Bool { !prefs.diets.isEmpty && !prefs.timings.isEmpty }

    var summary: String {
        let dietCount = prefs.diets.count
        let timingCount = prefs.timings.count
        let dietWord = dietCount == 1 ? "diet" : "diets"
        let slotWord = timingCount == 1 ? "meal slot" : "meal slots"
        return "\(timingCount) \(slotWord) . \(dietCount) \(dietWord)"
    }

    var dietsList: [DietStyle] { DietStyle.all }
    var timingsList: [MealTiming] { MealTiming.all }
    var cookTimes: [String] { MealConstants.cookTimes }
    var allergyTags: [String] { MealConstants.allergyTags }

    // MARK: - Intents

    /// Toggles a meal timing while enforcing the "at least 1" rule.
    func toggleTiming(_ id: String) {
        if prefs.timings.contains(id) {
            guard prefs.timings.count > 1 else { return }
            prefs.timings.remove(id)
        } else {
            prefs.timings.insert(id)
        }
    }

    /// Toggles an allergy. Allergies are optional, so any/all may be off.
    func toggleAllergy(_ tag: String) {
        if prefs.allergies.contains(tag) {
            prefs.allergies.remove(tag)
        } else {
            prefs.allergies.insert(tag)
        }
    }

    func setCookTime(_ value: String) { prefs.cookTime = value }

    func save() {
        store.saveMealPrefs(prefs)
    }
}
