//
//  ABAPaymentViewModel.swift
//  FitMealAI
//
//  Drives the manual ABA payment screen. Validates the transaction ID,
//  uploads the user-picked screenshot to Supabase Storage, then inserts
//  a row into `payment_requests` for admin review.
//
//  No SwiftUI imports.
//

import Foundation
import Combine

@MainActor
final class ABAPaymentViewModel: ObservableObject {

    // MARK: - Static merchant info

    let merchantName: String = "FitMeal AI"
    let merchantId: String = "ABA-FITMEAL-001"
    let merchantAccount: String = "000 123 456"

    // MARK: - Published state

    @Published var request: PaymentRequest
    @Published var isSubmitting: Bool = false
    @Published var errorMessage: String? = nil
    /// Bytes of the user-picked screenshot (PNG/JPEG). When nil the
    /// submit button is disabled.
    @Published var screenshotData: Data? = nil
    @Published var screenshotMimeType: String = "image/jpeg"
    @Published var isUploadingScreenshot: Bool = false

    // MARK: - Injected services

    private let receiptUploader: ReceiptUploadService?
    private let authService: AuthService?
    private let config: FitMealConfig?

    init(
        tier: SubscriptionTier = .gold,
        amount: String = "$9.99",
        receiptUploader: ReceiptUploadService? = nil,
        authService: AuthService? = nil,
        config: FitMealConfig? = nil
    ) {
        self.request = PaymentRequest(tier: tier, amount: amount)
        self.receiptUploader = receiptUploader
        self.authService = authService
        self.config = config
    }

    // MARK: - Derived

    var canSubmit: Bool {
        !isSubmitting
        && !isUploadingScreenshot
        && trimmedTransactionId.count >= 4
        && screenshotData != nil
        && request.status != .pending
    }

    var trimmedTransactionId: String {
        request.transactionId.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var planLine: String {
        "FitMeal \(request.tier.rawValue) . \(request.amount)/mo"
    }

    var hasLiveBackend: Bool {
        receiptUploader != nil && authService?.session != nil && config?.isSupabaseConfigured == true
    }

    // MARK: - Intents

    /// Called by the SwiftUI PhotosPicker after the user selects an image.
    /// `data` is the JPEG/PNG bytes. The view also pre-resolves the MIME
    /// type from `PhotosPickerItem.supportedContentTypes` and passes it
    /// here. We show the file size in the UI but don't bake any names.
    func setScreenshot(data: Data, mimeType: String) {
        screenshotData = data
        screenshotMimeType = mimeType
        // Display name kept for UI compatibility - shows file size as
        // a stand-in for "you've attached something".
        let kb = max(1, data.count / 1024)
        request.screenshotFileName = "receipt-\(kb)KB.\(mimeType.contains("png") ? "png" : "jpg")"
    }

    func clearScreenshot() {
        screenshotData = nil
        request.screenshotFileName = nil
    }

    /// Submits the payment request:
    ///   1. Uploads the screenshot bytes to Supabase Storage `receipts` bucket.
    ///   2. POSTs a new row to `public.payment_requests`.
    /// When no live backend is configured (preview / unit tests), runs
    /// the legacy 700ms simulated success path instead.
    func submit() async -> Bool {
        guard canSubmit else { return false }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        request.transactionId = trimmedTransactionId
        request.submittedAt = Date()

        guard hasLiveBackend,
              let receiptUploader,
              let authService,
              let config,
              let data = screenshotData,
              let session = authService.session else {
            // Preview / offline path
            try? await Task.sleep(nanoseconds: 600_000_000)
            request.status = .pending
            return true
        }

        do {
            let storagePath = try await receiptUploader.uploadReceipt(
                data: data,
                contentType: screenshotMimeType,
                paymentRequestId: nil
            )
            request.screenshotFileName = storagePath
            // Insert payment request row directly via the REST API.
            try await insertPaymentRequest(
                config: config,
                session: session,
                storagePath: storagePath
            )
            request.status = .pending
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    // MARK: - REST helper

    private func insertPaymentRequest(
        config: FitMealConfig,
        session: AuthSession,
        storagePath: String
    ) async throws {
        guard let supabaseURL = config.supabaseURL else { return }
        let url = URL(
            string: "\(supabaseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/")))/rest/v1/payment_requests"
        )!
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        req.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("return=minimal", forHTTPHeaderField: "Prefer")

        let body: [String: Any] = [
            "user_id": session.user.id,
            "tier": request.tier.rawValue.lowercased(),
            "amount": request.amount,
            "transaction_id": trimmedTransactionId,
            "receipt_storage_path": storagePath,
            "status": "pending",
            "provider": "manual_aba",
            "currency": "USD",
            "submitted_at": ISO8601DateFormatter().string(from: Date()),
        ]
        req.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw NSError(
                domain: "ABAPayment", code: 0,
                userInfo: [NSLocalizedDescriptionKey: "No response from server"],
            )
        }
        if !(200..<300).contains(http.statusCode) {
            let body = String(data: data, encoding: .utf8) ?? "<binary>"
            throw NSError(
                domain: "ABAPayment", code: http.statusCode,
                userInfo: [NSLocalizedDescriptionKey: body],
            )
        }
    }
}
