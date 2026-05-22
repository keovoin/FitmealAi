//
//  PaywallViewModel.swift
//  FitMealAI
//
//  Owns the paywall plan list and the user's current selection.
//  StoreKit 2 / restore / ABA actions are stubbed - Phase 3 will wire
//  them through SubscriptionManager + PaymentService.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class PaywallViewModel: ObservableObject {

    @Published var plans: [SubscriptionPlan]
    @Published var selectedTier: SubscriptionTier
    @Published private(set) var isPurchasing: Bool = false
    @Published private(set) var isRestoring: Bool = false
    @Published var errorMessage: String? = nil

    init(
        plans: [SubscriptionPlan] = MockData.plans,
        defaultSelection: SubscriptionTier = .gold
    ) {
        self.plans = plans
        self.selectedTier = defaultSelection
    }

    // MARK: - Derived

    var selectedPlan: SubscriptionPlan? {
        plans.first(where: { $0.tier == selectedTier })
    }

    var primaryButtonTitle: String {
        guard let plan = selectedPlan else { return "Choose a plan" }
        switch plan.tier {
        case .free:   return "Continue with Free"
        case .silver: return "Subscribe to Silver"
        case .gold:   return "Subscribe to Gold"
        }
    }

    // MARK: - Intents

    func select(_ tier: SubscriptionTier) {
        selectedTier = tier
        errorMessage = nil
    }

    /// Stub for StoreKit 2 purchase. Phase-3 will replace this with
    /// SubscriptionManager.purchase(productId:).
    func purchase() async -> Bool {
        guard !isPurchasing else { return false }
        isPurchasing = true
        defer { isPurchasing = false }
        try? await Task.sleep(nanoseconds: 700_000_000)
        return true
    }

    /// Stub for restoring previous purchases.
    func restore() async {
        guard !isRestoring else { return }
        isRestoring = true
        defer { isRestoring = false }
        try? await Task.sleep(nanoseconds: 500_000_000)
    }
}
