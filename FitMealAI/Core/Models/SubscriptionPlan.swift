//
//  SubscriptionPlan.swift
//  FitMealAI
//
//  Subscription tiers shown on the paywall.
//

import Foundation

enum SubscriptionTier: String, CaseIterable, Identifiable, Codable {
    case free = "Free"
    case silver = "Silver"
    case gold = "Gold"

    var id: String { rawValue }
}

struct SubscriptionPlan: Identifiable, Codable, Hashable {
    let id: UUID
    var tier: SubscriptionTier
    var pricePerMonth: String   // localized display string, e.g. "$0", "$4.99"
    var features: [String]
    var isHighlighted: Bool     // true for Gold

    init(
        id: UUID = UUID(),
        tier: SubscriptionTier,
        pricePerMonth: String,
        features: [String],
        isHighlighted: Bool = false
    ) {
        self.id = id
        self.tier = tier
        self.pricePerMonth = pricePerMonth
        self.features = features
        self.isHighlighted = isHighlighted
    }
}
