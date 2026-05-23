//
//  PreferencesStore.swift
//  FitMealAI
//
//  UserDefaults-backed store for workout + meal preferences.
//  Mirrors the React `preferences.ts` so the SwiftUI app and the
//  React prototype share the same conceptual storage shape.
//
//  Phase 2 screens will use this via @StateObject in their ViewModels.
//

import Foundation
import Combine

@MainActor
final class PreferencesStore: ObservableObject {

    // MARK: - Persistence

    private static let key = "fitmeal_prefs_v1"
    private let defaults: UserDefaults

    // MARK: - Published state

    @Published var workout: WorkoutPrefs
    @Published var meal: MealPrefs
    @Published var colorScheme: AppColorScheme

    // MARK: - Init

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        let loaded = Self.load(from: defaults)
        self.workout = loaded.workout
        self.meal = loaded.meal
        self.colorScheme = AppColorScheme(
            rawValue: defaults.string(forKey: "fitmeal_color_scheme") ?? "system"
        ) ?? .system
    }

    // MARK: - Public API (matches React preferences.ts)

    func saveWorkoutPrefs(_ prefs: WorkoutPrefs) {
        workout = prefs
        persist()
    }

    func saveMealPrefs(_ prefs: MealPrefs) {
        meal = prefs
        persist()
    }

    func setColorScheme(_ scheme: AppColorScheme) {
        colorScheme = scheme
        defaults.set(scheme.rawValue, forKey: "fitmeal_color_scheme")
    }

    // MARK: - Internals

    private struct Snapshot: Codable {
        var workout: WorkoutPrefs
        var meal: MealPrefs
    }

    private static func load(from defaults: UserDefaults) -> Snapshot {
        guard
            let data = defaults.data(forKey: key),
            let snapshot = try? JSONDecoder().decode(Snapshot.self, from: data)
        else {
            return Snapshot(workout: .default, meal: .default)
        }
        return snapshot
    }

    private func persist() {
        let snapshot = Snapshot(workout: workout, meal: meal)
        if let data = try? JSONEncoder().encode(snapshot) {
            defaults.set(data, forKey: Self.key)
        }
    }
}



// MARK: - Color Scheme

enum AppColorScheme: String, CaseIterable, Codable {
    case system
    case dark
    case light

    var displayName: String {
        switch self {
        case .system: return "System"
        case .dark:   return "Dark"
        case .light:  return "Light"
        }
    }
}
