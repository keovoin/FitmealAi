//
//  HomeDashboardView.swift
//  FitMealAI
//
//  Home tab: greeting, calorie ring, today's meal/workout/habits,
//  upgrade banner for Free users, and AI regenerate button.
//

import SwiftUI

struct HomeDashboardView: View {
    @StateObject private var vm: HomeDashboardViewModel
    @EnvironmentObject private var appState: AppState
    @State private var isShuffling = false
    @State private var isGenerating = false

    var onOpenMeals: (() -> Void)? = nil
    var onOpenWorkout: (() -> Void)? = nil
    var onOpenHabits: (() -> Void)? = nil
    var onUpgradeTapped: (() -> Void)? = nil
    var onRegenerateTapped: (() -> Void)? = nil

    init(
        viewModel: HomeDashboardViewModel = HomeDashboardViewModel(),
        onOpenMeals: (() -> Void)? = nil,
        onOpenWorkout: (() -> Void)? = nil,
        onOpenHabits: (() -> Void)? = nil,
        onUpgradeTapped: (() -> Void)? = nil,
        onRegenerateTapped: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onOpenMeals = onOpenMeals
        self.onOpenWorkout = onOpenWorkout
        self.onOpenHabits = onOpenHabits
        self.onUpgradeTapped = onUpgradeTapped
        self.onRegenerateTapped = onRegenerateTapped
    }

    var body: some View {
        ScreenContainer(showGlows: true) {
            header
            caloriesCard
            mealCard
            workoutCard
            habitsCard
            if vm.showsUpgradeBanner {
                upgradeBanner
            }
            if let error = vm.errorMessage {
                Text(error)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.errorRed)
            }
            actionRow
        }
        .task {
            await vm.loadLiveProfile(authService: appState.authService)
            await appState.refreshQuotas()
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(vm.greeting), \(vm.user.name)")
                .font(AppTheme.Typography.largeTitle)
                .foregroundStyle(AppTheme.Colors.textPrimary)
            Text(vm.dateLine)
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
    }

    private var caloriesCard: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.large) {
                CalorieRing(progress: vm.calorieProgress)
                    .frame(width: 88, height: 88)

                VStack(alignment: .leading, spacing: 4) {
                    Text("Today's calories")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Text("\(vm.caloriesConsumed) / \(vm.calorieGoal)")
                        .font(AppTheme.Typography.title)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("\(vm.caloriesRemaining) kcal remaining")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.successGreen)
                }
                Spacer()
            }
        }
    }

    private var mealCard: some View {
        Button(action: { onOpenMeals?() }) {
            GlassCard {
                summaryRow(
                    icon: "fork.knife",
                    accent: AppTheme.Colors.accentPurple,
                    label: "Meals",
                    title: vm.nextMealTitle,
                    detail: "\(vm.mealPlan.meals.count) meals planned"
                )
            }
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var workoutCard: some View {
        Button(action: { onOpenWorkout?() }) {
            GlassCard {
                summaryRow(
                    icon: "figure.strengthtraining.traditional",
                    accent: AppTheme.Colors.accentBlue,
                    label: "Workout",
                    title: vm.workout.title,
                    detail: "\(vm.workout.estimatedMinutes) min . \(vm.workout.exercises.count) exercises"
                )
            }
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var habitsCard: some View {
        Button(action: { onOpenHabits?() }) {
            GlassCard {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.successGreen)
                        Text("Habits")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        Spacer()
                        Text("\(vm.habitsCompletedCount) / \(vm.habits.count)")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                    HabitProgressBar(progress: vm.habitsProgress)
                        .frame(height: 8)
                }
            }
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var upgradeBanner: some View {
        Button(action: { onUpgradeTapped?() }) {
            HStack(spacing: AppTheme.Spacing.medium) {
                Image(systemName: "sparkles")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(AppTheme.Gradients.gold))

                VStack(alignment: .leading, spacing: 2) {
                    Text("Unlock Gold")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("Unlimited regenerations, advanced analytics")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundStyle(AppTheme.Colors.textTertiary)
            }
            .padding(AppTheme.Spacing.medium)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.card, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.card, style: .continuous)
                    .stroke(AppTheme.Colors.goldStart.opacity(0.5), lineWidth: 1)
            )
            .shadow(color: AppTheme.Colors.goldStart.opacity(0.18), radius: 18, y: 8)
        }
        .buttonStyle(PressableScaleStyle())
    }

    // MARK: - Quota action row

    /// Two-up action row mirroring `HomeScreen.kt` on Android.
    ///
    /// ```
    ///   ┌─────────────────────┐  ┌─────────────────────┐
    ///   │ 🔀 Shuffle (8 left) │  │ ✨ Generate (1 left)│
    ///   ├─────────────────────┤  ├─────────────────────┤
    ///   │ 2 of 10 used today  │  │ 0 of 1 used today   │
    ///   └─────────────────────┘  └─────────────────────┘
    /// ```
    ///
    /// Hides the Shuffle column entirely when the catalog is too small
    /// (server returned 503 catalog_not_ready on a previous attempt) so
    /// users don't tap into a known dead-end.
    private var actionRow: some View {
        let quota = appState.quotaState
        return HStack(alignment: .top, spacing: AppTheme.Spacing.medium) {
            if !quota.catalogNotReady {
                quotaButtonColumn(
                    title: "🔀  \(shuffleButtonLabel(quota.shuffles))",
                    subtitle: quota.shuffles.subtitle,
                    isPrimary: false,
                    isLoading: isShuffling,
                    isDisabled: isShuffling,
                    accessibilityID: "ios-home-shuffle-button",
                    action: handleShuffleTap,
                )
            }
            quotaButtonColumn(
                title: "✨  \(generateButtonLabel(quota.ai, isGenerating: isGenerating))",
                subtitle: quota.ai.subtitle,
                isPrimary: true,
                isLoading: isGenerating,
                isDisabled: isGenerating,
                accessibilityID: "ios-home-generate-button",
                action: handleGenerateTap,
            )
        }
    }

    @ViewBuilder
    private func quotaButtonColumn(
        title: String,
        subtitle: String,
        isPrimary: Bool,
        isLoading: Bool,
        isDisabled: Bool,
        accessibilityID: String,
        action: @escaping () -> Void,
    ) -> some View {
        VStack(spacing: 6) {
            if isPrimary {
                PrimaryButton(
                    title: title,
                    isLoading: isLoading,
                    isDisabled: isDisabled,
                    action: action,
                )
            } else {
                SecondaryGlassButton(
                    title: title,
                    isDisabled: isDisabled,
                    action: action,
                )
            }
            Text(subtitle)
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textSecondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
                .accessibilityIdentifier("\(accessibilityID)-subtitle")
        }
        .accessibilityIdentifier(accessibilityID)
    }

    private func handleShuffleTap() {
        let quota = appState.quotaState
        guard !quota.shuffles.isExhausted else {
            appState.activeSheet = .paywall
            onUpgradeTapped?()
            return
        }
        let targetType = vm.mealPlan.meals.first?.type ?? .lunch
        Task { await runShuffle(mealType: targetType) }
    }

    private func handleGenerateTap() {
        let quota = appState.quotaState
        guard !quota.ai.isExhausted else {
            appState.activeSheet = .paywall
            onUpgradeTapped?()
            return
        }
        // Preserve the existing `onRegenerateTapped` callback so any
        // navigation-side wiring (MainTabView swaps to the Meals tab)
        // still fires.
        onRegenerateTapped?()
        Task { await runGenerate() }
    }

    private func runShuffle(mealType: MealType) async {
        isShuffling = true
        defer { isShuffling = false }
        do {
            let result = try await appState.shuffleService.shuffle(
                mealType: mealType,
                count: appState.quotaState.shuffleMealCount,
            )
            vm.applyShuffleResult(result)
            appState.applyShuffleCounter(result.shuffles)
        } catch let error as QuotaServiceError {
            switch error {
            case .dailyCapReached(let counter):
                // Mirror server-side counter, then pop the paywall.
                appState.applyShuffleCounter(counter)
                appState.activeSheet = .paywall
                onUpgradeTapped?()
            case .catalogNotReady:
                appState.markCatalogNotReady()
            default:
                vm.errorMessage = error.localizedDescription
            }
        } catch {
            vm.errorMessage = error.localizedDescription
        }
    }

    private func runGenerate() async {
        isGenerating = true
        defer { isGenerating = false }
        await vm.regeneratePlan(
            aiService: appState.aiService,
            mealPrefs: appState.preferencesStore.meal,
        )
        // Mirror locally and kick off a background refresh so the
        // counter stays in sync even though /api/ai/meal-plan doesn't
        // echo the post-bump quota.
        if vm.errorMessage == nil {
            appState.applyAiUsedLocally()
            Task { await appState.refreshQuotas() }
        }
    }

    private func shuffleButtonLabel(_ counter: QuotaCounter) -> String {
        if counter.unlimited { return "Shuffle" }
        if counter.isExhausted { return "Upgrade" }
        return "Shuffle (\(counter.remaining) left)"
    }

    private func generateButtonLabel(_ counter: QuotaCounter, isGenerating: Bool) -> String {
        if isGenerating { return "Generating…" }
        if counter.unlimited { return "Generate" }
        if counter.isExhausted { return "Upgrade" }
        return "Generate (\(counter.remaining) left)"
    }

    // MARK: - Helpers

    @ViewBuilder
    private func summaryRow(icon: String, accent: Color, label: String, title: String, detail: String) -> some View {
        HStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(Circle().fill(accent.opacity(0.85)))

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                Text(title)
                    .font(AppTheme.Typography.headline)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                    .lineLimit(1)
                Text(detail)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(AppTheme.Colors.textTertiary)
        }
    }
}

// MARK: - Local components

private struct CalorieRing: View {
    let progress: Double

    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.white.opacity(0.10), lineWidth: 9)
            Circle()
                .trim(from: 0, to: progress)
                .stroke(
                    AngularGradient(
                        colors: [AppTheme.Colors.accentBlue, AppTheme.Colors.accentPurple],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: 9, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
                .animation(.spring(response: 0.6, dampingFraction: 0.8), value: progress)

            Text("\(Int(progress * 100))%")
                .font(.system(size: 16, weight: .bold))
                .foregroundStyle(AppTheme.Colors.textPrimary)
        }
    }
}

private struct HabitProgressBar: View {
    let progress: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.10))
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.Gradients.successButton)
                    .frame(width: proxy.size.width * progress)
                    .animation(.spring(response: 0.5, dampingFraction: 0.85), value: progress)
            }
        }
    }
}

#Preview("HomeDashboardView - Free") {
    HomeDashboardView(viewModel: HomeDashboardViewModel(tier: .free))
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}

#Preview("HomeDashboardView - Gold") {
    HomeDashboardView(viewModel: HomeDashboardViewModel(tier: .gold))
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}
