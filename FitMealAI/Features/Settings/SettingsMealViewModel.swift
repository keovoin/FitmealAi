//
//  SettingsMealViewModel.swift
//  FitMealAI
//
//  Edits saved meal preferences. Backed by PreferencesStore.
//  Mirrors the React SettingsMeal.tsx behaviour: on save, flip
//  isSaved=true for 2 seconds so the primary button shows a green
//  "Saved!" confirmation, then revert.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class SettingsMealViewModel: ObservableObject {

    @Published var prefs: MealPrefs
    @Published private(set) var isSaved: Bool = false

    private let store: PreferencesStore
    private var savedResetTask: Task<Void, Never>?

    init(store: PreferencesStore = PreferencesStore()) {
        self.store = store
        self.prefs = store.meal
    }

    deinit {
        savedResetTask?.cancel()
    }

    // MARK: - Derived

    var canSave: Bool {
        !prefs.diets.isEmpty && !prefs.timings.isEmpty
    }

    var summary: String {
        let dietCount = prefs.diets.count
        let timingCount = prefs.timings.count
        let dietWord = dietCount == 1 ? "diet" : "diets"
        let slotWord = timingCount == 1 ? "meal slot" : "meal slots"
        return "\(timingCount) \(slotWord) . \(dietCount) \(dietWord)"
    }

    // MARK: - Intents

    func toggleTiming(_ id: String) {
        if prefs.timings.contains(id) {
            guard prefs.timings.count > 1 else { return }
            prefs.timings.remove(id)
        } else {
            prefs.timings.insert(id)
        }
    }

    func toggleAllergy(_ tag: String) {
        if prefs.allergies.contains(tag) {
            prefs.allergies.remove(tag)
        } else {
            prefs.allergies.insert(tag)
        }
    }

    func setCookTime(_ value: String) { prefs.cookTime = value }

    func save() {
        guard canSave else { return }
        store.saveMealPrefs(prefs)

        // Show transient "Saved!" state for 2 seconds.
        savedResetTask?.cancel()
        isSaved = true
        savedResetTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run { self?.isSaved = false }
        }
    }
}
