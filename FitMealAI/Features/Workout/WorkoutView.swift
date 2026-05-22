//
//  WorkoutView.swift
//  FitMealAI
//
//  Workout tab: today's plan with progress, exercise list, completion
//  toggles, and a rest-timer placeholder card.
//

import SwiftUI

struct WorkoutView: View {
    @StateObject private var vm: WorkoutViewModel

    init(viewModel: WorkoutViewModel = WorkoutViewModel()) {
        _vm = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: vm.workout.title, subtitle: vm.headerStat) {
                Image(systemName: "figure.strengthtraining.traditional")
                    .foregroundStyle(AppTheme.Colors.accentBlue)
            }

            progressCard
            timerCard
            exerciseList

            if vm.isFinished {
                finishedBanner
            }
        }
    }

    // MARK: - Sections

    private var progressCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Text("Progress")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Spacer()
                    Text("\(Int(vm.progress * 100))%")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                ProgressTrack(progress: vm.progress)
                    .frame(height: 10)
            }
        }
    }

    private var timerCard: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.medium) {
                Image(systemName: "timer")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(AppTheme.Colors.accentBlue.opacity(0.85)))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Rest timer")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Text(vm.isResting ? "\(vm.restSecondsRemaining)s remaining" : "Take a quick break between sets")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                Spacer()

                if vm.isResting {
                    SecondaryGlassButton(title: "Stop") { vm.cancelRest() }
                        .frame(width: 92)
                } else {
                    SecondaryGlassButton(title: "Start 45s") { vm.startRest() }
                        .frame(width: 110)
                }
            }
        }
    }

    private var exerciseList: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            ForEach(vm.workout.exercises) { exercise in
                exerciseRow(exercise)
            }
        }
    }

    @ViewBuilder
    private func exerciseRow(_ exercise: Exercise) -> some View {
        let done = exercise.isCompleted

        Button(action: { vm.toggleCompleted(exercise) }) {
            HStack(spacing: AppTheme.Spacing.medium) {
                ZStack {
                    Circle()
                        .strokeBorder(done ? Color.clear : Color.white.opacity(0.30), lineWidth: 1.5)
                        .frame(width: 28, height: 28)
                    if done {
                        Circle()
                            .fill(AppTheme.Gradients.successButton)
                            .frame(width: 28, height: 28)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(exercise.name)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                        .strikethrough(done, color: AppTheme.Colors.textTertiary)
                    Text(detailLine(for: exercise))
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(AppTheme.Colors.textTertiary)
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
            .padding(.vertical, AppTheme.Spacing.medium)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                    .stroke(
                        done ? AppTheme.Colors.successGreen.opacity(0.45) : Color.white.opacity(0.12),
                        lineWidth: 1
                    )
            )
            .opacity(done ? 0.85 : 1.0)
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var finishedBanner: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.medium) {
                Image(systemName: "checkmark.seal.fill")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(AppTheme.Gradients.successButton))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Workout complete")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("Nice. Recovery is part of the plan.")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
            }
        }
    }

    // MARK: - Helpers

    private func detailLine(for exercise: Exercise) -> String {
        if let dur = exercise.durationSeconds {
            return "\(exercise.sets) sets . \(dur)s"
        }
        return "\(exercise.sets) sets . \(exercise.reps) reps"
    }
}

// MARK: - Local progress track

private struct ProgressTrack: View {
    let progress: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 5)
                    .fill(Color.white.opacity(0.10))
                RoundedRectangle(cornerRadius: 5)
                    .fill(AppTheme.Gradients.primaryButton)
                    .frame(width: proxy.size.width * min(max(progress, 0), 1))
                    .animation(.spring(response: 0.5, dampingFraction: 0.85), value: progress)
            }
        }
    }
}

#Preview("WorkoutView - In Progress") {
    WorkoutView()
        .preferredColorScheme(.dark)
}

#Preview("WorkoutView - Finished") {
    let plan = WorkoutPlan(
        title: "Full Body Strength",
        date: Date(),
        estimatedMinutes: 35,
        exercises: MockData.todayWorkout.exercises.map {
            var ex = $0
            ex.isCompleted = true
            return ex
        }
    )
    return WorkoutView(viewModel: WorkoutViewModel(workout: plan))
        .preferredColorScheme(.dark)
}
