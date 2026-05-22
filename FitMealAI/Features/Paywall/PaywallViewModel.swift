//
//  PaywallViewModel.swift
//  FitMealAI
//
//  Owns the paywall plan list and the user's current selection.
//  Wires through SubscriptionManager for real StoreKit 2 purchase
//  + restore. Calls PaymentOptionsService to find out which payment
//  methods (ABA / KHQR) are available for the current user before
//  rendering the secondary actions.
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
    @Published private(set) var paymentOptions: PaymentOptions = .unavailable

    private let subscriptionManager: SubscriptionManager?
    private let paymentOptionsService: PaymentOptionsService?

    init(
        plans: [SubscriptionPlan] = MockData.plans,
        defaultSelection: SubscriptionTier = .gold,
        subscriptionManager: SubscriptionManager? = nil,
        paymentOptionsService: PaymentOptionsService? = nil
    ) {
        self.plans = plans
        self.selectedTier = defaultSelection
        self.subscriptionManager = subscriptionManager
        self.paymentOptionsService = paymentOptionsService
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

    /// Whether to show the "Pay with ABA (manual)" secondary button.
    /// True only when the admin has the toggle on AND the caller's
    /// resolved country is on the allow-list.
    var isAbaPaymentAvailable: Bool {
        // Default-true for previews so the SwiftUI #Preview still renders
        // both buttons; the live path overrides this once the options
        // service has responded.
        guard paymentOptionsService != nil else { return true }
        return paymentOptions.aba_payment.available_for_user
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

    /// Refreshes the per-user payment availability flags. Safe to call
    /// multiple times; the server endpoint is uncached.
    func refreshPaymentOptions() async {
        guard let service = paymentOptionsService else { return }
        let next = await service.fetch()
        paymentOptions = next
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
