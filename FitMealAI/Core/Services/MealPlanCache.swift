//
//  MealPlanCache.swift
//  FitMealAI
//
//  Persists today's AI-generated meal plan to disk so users can read
//  it without network. The cache is keyed by date string (YYYY-MM-DD)
//  and auto-evicts entries older than 7 days on each write.
//
//  Storage: JSON file in Application Support/meal-plan-cache/
//

import Foundation

@MainActor
final class MealPlanCache {

    static let shared = MealPlanCache()

    private let directory: URL
    private let maxAgeDays = 7

    private init() {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        directory = support.appendingPathComponent("meal-plan-cache", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    // MARK: - Public API

    /// Save a meal plan for a specific date.
    func save(_ plan: CachedMealPlan, for date: String) {
        let url = fileURL(for: date)
        if let data = try? JSONEncoder().encode(plan) {
            try? data.write(to: url, options: .atomic)
        }
        evictOldEntries()
    }

    /// Load the cached meal plan for a date. Returns nil if not cached or expired.
    func load(for date: String) -> CachedMealPlan? {
        let url = fileURL(for: date)
        guard let data = try? Data(contentsOf: url),
              let plan = try? JSONDecoder().decode(CachedMealPlan.self, from: data) else {
            return nil
        }
        // Check freshness
        let age = Date().timeIntervalSince(plan.cachedAt)
        if age > Double(maxAgeDays * 24 * 60 * 60) {
            try? FileManager.default.removeItem(at: url)
            return nil
        }
        return plan
    }

    /// Load today's cached plan (convenience).
    func loadToday() -> CachedMealPlan? {
        load(for: todayString())
    }

    /// Clear all cached plans.
    func clearAll() {
        let files = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? []
        for file in files {
            try? FileManager.default.removeItem(at: file)
        }
    }

    // MARK: - Internals

    private func fileURL(for date: String) -> URL {
        directory.appendingPathComponent("\(date).json")
    }

    private func evictOldEntries() {
        let files = (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: [.creationDateKey])) ?? []
        let cutoff = Date().addingTimeInterval(-Double(maxAgeDays * 24 * 60 * 60))
        for file in files {
            if let attrs = try? FileManager.default.attributesOfItem(atPath: file.path),
               let created = attrs[.creationDate] as? Date,
               created < cutoff {
                try? FileManager.default.removeItem(at: file)
            }
        }
    }

    private func todayString() -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: Date())
    }
}

/// Codable wrapper around the meal plan for disk persistence.
struct CachedMealPlan: Codable {
    let dateLabel: String
    let meals: [CachedMeal]
    let cachedAt: Date

    struct CachedMeal: Codable {
        let id: String
        let type: String
        let title: String
        let description: String?
        let calories: Int
        let proteinGrams: Int
        let carbsGrams: Int
        let fatGrams: Int
        let imageUrl: String?
        let ingredients: [CachedIngredient]
        let recipeSteps: [String]
    }

    struct CachedIngredient: Codable {
        let name: String
        let grams: Int
        let calories: Int
        let proteinGrams: Int
        let carbsGrams: Int
        let fatGrams: Int
    }
}
