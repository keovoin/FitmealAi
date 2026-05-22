//
//  ABAPaymentViewModel.swift
//  FitMealAI
//
//  Drives the manual ABA payment screen. Validates the transaction ID,
//  tracks whether the user has attached a screenshot, and submits the
//  PaymentRequest to a stubbed PaymentService.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class ABAPaymentViewModel: ObservableObject {

    // MARK: - Static merchant info (Phase-3 will load from a config file)

    let merchantName: String = "FitMeal AI"
    let merchantId: String = "ABA-FITMEAL-001"
    let merchantAccount: String = "000 123 456"

    // MARK: - Published state

    @Published var request: PaymentRequest
    @Published var isSubmitting: Bool = false
    @Published var errorMessage: String? = nil

    init(tier: SubscriptionTier = .gold, amount: String = "$9.99") {
        self.request = PaymentRequest(tier: tier, amount: amount)
    }

    // MARK: - Derived

    var canSubmit: Bool {
        !isSubmitting
        && trimmedTransactionId.count >= 4
        && request.screenshotFileName != nil
        && request.status != .pending
    }

    var trimmedTransactionId: String {
        request.transactionId.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var planLine: String {
        "FitMeal \(request.tier.rawValue) . \(request.amount)/mo"
    }

    // MARK: - Intents

    func attachScreenshotPlaceholder() {
        // Phase-3 wires the iOS PhotosPicker. For now we store a fake filename
        // so the form can advance.
        request.screenshotFileName = "receipt-\(Int(Date().timeIntervalSince1970)).png"
    }

    func clearScreenshot() {
        request.screenshotFileName = nil
    }

    /// Stub for the manual approval submit. Phase-3 will POST to backend.
    func submit() async -> Bool {
        guard canSubmit else { return false }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        try? await Task.sleep(nanoseconds: 700_000_000)

        request.transactionId = trimmedTransactionId
        request.status = .pending
        request.submittedAt = Date()
        return true
    }
}
