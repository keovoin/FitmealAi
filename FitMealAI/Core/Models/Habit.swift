//
//  Habit.swift
//  FitMealAI
//
//  Daily habit row for the habit tracker screen.
//

import Foundation

struct Habit: Identifiable, Codable, Hashable {
    let id: UUID
    var title: String
    var iconSystemName: String
    var isCompleted: Bool
    var streakDays: Int

    init(
        id: UUID = UUID(),
        title: String,
        iconSystemName: String,
        isCompleted: Bool = false,
        streakDays: Int = 0
    ) {
        self.id = id
        self.title = title
        self.iconSystemName = iconSystemName
        self.isCompleted = isCompleted
        self.streakDays = streakDays
    }
}
