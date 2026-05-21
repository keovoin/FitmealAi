//
//  WorkoutPlan.swift
//  FitMealAI
//
//  Daily workout plan made of exercises with sets and reps.
//

import Foundation

struct Exercise: Identifiable, Codable, Hashable {
    let id: UUID
    var name: String
    var sets: Int
    var reps: Int
    var durationSeconds: Int?
    var isCompleted: Bool

    init(
        id: UUID = UUID(),
        name: String,
        sets: Int,
        reps: Int,
        durationSeconds: Int? = nil,
        isCompleted: Bool = false
    ) {
        self.id = id
        self.name = name
        self.sets = sets
        self.reps = reps
        self.durationSeconds = durationSeconds
        self.isCompleted = isCompleted
    }
}

struct WorkoutPlan: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var date: Date
    var estimatedMinutes: Int
    var exercises: [Exercise]

    init(
        id: UUID = UUID(),
        title: String,
        date: Date,
        estimatedMinutes: Int,
        exercises: [Exercise]
    ) {
        self.id = id
        self.title = title
        self.date = date
        self.estimatedMinutes = estimatedMinutes
        self.exercises = exercises
    }

    var completedCount: Int { exercises.filter { $0.isCompleted }.count }
    var progress: Double {
        guard !exercises.isEmpty else { return 0 }
        return Double(completedCount) / Double(exercises.count)
    }
}
