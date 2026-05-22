//
//  GoogleSignInService.swift
//  FitMealAI
//
//  Native Google Sign-In bridge. The app still compiles without the
//  GoogleSignIn package; once the package and Info.plist values are added,
//  this file automatically uses the native Google flow and returns an ID token.
//

import Foundation
#if canImport(UIKit)
import UIKit
#endif
#if canImport(GoogleSignIn)
import GoogleSignIn
#endif

enum GoogleSignInServiceError: LocalizedError {
    case notConfigured
    case packageMissing
    case missingPresenter
    case missingIDToken

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Google Sign-In needs FITMEAL_GOOGLE_* Info.plist values."
        case .packageMissing:
            return "Add the GoogleSignIn iOS package in Xcode to enable native Google Sign-In."
        case .missingPresenter:
            return "Could not open the Google Sign-In window. Please try again."
        case .missingIDToken:
            return "Google did not return an ID token. Check the iOS and web client IDs."
        }
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

        #if canImport(GoogleSignIn) && canImport(UIKit)
        guard let presenter = Self.topViewController() else {
            throw GoogleSignInServiceError.missingPresenter
        }

        // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
        GIDSignIn.sharedInstance.configuration = GIDConfiguration(
            clientID: config.googleIOSClientID,
            serverClientID: config.googleServerClientID.isEmpty ? nil : config.googleServerClientID
        )

        return try await withCheckedThrowingContinuation { continuation in
            GIDSignIn.sharedInstance.signIn(withPresenting: presenter) { result, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                guard let token = result?.user.idToken?.tokenString else {
                    continuation.resume(throwing: GoogleSignInServiceError.missingIDToken)
                    return
                }

                continuation.resume(returning: token)
            }
        }
        #else
        throw GoogleSignInServiceError.packageMissing
        #endif
    }

    func handleOpenURL(_ url: URL) -> Bool {
        #if canImport(GoogleSignIn)
        return GIDSignIn.sharedInstance.handle(url)
        #else
        return false
        #endif
    }
}

#if canImport(UIKit)
private extension GoogleSignInService {
    static func topViewController(
        from root: UIViewController? = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first(where: { $0.isKeyWindow })?
            .rootViewController
    ) -> UIViewController? {
        if let navigation = root as? UINavigationController {
            return topViewController(from: navigation.visibleViewController)
        }
        if let tab = root as? UITabBarController {
            return topViewController(from: tab.selectedViewController)
        }
        if let presented = root?.presentedViewController {
            return topViewController(from: presented)
        }
        return root
    }
}
#endif