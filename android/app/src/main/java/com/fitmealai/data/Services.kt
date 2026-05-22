package com.fitmealai.data

import com.fitmealai.config.AppConfig
import com.fitmealai.config.requireApi
import com.fitmealai.config.requireSupabase
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import org.json.JSONArray
import org.json.JSONObject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

data class AuthSession(val userId: String, val email: String, val accessToken: String)
data class PaymentRequest(val id: String, val amountUsd: Double, val status: String)

class AuthRepository(private val config: AppConfig = AppConfig()) {
    suspend fun signIn(email: String, password: String): AuthSession {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/token?grant_type=password",
            body = JSONObject().put("email", email).put("password", password),
            headers = supabaseHeaders(),
        )
        return response.toAuthSession()
    }

    suspend fun signInWithGoogle(idToken: String): AuthSession {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/token?grant_type=id_token",
            body = JSONObject().put("provider", "google").put("id_token", idToken),
            headers = supabaseHeaders(),
        )
        return response.toAuthSession()
    }

    private fun supabaseHeaders(): Map<String, String> = mapOf(
        "apikey" to config.supabaseAnonKey,
        "Authorization" to "Bearer ${config.supabaseAnonKey}",
    )

    private fun JSONObject.toAuthSession(): AuthSession {
        val user = getJSONObject("user")
        return AuthSession(
            userId = user.getString("id"),
            email = user.optString("email"),
            accessToken = getString("access_token"),
        )
    }
}

class AIRepository(private val config: AppConfig = AppConfig()) {
    suspend fun generateMealPlan(
        session: AuthSession,
        goal: String,
        calorieTarget: Int,
        diets: List<String>,
        allergies: List<String>,
        cookTime: String,
        mealTypes: List<String>,
    ): MealPlan {
        config.requireApi()
        val response = postJson(
            url = "${config.apiBaseUrl.trimEnd('/')}/api/ai/meal-plan",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("goal", goal)
                .put("daily_calorie_target", calorieTarget)
                .put("diets", JSONArray(diets))
                .put("allergies", JSONArray(allergies))
                .put("cook_time", cookTime)
                .put("meal_types", JSONArray(mealTypes))
                .put("date", java.time.LocalDate.now().toString())
                .put("reuse_today_if_present", false),
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )
        return response.toMealPlan()
    }
}

class PaymentRepository(private val config: AppConfig = AppConfig()) {
    suspend fun submitAbaPayment(session: AuthSession, tier: String, amount: String, transactionId: String): PaymentRequest {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/rest/v1/payment_requests",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("tier", tier)
                .put("amount", amount)
                .put("transaction_id", transactionId)
                .put("status", "pending")
                .put("submitted_at", java.time.OffsetDateTime.now().toString()),
            headers = mapOf(
                "apikey" to config.supabaseAnonKey,
                "Authorization" to "Bearer ${session.accessToken}",
                "Prefer" to "return=representation",
            ),
        )
        val first = response.optJSONArray("data")?.optJSONObject(0) ?: response.optJSONArray("rows")?.optJSONObject(0) ?: response
        return PaymentRequest(
            id = first.optString("id"),
            amountUsd = amount.filter { it.isDigit() || it == '.' }.toDoubleOrNull() ?: 0.0,
            status = first.optString("status", "pending"),
        )
    }
}

private suspend fun postJson(url: String, body: JSONObject, headers: Map<String, String>): JSONObject = withContext(Dispatchers.IO) {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 15_000
        readTimeout = 30_000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        headers.forEach { (key, value) -> setRequestProperty(key, value) }
    }

    connection.outputStream.use { output -> output.write(body.toString().toByteArray()) }
    val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
    val text = stream.bufferedReader().use { it.readText() }
    if (connection.responseCode !in 200..299) {
        throw IllegalStateException(JSONObject(text.ifBlank { "{}" }).optString("error", "Request failed with ${connection.responseCode}"))
    }
    if (text.trim().startsWith("[")) {
        JSONObject().put("data", JSONArray(text))
    } else {
        JSONObject(text.ifBlank { "{}" })
    }
}

private fun JSONObject.toMealPlan(): MealPlan {
    val mealsJson = getJSONArray("meals")
    val meals = (0 until mealsJson.length()).map { index ->
        val item = mealsJson.getJSONObject(index)
        Meal(
            id = item.optString("meal_id", "meal-$index"),
            type = mealType(item.optString("meal_type", "snack")),
            title = item.optString("title", "Generated meal"),
            description = item.optString("description").ifBlank { null },
            calories = item.optInt("calories", 0),
            proteinGrams = item.optInt("protein_g", 0),
            carbsGrams = item.optInt("carbs_g", 0),
            fatGrams = item.optInt("fat_g", 0),
            imageUrl = item.optString("image_url").ifBlank { null },
            ingredients = item.optJSONArray("ingredients")?.let { ingredients ->
                (0 until ingredients.length()).map { ingredientIndex ->
                    val ingredient = ingredients.getJSONObject(ingredientIndex)
                    Ingredient(
                        name = ingredient.optString("name"),
                        grams = ingredient.optInt("grams"),
                        calories = ingredient.optInt("calories"),
                        proteinGrams = ingredient.optInt("protein_g"),
                        carbsGrams = ingredient.optInt("carbs_g"),
                        fatGrams = ingredient.optInt("fat_g"),
                    )
                }
            } ?: emptyList(),
            recipeSteps = item.optJSONArray("recipe_steps")?.let { steps ->
                (0 until steps.length()).map { stepIndex -> steps.optString(stepIndex) }
            } ?: emptyList(),
        )
    }
    return MealPlan(dateLabel = java.time.LocalDate.now().toString(), meals = meals)
}

private fun mealType(value: String): MealType = when (value) {
    "breakfast" -> MealType.Breakfast
    "lunch" -> MealType.Lunch
    "dinner" -> MealType.Dinner
    else -> MealType.Snack
}