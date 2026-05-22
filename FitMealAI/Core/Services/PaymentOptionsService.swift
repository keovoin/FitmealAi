//
//  PaymentOptionsService.swift
//  FitMealAI
//
//  Calls /api/payments/options to find out which payment methods are
//  available for the current user. The server side computes this from:
//    - app_settings.aba_payment.enabled        (admin toggle)
//    - app_settings.aba_payment.allowed_regions (country allow-list)
//    - the IP-resolved country of this request  (Vercel header)
//
//  We use this to hide the "Pay with ABA" button when the user is
//  outside Cambodia (or wherever the admin has restricted it to), and
//  to know whether the KHQR provider is configured at all.
//

import Foundation

struct PaymentOptions: Decodable, Equatable {
    struct ABAOption: Decodable, Equatable {
        let enabled: Bool
        let allowed_regions: [String]
        let available_for_user: Bool
    }
    struct KhqrOption: Decodable, Equatable {
        let available: Bool
        let active_providers: [String]
    }

    let aba_payment: ABAOption
    let khqr_payment: KhqrOption
    let detected_country: String?

    /// Pessimistic default used when the network call fails. Hides the
    /// ABA button so we don't show a region-locked feature outside its
    /// region; KHQR stays visible because the worst case there is a
    /// transient gateway error.
    static let unavailable = PaymentOptions(
        aba_payment: .init(enabled: false, allowed_regions: [], available_for_user: false),
        khqr_payment: .init(available: true, active_providers: []),
        detected_country: nil,
    )
}

@MainActor
final class PaymentOptionsService {

    private let config: FitMealConfig

    init(config: FitMealConfig) {
        self.config = config
    }

    func fetch() async -> PaymentOptions {
        guard let baseURL = config.apiBaseURL else {
            return .unavailable
        }
        let url = baseURL.appendingPathComponent("api/payments/options")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.cachePolicy = .reloadIgnoringLocalCacheData

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                return .unavailable
            }
            return try JSONDecoder().decode(PaymentOptions.self, from: data)
        } catch {
            return .unavailable
        }
    }
}
