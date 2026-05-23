//
//  QuotaService.swift
//  FitMealAI
//
//  Mirrors `android/.../data/QuotaRepository.kt`.
//
//  Talks to two admin-web endpoints introduced in PR #15:
//
//   - GET /api/quotas?user_id=...
//       Returns the user's daily AI + shuffle counters.
//   - GET /api/recipes/shuffle?user_id=...&meal_type=...&count=...
//       Pulls N random published recipes filtered by the user's diet,
//       allergens, and cook-time, and bumps the daily shuffle counter.
//
//  Both services are `@MainActor` because callers read `AuthService.session`
//  on the main actor.
//

import Foundation

// MARK: - Domain types

/// One half of the Home action row's "X of Y used today" / "Unlimited"
/// label. Independent for AI and Shuffle so paid tiers can be unlimited
/// for shuffles while still capped on AI generations.
struct QuotaCounter: Equatable, Hashable {
    var used: Int
    var limit: Int
    var unlimited: Bool

    /// Remaining for the day, or `Int.max` when unlimited.
    var remaining: Int {
        unlimited ? .max : max(limit - used, 0)
    }

    var isExhausted: Bool {
        !unlimited && remaining <= 0
    }

    /// Counter line shown under each Home button. Verbatim parity with
    /// the Android `QuotaCounter.subtitle` getter.
    var subtitle: String {
        unlimited ? "Unlimited" : "\(used) of \(limit) used today"
    }

    static let loading = QuotaCounter(used: 0, limit: 0, unlimited: false)
}

/// Snapshot of `/api/quotas`. `catalogNotReady` is sticky and lives
/// outside the wire shape — it's set by `ShuffleService` when the
/// server returns 503 catalog_not_ready, and cleared on the next
/// successful shuffle.
struct QuotaState: Equatable, Hashable {
    var tier: SubscriptionTier
    var ai: QuotaCounter
    var shuffles: QuotaCounter
    var shuffleMealCount: Int
    var catalogNotReady: Bool

    static let loading = QuotaState(
        tier: .free,
        ai: .loading,
        shuffles: .loading,
        shuffleMealCount: 1,
        catalogNotReady: false,
    )
}

/// Successful shuffle response: a fresh `MealPlan` (one `Meal` per
/// recipe) plus the post-bump counter the server returned, so callers
/// can update the UI without re-polling /api/quotas.
struct ShuffleResult: Equatable {
    var mealPlan: MealPlan
    var shuffles: QuotaCounter
}

enum QuotaServiceError: LocalizedError, Equatable {
    case notConfigured
    case notAuthenticated
    case server(String)
    case invalidResponse

    /// 429 from /api/recipes/shuffle. Carries the post-bump counter
    /// so the caller can still refresh the UI before showing the
    /// paywall.
    case dailyCapReached(QuotaCounter)
    /// 503 from /api/recipes/shuffle. The published catalog is too
    /// small to shuffle through; the UI hides the button.
    case catalogNotReady
    /// 404 from /api/recipes/shuffle: no published recipe matches the
    /// user's diet/allergens/cook-time filters.
    case noMatch

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "The FitMeal API URL is not configured."
        case .notAuthenticated: return "Please sign in again."
        case .server(let message): return message
        case .invalidResponse: return "The server returned an unexpected response."
        case .dailyCapReached: return "You've used today's free shuffles. Upgrade to keep going."
        case .catalogNotReady: return "Shuffle isn't ready yet — the recipe catalog is still being curated."
        case .noMatch: return "No recipes match your diet, allergens, and cook-time."
        }
    }
}

// MARK: - QuotaService

@MainActor
final class QuotaService {
    private let config: FitMealConfig
    private let authService: AuthService

    init(config: FitMealConfig = .current, authService: AuthService) {
        self.config = config
        self.authService = authService
    }

    func fetch() async throws -> QuotaState {
        guard let baseURL = config.apiBaseURL else { throw QuotaServiceError.notConfigured }
        let session = try authService.requireSession()

        var components = URLComponents(string: baseURL.absoluteString.trimmedTrailingSlash + "/api/quotas")
        components?.queryItems = [URLQueryItem(name: "user_id", value: session.user.id)]
        guard let url = components?.url else { throw QuotaServiceError.notConfigured }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw QuotaServiceError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let decoded = try? JSONDecoder().decode(QuotaErrorResponse.self, from: data)
            throw QuotaServiceError.server(decoded?.error ?? "Quota request failed with status \(http.statusCode).")
        }

        guard let decoded = try? JSONDecoder().decode(QuotaResponseDTO.self, from: data) else {
            throw QuotaServiceError.invalidResponse
        }
        return decoded.toState()
    }
}

// MARK: - ShuffleService

@MainActor
final class ShuffleService {
    private let config: FitMealConfig
    private let authService: AuthService

    init(config: FitMealConfig = .current, authService: AuthService) {
        self.config = config
        self.authService = authService
    }

    func shuffle(
        mealType: MealType,
        count: Int? = nil,
    ) async throws -> ShuffleResult {
        guard let baseURL = config.apiBaseURL else { throw QuotaServiceError.notConfigured }
        let session = try authService.requireSession()

        var components = URLComponents(string: baseURL.absoluteString.trimmedTrailingSlash + "/api/recipes/shuffle")
        var query: [URLQueryItem] = [
            URLQueryItem(name: "user_id", value: session.user.id),
            URLQueryItem(name: "meal_type", value: mealType.shuffleAPIValue),
        ]
        if let count {
            query.append(URLQueryItem(name: "count", value: String(count)))
        }
        components?.queryItems = query
        guard let url = components?.url else { throw QuotaServiceError.notConfigured }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw QuotaServiceError.invalidResponse }

        switch http.statusCode {
        case 200..<300:
            guard let decoded = try? JSONDecoder().decode(ShuffleResponseDTO.self, from: data) else {
                throw QuotaServiceError.invalidResponse
            }
            guard !decoded.recipes.isEmpty else { throw QuotaServiceError.noMatch }
            return ShuffleResult(
                mealPlan: decoded.toMealPlan(fallbackType: mealType),
                shuffles: decoded.shuffles.toCounter(),
            )

        case 429:
            // Decode the inline shuffle counter so the UI mirrors the
            // server-side state before popping the paywall.
            let decoded = try? JSONDecoder().decode(ShuffleCapErrorDTO.self, from: data)
            let counter = decoded?.shuffles?.toCounter() ?? .loading
            throw QuotaServiceError.dailyCapReached(counter)

        case 503:
            let decoded = try? JSONDecoder().decode(QuotaErrorResponse.self, from: data)
            if decoded?.error == "catalog_not_ready" {
                throw QuotaServiceError.catalogNotReady
            }
            throw QuotaServiceError.server(decoded?.error ?? "Shuffle service unavailable.")

        case 404:
            throw QuotaServiceError.noMatch

        default:
            let decoded = try? JSONDecoder().decode(QuotaErrorResponse.self, from: data)
            throw QuotaServiceError.server(decoded?.error ?? "Shuffle failed with status \(http.statusCode).")
        }
    }
}

// MARK: - Wire DTOs

private struct QuotaErrorResponse: Decodable {
    let error: String?
}

private struct QuotaCounterDTO: Decodable {
    let used: Int?
    let limit: Int?
    let unlimited: Bool?

    func toCounter() -> QuotaCounter {
        QuotaCounter(
            used: used ?? 0,
            limit: limit ?? 0,
            unlimited: unlimited ?? false,
        )
    }
}

private struct QuotaResponseDTO: Decodable {
    let tier: String?
    let ai: QuotaCounterDTO?
    let shuffles: QuotaCounterDTO?
    let shuffle_meal_count: Int?

    func toState() -> QuotaState {
        let tier: SubscriptionTier
        switch self.tier {
        case "gold":   tier = .gold
        case "silver": tier = .silver
        default:       tier = .free
        }
        return QuotaState(
            tier: tier,
            ai: ai?.toCounter() ?? .loading,
            shuffles: shuffles?.toCounter() ?? .loading,
            shuffleMealCount: max(shuffle_meal_count ?? 1, 1),
            catalogNotReady: false,
        )
    }
}

private struct ShuffleCapErrorDTO: Decodable {
    let error: String?
    let upgrade_prompt: Bool?
    let shuffles: QuotaCounterDTO?
}

private struct ShuffleResponseDTO: Decodable {
    let recipes: [ShuffleRecipeDTO]
    let shuffles: QuotaCounterDTO

    func toMealPlan(fallbackType: MealType) -> MealPlan {
        let meals = recipes.enumerated().map { index, recipe in
            recipe.toMeal(fallbackType: fallbackType, index: index)
        }
        return MealPlan(date: Date(), meals: meals)
    }
}

private struct ShuffleRecipeDTO: Decodable {
    let id: String?
    let title: String?
    let description: String?
    let mealType: String?
    let calories: Int?
    let proteinGrams: Int?
    let carbsGrams: Int?
    let fatGrams: Int?
    let imageUrl: String?
    let ingredients: [ShuffleIngredientDTO]?

    func toMeal(fallbackType: MealType, index: Int) -> Meal {
        Meal(
            id: UUID(uuidString: id ?? "") ?? UUID(),
            type: MealType(shuffleAPIValue: mealType) ?? fallbackType,
            title: title ?? "Recipe",
            calories: calories ?? 0,
            proteinGrams: proteinGrams ?? 0,
            carbsGrams: carbsGrams ?? 0,
            fatGrams: fatGrams ?? 0,
            imageName: imageUrl,
            ingredients: ingredients?.map { $0.toIngredient() } ?? []
        )
    }
}

private struct ShuffleIngredientDTO: Decodable {
    let name: String?
    let grams: Int?
    let calories: Int?
    let proteinGrams: Int?
    let carbsGrams: Int?
    let fatGrams: Int?

    func toIngredient() -> Ingredient {
        Ingredient(
            name: name ?? "",
            grams: grams ?? 0,
            calories: calories ?? 0,
            proteinGrams: proteinGrams ?? 0,
            carbsGrams: carbsGrams ?? 0,
            fatGrams: fatGrams ?? 0,
        )
    }
}

// MARK: - Helpers

private extension MealType {
    /// API value used by /api/recipes/shuffle (`breakfast`/`lunch`/`dinner`/`snack`).
    /// Independent from the user-facing `rawValue` ("Breakfast" etc.).
    var shuffleAPIValue: String {
        switch self {
        case .breakfast: return "breakfast"
        case .lunch:     return "lunch"
        case .dinner:    return "dinner"
        case .snack:     return "snack"
        }
    }

    init?(shuffleAPIValue: String?) {
        switch shuffleAPIValue {
        case "breakfast": self = .breakfast
        case "lunch":     self = .lunch
        case "dinner":    self = .dinner
        case "snack":     self = .snack
        default:          return nil
        }
    }
}

private extension String {
    var trimmedTrailingSlash: String {
        hasSuffix("/") ? String(dropLast()) : self
    }
}
