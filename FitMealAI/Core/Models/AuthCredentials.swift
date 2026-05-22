//
//  AuthCredentials.swift
//  FitMealAI
//
//  Lightweight value type for the Login screen.
//  All real auth happens via AuthService -> backend (never on-device tokens).
//

import Foundation

enum AuthMode: String, Codable, CaseIterable, Identifiable {
    case email
    case phone

    var id: String { rawValue }

    var label: String {
        switch self {
        case .email: return "Email"
        case .phone: return "Phone"
        }
    }
}

struct AuthCredentials: Hashable {
    var mode: AuthMode = .email
    var emailOrPhone: String = ""
    var password: String = ""

    var isSubmittable: Bool {
        switch mode {
        case .email: return emailOrPhone.contains("@") && password.count >= 6
        case .phone: return emailOrPhone.count >= 6
        }
    }
}
