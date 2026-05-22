//
//  LoginViewModel.swift
//  FitMealAI
//
//  View-agnostic login state. No SwiftUI imports here on purpose:
//  the same logic could be re-expressed in Kotlin for a future
//  Jetpack Compose Android port.
//

import Foundation
import Combine
import AuthenticationServices
import CryptoKit
import Security

@MainActor
final class LoginViewModel: ObservableObject {

    // MARK: - Published state

    @Published var credentials = AuthCredentials()
    @Published var isPasswordVisible: Bool = false
    @Published var isSubmitting: Bool = false
    @Published var errorMessage: String? = nil

    private var currentAppleNonce: String? = nil

    // MARK: - Derived

    var canSubmit: Bool {
        credentials.isSubmittable && !isSubmitting
    }

    var primaryButtonTitle: String {
        switch credentials.mode {
        case .email: return "Sign In"
        case .phone: return "Send OTP"
        }
    }

    var primaryFieldPlaceholder: String {
        switch credentials.mode {
        case .email: return "you@example.com"
        case .phone: return "+855 12 345 678"
        }
    }

    // MARK: - Intents

    func setMode(_ mode: AuthMode) {
        credentials.mode = mode
        errorMessage = nil
    }

    func togglePasswordVisibility() {
        isPasswordVisible.toggle()
    }

    func submit(authService: AuthService) async -> AuthSession? {
        guard canSubmit else { return nil }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        guard credentials.mode == .email else {
            errorMessage = "Phone OTP is planned next. Use email for this version."
            return nil
        }

        do {
            return try await authService.signIn(
                email: credentials.emailOrPhone.trimmingCharacters(in: .whitespacesAndNewlines),
                password: credentials.password
            )
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func register(authService: AuthService) async -> AuthSession? {
        guard credentials.mode == .email, canSubmit else {
            errorMessage = "Enter a valid email and password first."
            return nil
        }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        do {
            return try await authService.signUp(
                email: credentials.emailOrPhone.trimmingCharacters(in: .whitespacesAndNewlines),
                password: credentials.password
            )
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let nonce = randomNonceString()
        currentAppleNonce = nonce
        request.requestedScopes = [.email, .fullName]
        request.nonce = sha256(nonce)
    }

    func completeAppleSignIn(
        _ result: Result<ASAuthorization, Error>,
        authService: AuthService
    ) async -> AuthSession? {
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        do {
            let authorization = try result.get()
            guard
                let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                let tokenData = credential.identityToken,
                let token = String(data: tokenData, encoding: .utf8),
                let nonce = currentAppleNonce
            else {
                throw AuthServiceError.invalidResponse
            }
            return try await authService.signInWithIDToken(provider: .apple, idToken: token, nonce: nonce)
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func socialSignIn(
        _ provider: SocialProvider,
        authService: AuthService,
        googleService: GoogleSignInService
    ) async -> AuthSession? {
        switch provider {
        case .google:
            isSubmitting = true
            errorMessage = nil
            defer { isSubmitting = false }

            do {
                let idToken = try await googleService.fetchGoogleIDToken()
                return try await authService.signInWithIDToken(provider: .google, idToken: idToken)
            } catch {
                errorMessage = error.localizedDescription
            }
        case .apple:
            errorMessage = "Use the Apple button below so iOS can provide a secure identity token."
        }
        return nil
    }

    enum SocialProvider {
        case google, apple
    }

    private func randomNonceString(length: Int = 32) -> String {
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remainingLength = length

        while remainingLength > 0 {
            var random: UInt8 = 0
            let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            guard status == errSecSuccess else { continue }
            if random < charset.count {
                result.append(charset[Int(random)])
                remainingLength -= 1
            }
        }

        return result
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let digest = SHA256.hash(data: data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
