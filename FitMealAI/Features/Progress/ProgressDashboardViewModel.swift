//
//  ProgressDashboardViewModel.swift
//  FitMealAI
//
//  Owns the metrics shown on the Progress tab: weight trend, average
//  calories, completion rate, plus the period switcher state.
//
//  Data is sample data only - Phase-3 will wire this up to a real
//  data store. No SwiftUI imports; portable to Compose later.
//

import Foundation
import Combine

enum ProgressPeriod: String, CaseIterable, Identifiable {
    case week     = "Week"
    case month    = "Month"
    case quarter  = "3 Months"

    var id: String { rawValue }
}

/// One sample on the weight trend chart.
struct WeightSample: Identifiable, Hashable {
    let id = UUID()
    let label: String        // e.g. "Mon", "W2", "Apr"
    let weightKg: Double
}

struct PeriodMetrics: Hashable {
    let weightSeries: [WeightSample]
    let avgCalories: Int
    let completionRate: Double  // 0...1
    let workoutsCompleted: Int
    let workoutsTarget: Int
}

@MainActor
final class ProgressDashboardViewModel: ObservableObject {

    @Published var period: ProgressPeriod = .week
    @Published var tier: SubscriptionTier

    private let dataset: [ProgressPeriod: PeriodMetrics]

    init(tier: SubscriptionTier = .free, dataset: [ProgressPeriod: PeriodMetrics]? = nil) {
        self.tier = tier
        self.dataset = dataset ?? Self.defaultDataset()
    }

    // MARK: - Derived

    var current: PeriodMetrics {
        dataset[period] ?? dataset[.week]!
    }

    /// Current vs first sample. Negative is weight loss.
    var weightDelta: Double {
        let series = current.weightSeries
        guard let first = series.first?.weightKg, let last = series.last?.weightKg else { return 0 }
        return last - first
    }

    var startWeight: Double  { current.weightSeries.first?.weightKg ?? 0 }
    var latestWeight: Double { current.weightSeries.last?.weightKg ?? 0 }

    var advancedAnalyticsLocked: Bool { tier != .gold }

    // MARK: - Intents

    func setPeriod(_ p: ProgressPeriod) { period = p }

    // MARK: - Default sample dataset

    private static func defaultDataset() -> [ProgressPeriod: PeriodMetrics] {
        [
            .week: PeriodMetrics(
                weightSeries: [
                    WeightSample(label: "Mon", weightKg: 76.4),
                    WeightSample(label: "Tue", weightKg: 76.2),
                    WeightSample(label: "Wed", weightKg: 76.0),
                    WeightSample(label: "Thu", weightKg: 75.9),
                    WeightSample(label: "Fri", weightKg: 75.6),
                    WeightSample(label: "Sat", weightKg: 75.5),
                    WeightSample(label: "Sun", weightKg: 75.3)
                ],
                avgCalories: 1980,
                completionRate: 0.78,
                workoutsCompleted: 4,
                workoutsTarget: 5
            ),
            .month: PeriodMetrics(
                weightSeries: [
                    WeightSample(label: "W1", weightKg: 77.1),
                    WeightSample(label: "W2", weightKg: 76.6),
                    WeightSample(label: "W3", weightKg: 75.9),
                    WeightSample(label: "W4", weightKg: 75.3)
                ],
                avgCalories: 2010,
                completionRate: 0.71,
                workoutsCompleted: 16,
                workoutsTarget: 20
            ),
            .quarter: PeriodMetrics(
                weightSeries: [
                    WeightSample(label: "Feb", weightKg: 79.0),
                    WeightSample(label: "Mar", weightKg: 77.3),
                    WeightSample(label: "Apr", weightKg: 75.3)
                ],
                avgCalories: 2050,
                completionRate: 0.69,
                workoutsCompleted: 48,
                workoutsTarget: 60
            )
        ]
    }
}
