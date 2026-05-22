//
//  SubscriptionManager.swift
//  FitMealAI
//
//  Real StoreKit 2 wiring for the in-app subscription products. Replaces
//  the Phase-3 stubs in PaywallViewModel.
//
//  Product IDs to create in App Store Connect (matching Android Play
//  Console product IDs):
//
//      fitmeal.silver.monthly   ($4.99 / mo)
//      fitmeal.gold.monthly     ($9.99 / mo)
//
//  Add a single 'Subscription Group' in App Store Connect that contains
//  both products, so users can upgrade between Silver and Gold without
//  cancelling first.
//

import Foundation
import StoreKit

@MainActor
final class SubscriptionManager: ObservableObject {

    // Public product IDs - mirror these in Play Console too.
    static let silverProductId = "fitmeal.silver.monthly"
    static let goldProductId   = "fitmeal.gold.monthly"
    static let allProductIds: Set<String> = [silverProductId, goldProductId]

    @Published private(set) var products: [Product] = []
    @Published private(set) var activeTier: SubscriptionTier = .free
    @Published private(set) var loadError: String?

    private var transactionUpdates: Task<Void, Never>?

    init() {
        // Listen for transactions that arrive outside our purchase flow
        // (e.g. parental approval, family sharing, store renewals).
        transactionUpdates = Task.detached(priority: .background) { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let txn) = result {
                    await self?.applyTransaction(txn)
                    await txn.finish()
                }
            }
        }
    }

    deinit {
        transactionUpdates?.cancel()
    }

    // MARK: - Loading

    func loadProducts() async {
        do {
            let fetched = try await Product.products(for: SubscriptionManager.allProductIds)
            // Order Silver before Gold so the paywall list lines up visually.
            products = fetched.sorted { lhs, rhs in
                lhs.price < rhs.price
            }
            loadError = nil
        } catch {
            loadError = error.localizedDescription
        }
    }

    /// Iterates all currently-entitled transactions and updates `activeTier`.
    /// Call this on app start (RootView) and after a successful purchase.
    func refreshActiveTier() async {
        var resolved: SubscriptionTier = .free
        for await result in Transaction.currentEntitlements {
            guard case .verified(let txn) = result else { continue }
            // Highest tier wins.
            switch txn.productID {
            case SubscriptionManager.goldProductId:
                resolved = .gold
            case SubscriptionManager.silverProductId where resolved != .gold:
                resolved = .silver
            default:
                break
            }
        }
        activeTier = resolved
    }

    // MARK: - Purchase

    /// Initiates a StoreKit 2 purchase for the given tier. Returns the
    /// resolved tier on success, or throws on failure / user cancel.
    @discardableResult
    func purchase(_ tier: SubscriptionTier) async throws -> SubscriptionTier {
        guard tier != .free else { return .free }
        let productId = (tier == .gold)
            ? SubscriptionManager.goldProductId
            : SubscriptionManager.silverProductId
        guard let product = products.first(where: { $0.id == productId }) else {
            // Try a fresh load in case .loadProducts was skipped.
            await loadProducts()
            guard let retried = products.first(where: { $0.id == productId }) else {
                throw PurchaseError.productUnavailable
            }
            return try await complete(product: retried)
        }
        return try await complete(product: product)
    }

    private func complete(product: Product) async throws -> SubscriptionTier {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let txn):
                await applyTransaction(txn)
                await txn.finish()
                return activeTier
            case .unverified(_, let err):
                throw err
            }
        case .userCancelled:
            throw PurchaseError.userCancelled
        case .pending:
            throw PurchaseError.pendingApproval
        @unknown default:
            throw PurchaseError.unknownState
        }
    }

    private func applyTransaction(_ txn: Transaction) async {
        switch txn.productID {
        case SubscriptionManager.goldProductId:
            activeTier = .gold
        case SubscriptionManager.silverProductId where activeTier != .gold:
            activeTier = .silver
        default:
            break
        }
    }

    // MARK: - Restore

    func restore() async throws {
        try await AppStore.sync()
        await refreshActiveTier()
    }

    enum PurchaseError: LocalizedError {
        case productUnavailable
        case userCancelled
        case pendingApproval
        case unknownState

        var errorDescription: String? {
            switch self {
            case .productUnavailable:
                return "That subscription isn't available right now. Try again later."
            case .userCancelled:
                return "Purchase canceled."
            case .pendingApproval:
                return "Your purchase is awaiting approval (Family Sharing or Ask to Buy)."
            case .unknownState:
                return "Unknown StoreKit response."
            }
        }
    }
}
