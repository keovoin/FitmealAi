//
//  PaymentRequest.swift
//  FitMealAI
//
//  Manual ABA payment request with a pending approval lifecycle.
//

import Foundation

enum PaymentStatus: String, Codable {
    case draft
    case pending
    case approved
    case rejected
}

struct PaymentRequest: Identifiable, Codable, Hashable {
    let id: UUID
    var tier: SubscriptionTier
    var amount: String              // localized display string, e.g. "$9.99"
    var transactionId: String
    var screenshotFileName: String?
    var status: PaymentStatus
    var submittedAt: Date?

    init(
        id: UUID = UUID(),
        tier: SubscriptionTier,
        amount: String,
        transactionId: String = "",
        screenshotFileName: String? = nil,
        status: PaymentStatus = .draft,
        submittedAt: Date? = nil
    ) {
        self.id = id
        self.tier = tier
        self.amount = amount
        self.transactionId = transactionId
        self.screenshotFileName = screenshotFileName
        self.status = status
        self.submittedAt = submittedAt
    }
}
