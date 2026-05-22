//
//  HabitsView.swift
//  FitMealAI
//
//  Habits tab: header summary + best streak + habit rows with
//  animated check toggle and streak badge.
//

import SwiftUI

struct HabitsView: View {
    @StateObject private var vm: HabitsViewModel

    init(viewModel: HabitsViewModel = HabitsViewModel()) {
        _vm = StateObject(wrappedValue: viewModel)
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "Habits", subtitle: vm.headerLine) {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(AppTheme.Colors.successGreen)
            }

            summaryCard
            habitList
        }
    }

    // MARK: - Sections

    private var summaryCard: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.large) {
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.10), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: vm.progress)
                        .stroke(
                            AppTheme.Gradients.successButton,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: vm.progress)
                    Text("\(Int(vm.progress * 100))%")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }
                .frame(width: 72, height: 72)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's progress")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Text(vm.headerLine)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)

                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.goldStart)
                        Text("Best streak: \(vm.bestStreak) days")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }
                Spacer()
            }
        }
    }

    private var habitList: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            ForEach(vm.habits) { habit in
                habitRow(habit)
            }
        }
    }

    @ViewBuilder
    private func habitRow(_ habit: Habit) -> some View {
        let done = habit.isCompleted

        Button(action: {
            withAnimation(.spring(response: 0.35, dampingFraction: 0.7)) {
                vm.toggle(habit)
            }
        }) {
            HStack(spacing: AppTheme.Spacing.medium) {
                Image(systemName: habit.iconSystemName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle().fill(
                            done
                            ? AnyShapeStyle(AppTheme.Gradients.successButton)
                            : AnyShapeStyle(AppTheme.Colors.accentPurple.opacity(0.7))
                        )
                    )

                VStack(alignment: .leading, spacing: 2) {
                    Text(habit.title)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                        .strikethrough(done, color: AppTheme.Colors.textTertiary)
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(habit.streakDays > 0 ? AppTheme.Colors.goldStart : AppTheme.Colors.textQuaternary)
                        Text(streakLine(for: habit))
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }

                Spacer()

                ZStack {
                    Circle()
                        .strokeBorder(Color.white.opacity(done ? 0 : 0.30), lineWidth: 1.5)
                        .frame(width: 28, height: 28)
                    if done {
                        Circle()
                            .fill(AppTheme.Gradients.successButton)
                            .frame(width: 28, height: 28)
                            .scaleEffect(done ? 1 : 0.6)
                        Image(systemName: "checkmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(.white)
                            .transition(.scale.combined(with: .opacity))
                    }
                }
                .animation(.spring(response: 0.35, dampingFraction: 0.6), value: done)
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
            .opacity(done ? 0.92 : 1.0)
        }
        .buttonStyle(PressableScaleStyle())
    }

    private func streakLine(for habit: Habit) -> String {
        if habit.streakDays == 0 { return "Start your streak today" }
        return "\(habit.streakDays) day streak"
    }
}

#Preview("HabitsView") {
    HabitsView()
        .preferredColorScheme(.dark)
}
