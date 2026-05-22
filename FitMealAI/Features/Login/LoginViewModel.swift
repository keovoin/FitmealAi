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

@MainActor
final class LoginViewModel: ObservableObject {

    // MARK: - Published state

    @Published var credentials = AuthCredentials()
    @Published var isPasswordVisible: Bool = false
    @Published var isSubmitting: Bool = false
    @Published var errorMessage: String? = nil

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

    /// Stub. Phase-3 will swap this for a real AuthService call.
    func submit() async -> Bool {
        guard canSubmit else { return false }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }

        try? await Task.sleep(nanoseconds: 600_000_000)
        return true
    }

    /// Stub for "Continue with Google" / "Continue with Apple".
    func socialSignIn(_ provider: SocialProvider) async -> Bool {
        isSubmitting = true
        defer { isSubmitting = false }
        try? await Task.sleep(nanoseconds: 400_000_000)
        return true
    }

    enum SocialProvider {
        case google, apple
    }
}
