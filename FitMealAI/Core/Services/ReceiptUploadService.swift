//
//  ReceiptUploadService.swift
//  FitMealAI
//
//  Uploads ABA payment receipt screenshots to Supabase Storage.
//  Mirrors the Android `submitAbaPayment` path so receipts land in
//  the same bucket and the admin queue shows them next to manual
//  entries.
//
//  Bucket: 'receipts'
//  Path:   '{userId}/{paymentRequestId}.{ext}'
//

import Foundation

@MainActor
final class ReceiptUploadService {

    private let config: FitMealConfig
    private let authService: AuthService

    init(config: FitMealConfig, authService: AuthService) {
        self.config = config
        self.authService = authService
    }

    enum UploadError: LocalizedError {
        case missingSession
        case missingConfig
        case http(Int, String)

        var errorDescription: String? {
            switch self {
            case .missingSession: return "Sign in before uploading a receipt."
            case .missingConfig:  return "Supabase isn't configured."
            case .http(let code, let body):
                return "Upload failed (\(code)): \(body)"
            }
        }
    }

    /// Uploads PNG/JPEG bytes and returns the storage path that should
    /// be written into `payment_requests.receipt_storage_path`.
    /// - Parameters:
    ///   - data: raw image bytes (PNG or JPEG)
    ///   - contentType: "image/png" or "image/jpeg"
    ///   - paymentRequestId: optional existing row id; generates a UUID
    ///                       suffix when nil
    func uploadReceipt(
        data: Data,
        contentType: String,
        paymentRequestId: String? = nil
    ) async throws -> String {
        guard let session = authService.session else {
            throw UploadError.missingSession
        }
        guard let baseURL = config.supabaseURL?.absoluteString,
              !baseURL.isEmpty,
              !config.supabaseAnonKey.trimmingCharacters(in: .whitespaces).isEmpty else {
            throw UploadError.missingConfig
        }
        let anonKey = config.supabaseAnonKey

        let ext: String = contentType == "image/png" ? "png" : "jpg"
        let prId = paymentRequestId ?? UUID().uuidString
        let path = "\(session.user.id)/\(prId).\(ext)"

        // Supabase Storage uses POST /storage/v1/object/{bucket}/{key}
        let url = URL(
            string: "\(baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/")))/storage/v1/object/receipts/\(path)"
        )!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("3600", forHTTPHeaderField: "Cache-Control")
        request.httpBody = data

        let (responseBody, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw UploadError.http(0, "no response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let bodyText = String(data: responseBody, encoding: .utf8) ?? "<binary>"
            throw UploadError.http(http.statusCode, bodyText)
        }
        return path
    }
}
