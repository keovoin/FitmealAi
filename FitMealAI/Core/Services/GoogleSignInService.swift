//
//  GoogleSignInService.swift
//  FitMealAI
//
//  Placeholder bridge for native Google Sign-In. The app compiles without
//  the GoogleSignIn package; once credentials are ready, add the package
//  in Xcode and replace `fetchGoogleIDToken()` with the native flow.
//

import Foundation

enum GoogleSignInServiceError: LocalizedError {
    case notConfigured

    var errorDescription: String? {
        "Google Sign-In needs the GoogleSignIn iOS package plus FITMEAL_GOOGLE_* Info.plist values."
    }
}

@MainActor
struct GoogleSignInService {
    let config: FitMealConfig

    init(config: FitMealConfig = .current) {
        self.config = config
    }

    func fetchGoogleIDToken() async throws -> String {
        guard config.isGoogleConfigured else { throw GoogleSignInServiceError.notConfigured }
        throw GoogleSignInServiceError.notConfigured
    }
}