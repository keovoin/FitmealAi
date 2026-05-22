//
//  AuthService.swift
//  FitMealAI
//
//  Supabase Auth + REST client used by the iOS app. It only uses the
//  public anon key. Service-role keys stay server-side in admin-web.
//

import Foundation
import Combine

struct AuthenticatedUser: Codable, Hashable, Identifiable {
    let id: String
    let email: String?
}

struct AuthSession: Codable, Hashable {
    var accessToken: String
    var refreshToken: String?
    var expiresAt: Date
    var user: AuthenticatedUser

    var isExpired: Bool { Date().addingTimeInterval(60) >= expiresAt }
}

enum AuthProvider: String {
    case apple
    case google
}

enum AuthServiceError: LocalizedError {
    case notConfigured
    case notAuthenticated
    case invalidResponse
    case server(String)

    var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "Supabase is not configured. Add FITMEAL_SUPABASE_URL and FITMEAL_SUPABASE_ANON_KEY in Xcode."
        case .notAuthenticated:
            return "Please sign in again."
        case .invalidResponse:
            return "The server returned an unexpected response."
        case .server(let message):
            return message
        }
    }
}

@MainActor
final class AuthService: ObservableObject {
    @Published private(set) var session: AuthSession?

    private let config: FitMealConfig
    private let keychain: KeychainStore
    private let sessionKey = "supabase_session"

    init(config: FitMealConfig = .current, keychain: KeychainStore = KeychainStore()) {
        self.config = config
        self.keychain = keychain
    }

    func restoreSession() async throws -> AuthSession? {
        guard let data = try keychain.read(for: sessionKey) else { return nil }
        let saved = try JSONDecoder().decode(AuthSession.self, from: data)
        if saved.isExpired, saved.refreshToken != nil {
            return try await refreshSession(saved)
        }
        session = saved
        return saved
    }

    func signIn(email: String, password: String) async throws -> AuthSession {
        try requireSupabaseConfig()
        let body = ["email": email, "password": password]
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            query: "grant_type=password",
            method: "POST",
            body: body,
            accessToken: nil
        )
        return try persist(response.toSession())
    }

    func signUp(email: String, password: String) async throws -> AuthSession {
        try requireSupabaseConfig()
        let body = ["email": email, "password": password]
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/signup",
            method: "POST",
            body: body,
            accessToken: nil
        )
        guard response.accessToken != nil else {
            throw AuthServiceError.server("Account created. Please verify your email, then sign in.")
        }
        return try persist(response.toSession())
    }

    func signInWithIDToken(provider: AuthProvider, idToken: String, nonce: String? = nil) async throws -> AuthSession {
        try requireSupabaseConfig()
        var body: [String: String] = ["provider": provider.rawValue, "id_token": idToken]
        if let nonce { body["nonce"] = nonce }
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            query: "grant_type=id_token",
            method: "POST",
            body: body,
            accessToken: nil
        )
        return try persist(response.toSession())
    }

    func signOut() async {
        if let token = session?.accessToken {
            try? await requestWithoutResponse(path: "/auth/v1/logout", method: "POST", body: EmptyBody(), accessToken: token)
        }
        try? keychain.delete(for: sessionKey)
        session = nil
    }

    func saveGoal(_ goal: FitnessGoal, calorieTarget: Int) async throws {
        let current = try requireSession()
        let row = UserGoalRow(
            user_id: current.user.id,
            fitness_goal: goal.supabaseValue,
            daily_calorie_target: calorieTarget
        )
        try await upsert(path: "/rest/v1/user_goals", conflict: "user_id", body: row)
    }

    func saveWorkoutPrefs(_ prefs: WorkoutPrefs) async throws {
        let current = try requireSession()
        let row = WorkoutPrefsRow(
            user_id: current.user.id,
            types: Array(prefs.types).sorted(),
            days: prefs.days,
            duration: prefs.duration
        )
        try await upsert(path: "/rest/v1/workout_prefs", conflict: "user_id", body: row)
    }

    func saveMealPrefs(_ prefs: MealPrefs) async throws {
        let current = try requireSession()
        let row = MealPrefsRow(
            user_id: current.user.id,
            diets: Array(prefs.diets).sorted(),
            timings: Array(prefs.timings).sorted(),
            cook_time: prefs.cookTime,
            allergies: Array(prefs.allergies).sorted()
        )
        try await upsert(path: "/rest/v1/meal_prefs", conflict: "user_id", body: row)
    }

    func fetchProfileSummary() async throws -> ProfileSummary? {
        let current = try requireSession()
        let rows: [ProfileRow] = try await request(
            path: "/rest/v1/profiles",
            query: "id=eq.\(current.user.id)&select=id,email,display_name,tier",
            method: "GET",
            body: EmptyBody?.none,
            accessToken: current.accessToken
        )
        guard let row = rows.first else { return nil }
        return ProfileSummary(
            name: row.display_name?.isEmpty == false ? row.display_name! : (row.email?.components(separatedBy: "@").first ?? "Friend"),
            email: row.email,
            tier: SubscriptionTier(apiValue: row.tier) ?? .free
        )
    }

    private func refreshSession(_ saved: AuthSession) async throws -> AuthSession {
        guard let refreshToken = saved.refreshToken else { throw AuthServiceError.notAuthenticated }
        let body = ["refresh_token": refreshToken]
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            query: "grant_type=refresh_token",
            method: "POST",
            body: body,
            accessToken: nil
        )
        return try persist(response.toSession())
    }

    private func persist(_ newSession: AuthSession) throws -> AuthSession {
        let data = try JSONEncoder().encode(newSession)
        try keychain.save(data, for: sessionKey)
        session = newSession
        return newSession
    }

    private func requireSupabaseConfig() throws {
        guard config.isSupabaseConfigured else { throw AuthServiceError.notConfigured }
    }

    func requireSession() throws -> AuthSession {
        guard let session else { throw AuthServiceError.notAuthenticated }
        return session
    }

    private func upsert<T: Encodable>(path: String, conflict: String, body: T) async throws {
        let current = try requireSession()
        try await requestWithoutResponse(
            path: path,
            query: "on_conflict=\(conflict)",
            method: "POST",
            body: body,
            accessToken: current.accessToken,
            prefer: "resolution=merge-duplicates,return=minimal"
        )
    }

    private func request<T: Decodable, Body: Encodable>(
        path: String,
        query: String? = nil,
        method: String,
        body: Body?,
        accessToken: String?
    ) async throws -> T {
        let data = try await rawRequest(path: path, query: query, method: method, body: body, accessToken: accessToken)
        do { return try JSONDecoder().decode(T.self, from: data) }
        catch { throw AuthServiceError.invalidResponse }
    }

    private func requestWithoutResponse<Body: Encodable>(
        path: String,
        query: String? = nil,
        method: String,
        body: Body?,
        accessToken: String?,
        prefer: String? = nil
    ) async throws {
        _ = try await rawRequest(path: path, query: query, method: method, body: body, accessToken: accessToken, prefer: prefer)
    }

    private func rawRequest<Body: Encodable>(
        path: String,
        query: String?,
        method: String,
        body: Body?,
        accessToken: String?,
        prefer: String? = nil
    ) async throws -> Data {
        try requireSupabaseConfig()
        guard var components = URLComponents(string: config.supabaseURL!.absoluteString.trimmedTrailingSlash + path) else {
            throw AuthServiceError.notConfigured
        }
        components.percentEncodedQuery = query
        guard let url = components.url else { throw AuthServiceError.notConfigured }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue(config.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken ?? config.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let prefer { request.setValue(prefer, forHTTPHeaderField: "Prefer") }
        if let body { request.httpBody = try JSONEncoder().encode(body) }

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AuthServiceError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let decoded = try? JSONDecoder().decode(SupabaseErrorResponse.self, from: data)
            let error = decoded?.message ?? decoded?.error_description
            throw AuthServiceError.server(error ?? "Supabase request failed with status \(http.statusCode).")
        }
        return data
    }
}

struct ProfileSummary: Hashable {
    var name: String
    var email: String?
    var tier: SubscriptionTier
}

private struct EmptyBody: Encodable {}

private struct SupabaseErrorResponse: Decodable {
    let message: String?
    let error_description: String?
}

private struct SupabaseAuthResponse: Decodable {
    let accessToken: String?
    let refreshToken: String?
    let expiresIn: Int?
    let user: SupabaseUserDTO?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }

    func toSession() throws -> AuthSession {
        guard let accessToken, let user else { throw AuthServiceError.invalidResponse }
        return AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(expiresIn ?? 3600)),
            user: AuthenticatedUser(id: user.id, email: user.email)
        )
    }
}

private struct SupabaseUserDTO: Decodable {
    let id: String
    let email: String?
}

private struct UserGoalRow: Encodable {
    let user_id: String
    let fitness_goal: String
    let daily_calorie_target: Int
}

private struct WorkoutPrefsRow: Encodable {
    let user_id: String
    let types: [String]
    let days: String
    let duration: String
}

private struct MealPrefsRow: Encodable {
    let user_id: String
    let diets: [String]
    let timings: [String]
    let cook_time: String
    let allergies: [String]
}

private struct ProfileRow: Decodable {
    let id: String
    let email: String?
    let display_name: String?
    let tier: String
}

private extension FitnessGoal {
    var supabaseValue: String {
        switch self {
        case .loseWeight: return "lose_weight"
        case .buildMuscle: return "build_muscle"
        case .stayFit: return "stay_fit"
        case .eatHealthier: return "eat_healthier"
        }
    }
}

private extension String {
    var trimmedTrailingSlash: String {
        hasSuffix("/") ? String(dropLast()) : self
    }
}

private extension SubscriptionTier {
    init?(apiValue: String) {
        switch apiValue {
        case "free": self = .free
        case "silver": self = .silver
        case "gold": self = .gold
        default: return nil
        }
    }
}