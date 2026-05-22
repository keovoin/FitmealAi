//
//  WorkoutViewModel.swift
//  FitMealAI
//
//  Owns the day's workout: list of exercises with completion state,
//  derived progress, and a placeholder rest-timer countdown.
//
//  No SwiftUI imports - portable to Jetpack Compose later.
//

import Foundation
import Combine

@MainActor
final class WorkoutViewModel: ObservableObject {

    @Published var workout: WorkoutPlan
    @Published var restSecondsRemaining: Int = 0
    @Published private(set) var isResting: Bool = false

    private var restTask: Task<Void, Never>?

    init(workout: WorkoutPlan = MockData.todayWorkout) {
        self.workout = workout
    }

    deinit {
        restTask?.cancel()
    }

    // MARK: - Derived

    var progress: Double { workout.progress }
    var completedCount: Int { workout.completedCount }
    var totalCount: Int { workout.exercises.count }

    var headerStat: String {
        "\(completedCount) of \(totalCount) done . \(workout.estimatedMinutes) min"
    }

    var isFinished: Bool {
        totalCount > 0 && completedCount == totalCount
    }

    // MARK: - Intents

    func toggleCompleted(_ exercise: Exercise) {
        guard let idx = workout.exercises.firstIndex(where: { $0.id == exercise.id }) else { return }
        workout.exercises[idx].isCompleted.toggle()
    }

    func startRest(seconds: Int = 45) {
        restTask?.cancel()
        restSecondsRemaining = seconds
        isResting = true
        restTask = Task { [weak self] in
            while !Task.isCancelled, let self, await self.restSecondsRemaining > 0 {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await MainActor.run {
                    if self.restSecondsRemaining > 0 {
                        self.restSecondsRemaining -= 1
                    }
                    if self.restSecondsRemaining == 0 {
                        self.isResting = false
                    }
                }
            }
        }
    }

    func cancelRest() {
        restTask?.cancel()
        restTask = nil
        isResting = false
        restSecondsRemaining = 0
    }
}
