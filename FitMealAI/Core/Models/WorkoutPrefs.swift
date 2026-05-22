//
//  WorkoutPrefs.swift
//  FitMealAI
//
//  Mirrors the `WorkoutPrefs` interface in React's `preferences.ts`.
//  Used by Onboarding Workout and Settings Workout screens.
//

import Foundation

// MARK: - Workout type

struct WorkoutType: MultiSelectItem, Codable {
    let id: String
    let label: String
    let emoji: String
    /// Cards in the workout grid don't show a subtitle.
    var subtitle: String? { nil }

    static let all: [WorkoutType] = [
        WorkoutType(id: "strength",   label: "Strength",   emoji: "🏋️"),
        WorkoutType(id: "cardio",     label: "Cardio",     emoji: "🏃"),
        WorkoutType(id: "hiit",       label: "HIIT",       emoji: "⚡"),
        WorkoutType(id: "yoga",       label: "Yoga",       emoji: "🧘"),
        WorkoutType(id: "pilates",    label: "Pilates",    emoji: "🤸"),
        WorkoutType(id: "cycling",    label: "Cycling",    emoji: "🚴"),
        WorkoutType(id: "running",    label: "Running",    emoji: "👟"),
        WorkoutType(id: "swimming",   label: "Swimming",   emoji: "🏊"),
        WorkoutType(id: "boxing",     label: "Boxing",     emoji: "🥊"),
        WorkoutType(id: "stretching", label: "Stretching", emoji: "🙆")
    ]
}

// MARK: - Constants

enum WorkoutConstants {
    static let daysOptions: [String] = ["2 days", "3 days", "4 days", "5 days", "6 days"]
    static let durationOptions: [String] = ["20 min", "30 min", "45 min", "60 min", "90 min"]
}

// MARK: - Stored prefs

struct WorkoutPrefs: Codable, Hashable {
    var types: Set<String>
    var days: String
    var duration: String

    static let `default` = WorkoutPrefs(
        types: ["strength"],
        days: "4 days",
        duration: "45 min"
    )
}
