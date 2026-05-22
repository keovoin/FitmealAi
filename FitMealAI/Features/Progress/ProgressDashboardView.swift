//
//  ProgressDashboardView.swift
//  FitMealAI
//
//  Progress tab. Period switcher (Week / Month / 3 Months), weight
//  trend line chart, completion + calories cards, and a Gold-locked
//  advanced analytics card.
//

import SwiftUI

struct ProgressDashboardView: View {
    @StateObject private var vm: ProgressDashboardViewModel

    var onUpgradeTapped: (() -> Void)? = nil

    init(
        viewModel: ProgressDashboardViewModel = ProgressDashboardViewModel(),
        onUpgradeTapped: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onUpgradeTapped = onUpgradeTapped
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "Progress", subtitle: "Your journey at a glance") {
                Image(systemName: "chart.line.uptrend.xyaxis")
                    .foregroundStyle(AppTheme.Colors.accentBlue)
            }

            periodPicker
            weightCard
            statsRow
            workoutsCard
            advancedAnalyticsCard
        }
    }

    // MARK: - Sections

    private var periodPicker: some View {
        SegmentedPicker(
            options: ProgressPeriod.allCases.map { $0.rawValue },
            selection: Binding(
                get: { vm.period.rawValue },
                set: { newValue in
                    if let p = ProgressPeriod(rawValue: newValue) {
                        withAnimation(.easeInOut(duration: 0.25)) { vm.setPeriod(p) }
                    }
                }
            )
        )
    }

    private var weightCard: some View {
        let delta = vm.weightDelta
        let isLoss = delta < 0
        let deltaText = String(format: "%@%.1f kg", isLoss ? "-" : "+", abs(delta))
        let deltaColor: Color = isLoss ? AppTheme.Colors.successGreen : AppTheme.Colors.errorRed

        return GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Weight trend")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        Text(String(format: "%.1f kg", vm.latestWeight))
                            .font(AppTheme.Typography.title)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                    }
                    Spacer()
                    Tag(
                        title: deltaText,
                        icon: isLoss ? "arrow.down" : "arrow.up",
                        variant: isLoss ? .green : .red,
                        isActive: true
                    )
                }

                LineTrendChart(samples: vm.current.weightSeries)
                    .frame(height: 140)
                    .padding(.top, AppTheme.Spacing.xSmall)

                HStack {
                    statColumn("Start", value: String(format: "%.1f kg", vm.startWeight))
                    Spacer()
                    statColumn("Latest", value: String(format: "%.1f kg", vm.latestWeight))
                    Spacer()
                    statColumn("Change", value: deltaText, color: deltaColor)
                }
                .padding(.top, AppTheme.Spacing.xSmall)
            }
        }
    }

    private var statsRow: some View {
        HStack(spacing: AppTheme.Spacing.medium) {
            statCard(
                title: "Avg calories",
                value: "\(vm.current.avgCalories)",
                unit: "kcal/day",
                accent: AppTheme.Colors.accentPurple,
                icon: "flame.fill"
            )
            statCard(
                title: "Completion",
                value: "\(Int(vm.current.completionRate * 100))%",
                unit: "of plan",
                accent: AppTheme.Colors.successGreen,
                icon: "checkmark.seal.fill"
            )
        }
    }

    private var workoutsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Text("Workouts")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Spacer()
                    Text("\(vm.current.workoutsCompleted) / \(vm.current.workoutsTarget)")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                }

                ProgressTrack(progress: progressFraction)
                    .frame(height: 8)
            }
        }
    }

    private var advancedAnalyticsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
                HStack(spacing: AppTheme.Spacing.medium) {
                    ZStack {
                        Image(systemName: "chart.bar.xaxis")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Circle().fill(AppTheme.Gradients.gold))
                        if vm.advancedAnalyticsLocked {
                            Image(systemName: "lock.fill")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white)
                                .padding(4)
                                .background(Circle().fill(Color.black.opacity(0.55)))
                                .offset(x: 16, y: 16)
                        }
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Advanced analytics")
                            .font(AppTheme.Typography.headline)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text(vm.advancedAnalyticsLocked
                             ? "Macros, recovery, and trend forecasts."
                             : "Macros, recovery, and trend forecasts unlocked.")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                    Spacer()
                }

                if vm.advancedAnalyticsLocked {
                    PrimaryButton(title: "Unlock with Gold", icon: "sparkles") {
                        onUpgradeTapped?()
                    }
                } else {
                    SecondaryGlassButton(title: "Open analytics", icon: "arrow.right") {}
                }
            }
        }
        .overlay(alignment: .topTrailing) {
            if vm.advancedAnalyticsLocked {
                // Half-visible decorative lock from React design.
                Image(systemName: "lock.fill")
                    .font(.system(size: 80, weight: .bold))
                    .foregroundStyle(AppTheme.Colors.goldStart.opacity(0.20))
                    .offset(x: 16, y: -16)
                    .allowsHitTesting(false)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: AppTheme.Radius.card, style: .continuous))
    }

    // MARK: - Helpers

    private var progressFraction: Double {
        let target = max(vm.current.workoutsTarget, 1)
        return Double(vm.current.workoutsCompleted) / Double(target)
    }

    @ViewBuilder
    private func statColumn(_ label: String, value: String, color: Color = AppTheme.Colors.textPrimary) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textTertiary)
            Text(value)
                .font(AppTheme.Typography.body.weight(.semibold))
                .foregroundStyle(color)
        }
    }

    @ViewBuilder
    private func statCard(title: String, value: String, unit: String, accent: Color, icon: String) -> some View {
        GlassCard(padding: AppTheme.Spacing.medium) {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Image(systemName: icon)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 28, height: 28)
                        .background(Circle().fill(accent.opacity(0.85)))
                    Spacer()
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Text(value)
                        .font(AppTheme.Typography.title)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text(unit)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textTertiary)
                }
            }
        }
    }
}

// MARK: - Lightweight line chart drawn with Path

private struct LineTrendChart: View {
    let samples: [WeightSample]

    var body: some View {
        GeometryReader { proxy in
            let w = proxy.size.width
            let h = proxy.size.height

            let values = samples.map { $0.weightKg }
            let minV = values.min() ?? 0
            let maxV = values.max() ?? 1
            let range = max(maxV - minV, 0.001)
            let step = samples.count > 1 ? w / CGFloat(samples.count - 1) : w

            // Compute the chart path
            let points: [CGPoint] = samples.enumerated().map { idx, sample in
                let x = CGFloat(idx) * step
                let y = h - (CGFloat(sample.weightKg - minV) / CGFloat(range)) * (h - 12) - 6
                return CGPoint(x: x, y: y)
            }

            ZStack {
                // Filled area
                Path { path in
                    guard let first = points.first else { return }
                    path.move(to: CGPoint(x: first.x, y: h))
                    for p in points { path.addLine(to: p) }
                    path.addLine(to: CGPoint(x: points.last?.x ?? 0, y: h))
                    path.closeSubpath()
                }
                .fill(
                    LinearGradient(
                        colors: [AppTheme.Colors.accentPurple.opacity(0.45), AppTheme.Colors.accentPurple.opacity(0.0)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )

                // Line
                Path { path in
                    guard let first = points.first else { return }
                    path.move(to: first)
                    for p in points.dropFirst() { path.addLine(to: p) }
                }
                .stroke(
                    AppTheme.Gradients.primaryButton,
                    style: StrokeStyle(lineWidth: 2.5, lineCap: .round, lineJoin: .round)
                )

                // Endpoint dot
                if let last = points.last {
                    Circle()
                        .fill(.white)
                        .frame(width: 8, height: 8)
                        .position(last)
                        .shadow(color: AppTheme.Colors.accentPurple.opacity(0.6), radius: 6)
                }

                // X labels along the bottom
                HStack {
                    ForEach(samples) { sample in
                        Text(sample.label)
                            .font(.system(size: 10))
                            .foregroundStyle(AppTheme.Colors.textTertiary)
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(maxHeight: .infinity, alignment: .bottom)
            }
        }
    }
}

// MARK: - Local progress track (duplicated minimal version - kept private)

private struct ProgressTrack: View {
    let progress: Double

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.10))
                RoundedRectangle(cornerRadius: 4)
                    .fill(AppTheme.Gradients.successButton)
                    .frame(width: proxy.size.width * min(max(progress, 0), 1))
                    .animation(.spring(response: 0.5, dampingFraction: 0.85), value: progress)
            }
        }
    }
}

#Preview("ProgressDashboard - Free") {
    ProgressDashboardView(viewModel: ProgressDashboardViewModel(tier: .free))
        .preferredColorScheme(.dark)
}

#Preview("ProgressDashboard - Gold") {
    ProgressDashboardView(viewModel: ProgressDashboardViewModel(tier: .gold))
        .preferredColorScheme(.dark)
}
