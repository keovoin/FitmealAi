//
//  AIService.swift
//  FitMealAI
//
//  Calls the existing admin-web `/api/ai/meal-plan` endpoint with the
//  signed-in user's Supabase JWT.
//

import Foundation

enum AIServiceError: LocalizedError {
    case notConfigured
    case notAuthenticated
    case server(String)
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "The FitMeal API URL is not configured."
        case .notAuthenticated: return "Please sign in again."
        case .server(let message): return message
        case .invalidResponse: return "The AI response could not be read."
        }
    }
}

@MainActor
final class AIService {
    private let config: FitMealConfig
    private let authService: AuthService

    init(config: FitMealConfig = .current, authService: AuthService) {
        self.config = config
        self.authService = authService
    }

    func generateTodayMealPlan(
        goal: FitnessGoal,
        calorieTarget: Int,
        mealPrefs: MealPrefs,
        reuseToday: Bool = false
    ) async throws -> MealPlan {
        guard let baseURL = config.apiBaseURL else { throw AIServiceError.notConfigured }
        guard let session = authService.session else { throw AIServiceError.notAuthenticated }

        let requestBody = MealPlanAIRequest(
            user_id: session.user.id,
            goal: goal.aiAPIValue,
            daily_calorie_target: calorieTarget,
            diets: Array(mealPrefs.diets).sorted(),
            allergies: Array(mealPrefs.allergies).sorted(),
            cook_time: mealPrefs.cookTime,
            meal_types: mealPrefs.apiMealTypes,
            date: Self.todayString(),
            reuse_today_if_present: reuseToday
        )

        guard let url = URL(string: baseURL.absoluteString.trimmedTrailingSlash + "/api/ai/meal-plan") else {
            throw AIServiceError.notConfigured
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(requestBody)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw AIServiceError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let decoded = try? JSONDecoder().decode(AIErrorResponse.self, from: data)
            throw AIServiceError.server(decoded?.error ?? "AI request failed with status \(http.statusCode).")
        }

        guard let result = try? JSONDecoder().decode(MealPlanAIResponse.self, from: data), result.ok else {
            throw AIServiceError.invalidResponse
        }
        return result.asMealPlan(date: Date())
    }

    private static func todayString() -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}

private struct MealPlanAIRequest: Encodable {
    let user_id: String
    let goal: String
    let daily_calorie_target: Int
    let diets: [String]
    let allergies: [String]
    let cook_time: String
    let meal_types: [String]
    let date: String
    let reuse_today_if_present: Bool
}

private struct MealPlanAIResponse: Decodable {
    let ok: Bool
    let plan_id: String
    let reused: Bool
    let meals: [AIMealSummary]

    func asMealPlan(date: Date) -> MealPlan {
        MealPlan(
            date: date,
            meals: meals.enumerated().map { index, item in
                let calories = max(item.calories, 50)
                return Meal(
                    id: UUID(uuidString: item.meal_id) ?? UUID(),
                    type: MealType.apiOrder[safe: index] ?? .snack,
                    title: item.title,
                    calories: calories,
                    proteinGrams: max(8, calories / 18),
                    carbsGrams: max(12, calories / 10),
                    fatGrams: max(5, calories / 32),
                    imageName: item.image_url,
                    ingredients: []
                )
            }
        )
    }
}

private struct AIMealSummary: Decodable {
    let meal_id: String
    let title: String
    let calories: Int
    let image_url: String?
}

private struct AIErrorResponse: Decodable {
    let error: String?
}

private extension FitnessGoal {
    var aiAPIValue: String {
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

private extension MealPrefs {
    var apiMealTypes: [String] {
        let mapped = timings.map { value -> String in
            switch value {
            case "breakfast": return "breakfast"
            case "lunch": return "lunch"
            case "dinner": return "dinner"
            default: return "snack"
            }
        }
        return Array(Set(mapped)).sorted { lhs, rhs in
            MealType.apiSortIndex(lhs) < MealType.apiSortIndex(rhs)
        }
    }
}

private extension MealType {
    static let apiOrder: [MealType] = [.breakfast, .lunch, .dinner, .snack]

    static func apiSortIndex(_ value: String) -> Int {
        switch value {
        case "breakfast": return 0
        case "lunch": return 1
        case "dinner": return 2
        default: return 3
        }
    }
}

private extension Array {
    subscript(safe index: Int) -> Element? {
        indices.contains(index) ? self[index] : nil
    }
}