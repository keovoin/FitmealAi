//
//  SettingsWorkoutViewModel.swift
//  FitMealAI
//
//  Edits saved workout preferences. Same shape as
//  SettingsMealViewModel: load from PreferencesStore, save back, show
//  a transient isSaved=true window on Save.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class SettingsWorkoutViewModel: ObservableObject {

    @Published var prefs: WorkoutPrefs
    @Published private(set) var isSaved: Bool = false

    private let store: PreferencesStore
    private var savedResetTask: Task<Void, Never>?

    init(store: PreferencesStore = PreferencesStore()) {
        self.store = store
        self.prefs = store.workout
    }

    deinit {
        savedResetTask?.cancel()
    }

    // MARK: - Derived

    var canSave: Bool { !prefs.types.isEmpty }

    var summary: String {
        let count = prefs.types.count
        let typeWord = count == 1 ? "type" : "types"
        return "\(count) \(typeWord) . \(prefs.days)"
    }

    // MARK: - Intents

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
        guard canSave else { return }
        store.saveWorkoutPrefs(prefs)

        savedResetTask?.cancel()
        isSaved = true
        savedResetTask = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            await MainActor.run { self?.isSaved = false }
        }
    }
}
