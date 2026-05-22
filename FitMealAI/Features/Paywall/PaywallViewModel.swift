//
//  PaywallViewModel.swift
//  FitMealAI
//
//  Owns the paywall plan list and the user's current selection.
//  Wires through SubscriptionManager for real StoreKit 2 purchase
//  + restore. Falls back to a stub when no SubscriptionManager is
//  injected (preview / unit tests).
//

import Foundation
import Combine

@MainActor
final class PaywallViewModel: ObservableObject {

    @Published var plans: [SubscriptionPlan]
    @Published var selectedTier: SubscriptionTier
    @Published private(set) var isPurchasing: Bool = false
    @Published private(set) var isRestoring: Bool = false
    @Published private(set) var isLoadingProducts: Bool = false
    @Published var errorMessage: String? = nil

    private let subscriptionManager: SubscriptionManager?

    init(
        plans: [SubscriptionPlan] = MockData.plans,
        defaultSelection: SubscriptionTier = .gold,
        subscriptionManager: SubscriptionManager? = nil
    ) {
        self.plans = plans
        self.selectedTier = defaultSelection
        self.subscriptionManager = subscriptionManager
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

    /// Loads StoreKit products and prices. Safe to call multiple times.
    func loadProducts() async {
        guard let manager = subscriptionManager else { return }
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        await manager.loadProducts()
        if let err = manager.loadError {
            errorMessage = err
        }
    }

    /// Initiates the StoreKit 2 purchase flow. Returns true on success.
    /// Falls back to a 700ms simulated success when no SubscriptionManager
    /// is wired in (preview previews / unit tests).
    func purchase() async -> Bool {
        guard !isPurchasing else { return false }
        guard let manager = subscriptionManager else {
            // Preview path
            isPurchasing = true
            defer { isPurchasing = false }
            try? await Task.sleep(nanoseconds: 700_000_000)
            return true
        }
        isPurchasing = true
        defer { isPurchasing = false }
        errorMessage = nil
        do {
            _ = try await manager.purchase(selectedTier)
            return true
        } catch SubscriptionManager.PurchaseError.userCancelled {
            // Don't surface a noisy error if the user just bailed.
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    /// Restores any previously-bought subscription via StoreKit 2.
    func restore() async {
        guard !isRestoring else { return }
        guard let manager = subscriptionManager else {
            // Preview path
            isRestoring = true
            defer { isRestoring = false }
            try? await Task.sleep(nanoseconds: 500_000_000)
            return
        }
        isRestoring = true
        defer { isRestoring = false }
        errorMessage = nil
        do {
            try await manager.restore()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
