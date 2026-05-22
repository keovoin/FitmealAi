//
//  OnboardingWorkoutViewModel.swift
//  FitMealAI
//
//  Step 2 of 3. Captures workout types (multi-select), days/week, and
//  session duration. Persists via PreferencesStore so that Settings
//  Workout reflects the same data.
//
//  No SwiftUI imports - portable to Jetpack Compose later.
//

import Foundation
import Combine

@MainActor
final class OnboardingWorkoutViewModel: ObservableObject {

    @Published var prefs: WorkoutPrefs

    private let store: PreferencesStore

    init(store: PreferencesStore = PreferencesStore(), seed: WorkoutPrefs? = nil) {
        self.store = store
        self.prefs = seed ?? store.workout
    }

    // MARK: - Derived

    var canContinue: Bool { !prefs.types.isEmpty }

    var summary: String {
        let typeCount = prefs.types.count
        let typeWord = typeCount == 1 ? "type" : "types"
        return "\(typeCount) \(typeWord) . \(prefs.days)"
    }

    var typesList: [WorkoutType] { WorkoutType.all }

    // MARK: - Intents

    /// Toggles a workout type while enforcing the "at least 1" rule.
    func toggleType(_ id: String) {
        if prefs.types.contains(id) {
            guard prefs.types.count > 1 else { return }
            prefs.types.remove(id)
        } else {
            prefs.types.insert(id)
        }
    }

    func setDays(_ value: String) { prefs.days = value }
    func setDuration(_ value: String) { prefs.duration = value }

    func save() {
        store.saveWorkoutPrefs(prefs)
    }
}
