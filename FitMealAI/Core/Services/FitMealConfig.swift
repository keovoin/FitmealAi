//
//  FitMealConfig.swift
//  FitMealAI
//
//  Runtime configuration for the iOS app. Values are intentionally read
//  from Info.plist/build settings so real Supabase keys and API URLs are
//  inserted in Xcode or CI, not committed to source control.
//

import Foundation

struct FitMealConfig: Equatable {
    var supabaseURLString: String
    var supabaseAnonKey: String
    var apiBaseURLString: String

    static var current: FitMealConfig {
        FitMealConfig(
            supabaseURLString: Bundle.main.stringValue(forInfoKey: "FITMEAL_SUPABASE_URL"),
            supabaseAnonKey: Bundle.main.stringValue(forInfoKey: "FITMEAL_SUPABASE_ANON_KEY"),
            apiBaseURLString: Bundle.main.stringValue(forInfoKey: "FITMEAL_API_BASE_URL")
        )
    }

    static let preview = FitMealConfig(
        supabaseURLString: "https://your-project-ref.supabase.co",
        supabaseAnonKey: "your-public-anon-key",
        apiBaseURLString: "https://your-admin-web-domain.com"
    )

    var supabaseURL: URL? { URL(string: supabaseURLString.trimmed) }
    var apiBaseURL: URL? { URL(string: apiBaseURLString.trimmed) }

    var isSupabaseConfigured: Bool {
        supabaseURL != nil && !supabaseAnonKey.trimmed.isEmpty
    }

    var isAPIConfigured: Bool {
        apiBaseURL != nil
    }
}

private extension Bundle {
    func stringValue(forInfoKey key: String) -> String {
        (object(forInfoDictionaryKey: key) as? String)?.trimmed ?? ""
    }
}

private extension String {
    var trimmed: String { trimmingCharacters(in: .whitespacesAndNewlines) }
}