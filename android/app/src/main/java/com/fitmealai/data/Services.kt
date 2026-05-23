package com.fitmealai.data

import com.fitmealai.config.AppConfig
import com.fitmealai.config.requireApi
import com.fitmealai.config.requireSupabase
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.WorkoutPrefs
import com.fitmealai.domain.FitnessGoal
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.OffsetDateTime

// ---------------------------------------------------------------------------
// Domain DTOs
// ---------------------------------------------------------------------------

data class AuthSession(
    val userId: String,
    val email: String,
    val accessToken: String,
    val refreshToken: String? = null,
    val expiresAtEpochSeconds: Long = 0L,
) {
    val isExpired: Boolean
        get() = expiresAtEpochSeconds > 0 &&
            (System.currentTimeMillis() / 1000) + 60 >= expiresAtEpochSeconds
}

data class PaymentRequestResult(
    val id: String,
    val amountUsd: Double,
    val status: String,
)

/**
 * Server response from POST /api/payments/create-khqr. Mobile clients
 * decode the [qrPayload] into a QR with their preferred renderer, or
 * fall back to fetching [qrImageUrl].
 */
data class KhqrSession(
    val paymentRequestId: String,
    val providerId: String,
    val providerSessionId: String,
    val qrPayload: String?,
    val qrImageUrl: String?,
    val deepLink: String?,
    val checkoutUrl: String?,
    val expiresAtIso: String,
)

data class PaymentStatusSnapshot(
    val paymentRequestId: String,
    val status: String,
    val providerId: String,
)

class AuthException(message: String) : Exception(message)

// ---------------------------------------------------------------------------
// AuthRepository — Supabase REST + token refresh
// ---------------------------------------------------------------------------

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

    suspend fun signUp(email: String, password: String): AuthSession {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/signup",
            body = JSONObject().put("email", email).put("password", password),
            headers = supabaseHeaders(),
        )
        if (response.optString("access_token").isBlank()) {
            throw AuthException(
                "Account created. Please verify your email, then sign in.",
            )
        }
        return response.toAuthSession()
    }

    suspend fun signInWithGoogle(idToken: String, nonce: String? = null): AuthSession {
        config.requireSupabase()
        val body = JSONObject().put("provider", "google").put("id_token", idToken)
        if (nonce != null) body.put("nonce", nonce)
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/token?grant_type=id_token",
            body = body,
            headers = supabaseHeaders(),
        )
        return response.toAuthSession()
    }

    /**
     * Refresh an expired session. Returns the new session, or throws.
     * Used by AppState on cold start when a saved session is expired.
     */
    suspend fun refresh(refreshToken: String): AuthSession {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/token?grant_type=refresh_token",
            body = JSONObject().put("refresh_token", refreshToken),
            headers = supabaseHeaders(),
        )
        return response.toAuthSession()
    }

    suspend fun signOut(session: AuthSession) {
        config.requireSupabase()
        runCatching {
            postJson(
                url = "${config.supabaseUrl.trimEnd('/')}/auth/v1/logout",
                body = JSONObject(),
                headers = supabaseHeaders() + mapOf("Authorization" to "Bearer ${session.accessToken}"),
            )
        }
    }

    suspend fun saveGoal(session: AuthSession, goal: FitnessGoal, calorieTarget: Int) {
        upsert(
            session = session,
            path = "/rest/v1/user_goals",
            conflict = "user_id",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("fitness_goal", goal.apiValue)
                .put("daily_calorie_target", calorieTarget),
        )
    }

    suspend fun saveWorkoutPrefs(session: AuthSession, prefs: WorkoutPrefs) {
        upsert(
            session = session,
            path = "/rest/v1/workout_prefs",
            conflict = "user_id",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("types", JSONArray(prefs.types.sorted()))
                .put("days", prefs.days)
                .put("duration", prefs.duration),
        )
    }

    suspend fun saveMealPrefs(session: AuthSession, prefs: MealPrefs) {
        upsert(
            session = session,
            path = "/rest/v1/meal_prefs",
            conflict = "user_id",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("diets", JSONArray(prefs.diets.sorted()))
                .put("timings", JSONArray(prefs.timings.sorted()))
                .put("cook_time", prefs.cookTime)
                .put("allergies", JSONArray(prefs.allergies.sorted())),
        )
    }

    private suspend fun upsert(session: AuthSession, path: String, conflict: String, body: JSONObject) {
        config.requireSupabase()
        postJson(
            url = "${config.supabaseUrl.trimEnd('/')}$path?on_conflict=$conflict",
            body = body,
            headers = mapOf(
                "apikey" to config.supabaseAnonKey,
                "Authorization" to "Bearer ${session.accessToken}",
                "Prefer" to "resolution=merge-duplicates,return=minimal",
            ),
        )
    }

    private fun supabaseHeaders(): Map<String, String> = mapOf(
        "apikey" to config.supabaseAnonKey,
        "Authorization" to "Bearer ${config.supabaseAnonKey}",
    )

    private fun JSONObject.toAuthSession(): AuthSession {
        val user = optJSONObject("user")
            ?: throw AuthException("Auth response missing user payload")
        val expiresIn = optInt("expires_in", 3600)
        val expiresAt = (System.currentTimeMillis() / 1000) + expiresIn
        return AuthSession(
            userId = user.getString("id"),
            email = user.optString("email"),
            accessToken = optString("access_token"),
            refreshToken = optString("refresh_token").ifBlank { null },
            expiresAtEpochSeconds = expiresAt,
        )
    }
}

// ---------------------------------------------------------------------------
// AIRepository — POST to /api/ai/meal-plan
// ---------------------------------------------------------------------------

class AIRepository(private val config: AppConfig = AppConfig()) {

    suspend fun generateMealPlan(
        session: AuthSession,
        goal: String,
        calorieTarget: Int,
        diets: List<String>,
        allergies: List<String>,
        cookTime: String,
        mealTypes: List<String>,
        reuseToday: Boolean = false,
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
                .put("date", LocalDate.now().toString())
                .put("reuse_today_if_present", reuseToday),
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )
        return response.toMealPlan()
    }
}

// ---------------------------------------------------------------------------
// PaymentRepository — insert into payment_requests
// ---------------------------------------------------------------------------

class PaymentRepository(private val config: AppConfig = AppConfig()) {

    /**
     * Uploads PNG/JPEG receipt bytes to Supabase Storage `receipts` bucket
     * and returns the storage path. Mirrors the iOS [ReceiptUploadService].
     * The path format is `{userId}/{uuid}.{ext}`.
     */
    suspend fun uploadReceipt(
        session: AuthSession,
        bytes: ByteArray,
        contentType: String,
    ): String {
        config.requireSupabase()
        val ext = if (contentType.contains("png", ignoreCase = true)) "png" else "jpg"
        val key = "${session.userId}/${java.util.UUID.randomUUID()}.$ext"
        val url = "${config.supabaseUrl.trimEnd('/')}/storage/v1/object/receipts/$key"

        return withContext(Dispatchers.IO) {
            val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 60_000
                doOutput = true
                setRequestProperty("apikey", config.supabaseAnonKey)
                setRequestProperty("Authorization", "Bearer ${session.accessToken}")
                setRequestProperty("Content-Type", contentType)
                setRequestProperty("Cache-Control", "3600")
            }
            connection.outputStream.use { it.write(bytes) }
            val code = connection.responseCode
            if (code !in 200..299) {
                val errBody = connection.errorStream?.bufferedReader()?.use { it.readText() } ?: ""
                throw AuthException("Receipt upload failed ($code): ${errBody.take(200)}")
            }
            // Drain to release connection.
            connection.inputStream?.close()
            key
        }
    }

    suspend fun submitAbaPayment(
        session: AuthSession,
        tier: String,
        amount: String,
        transactionId: String,
        receiptStoragePath: String? = null,
        provider: String = "manual_aba",
    ): PaymentRequestResult {
        config.requireSupabase()
        val response = postJson(
            url = "${config.supabaseUrl.trimEnd('/')}/rest/v1/payment_requests",
            body = JSONObject()
                .put("user_id", session.userId)
                .put("tier", tier)
                .put("amount", amount)
                .put("transaction_id", transactionId)
                .put("status", "pending")
                .put("provider", provider)
                .put("currency", "USD")
                .put("submitted_at", OffsetDateTime.now().toString())
                .let { obj ->
                    if (receiptStoragePath != null) obj.put("receipt_storage_path", receiptStoragePath)
                    else obj
                },
            headers = mapOf(
                "apikey" to config.supabaseAnonKey,
                "Authorization" to "Bearer ${session.accessToken}",
                "Content-Type" to "application/json",
                "Prefer" to "return=representation",
            ),
        )
        val first = response.optJSONArray("data")?.optJSONObject(0)
            ?: response.optJSONArray("rows")?.optJSONObject(0)
            ?: response
        return PaymentRequestResult(
            id = first.optString("id"),
            amountUsd = amount.filter { it.isDigit() || it == '.' }.toDoubleOrNull() ?: 0.0,
            status = first.optString("status", "pending"),
        )
    }

    /**
     * Creates a KHQR session via the admin-web `/api/payments/create-khqr`
     * endpoint. The route picks the configured provider (Bakong / PayWay /
     * CamRapidPay) and returns a QR payload + session id.
     */
    suspend fun createKhqrSession(
        session: AuthSession,
        tier: String,
        provider: String? = null,
        description: String? = null,
    ): KhqrSession {
        config.requireApi()
        val body = JSONObject()
            .put("user_id", session.userId)
            .put("tier", tier)
        if (provider != null) body.put("provider", provider)
        if (description != null) body.put("description", description)
        val response = postJson(
            url = "${config.apiBaseUrl.trimEnd('/')}/api/payments/create-khqr",
            body = body,
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )
        return KhqrSession(
            paymentRequestId = response.optString("paymentRequestId"),
            providerId = response.optString("providerId"),
            providerSessionId = response.optString("providerSessionId"),
            qrPayload = response.optString("qrPayload").ifBlank { null },
            qrImageUrl = response.optString("qrImageUrl").ifBlank { null },
            deepLink = response.optString("deepLink").ifBlank { null },
            checkoutUrl = response.optString("checkoutUrl").ifBlank { null },
            expiresAtIso = response.optString("expiresAt"),
        )
    }

    /** Polls /api/payments/status/{id} for the latest gateway-side status. */
    suspend fun checkKhqrStatus(
        session: AuthSession,
        paymentRequestId: String,
    ): PaymentStatusSnapshot {
        config.requireApi()
        val url = "${config.apiBaseUrl.trimEnd('/')}/api/payments/status/$paymentRequestId"
        val response = getJson(
            url = url,
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )
        return PaymentStatusSnapshot(
            paymentRequestId = response.optString("paymentRequestId"),
            status = response.optString("status", "pending"),
            providerId = response.optString("providerId"),
        )
    }
}

// ---------------------------------------------------------------------------
// HTTP helper (uses HttpURLConnection so we don't pull OkHttp into the APK).
// ---------------------------------------------------------------------------

private suspend fun getJson(
    url: String,
    headers: Map<String, String>,
): JSONObject = withContext(Dispatchers.IO) {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"
        connectTimeout = 15_000
        readTimeout = 30_000
        setRequestProperty("Accept", "application/json")
        headers.forEach { (key, value) -> setRequestProperty(key, value) }
    }
    val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
    val text = stream?.bufferedReader()?.use { it.readText() } ?: ""
    if (connection.responseCode !in 200..299) {
        val err = runCatching { JSONObject(text.ifBlank { "{}" }) }.getOrDefault(JSONObject())
        val message = err.optString("error_description").ifBlank {
            err.optString("message").ifBlank { "Request failed with ${connection.responseCode}" }
        }
        throw AuthException(message)
    }
    if (text.trim().startsWith("[")) JSONObject().put("data", JSONArray(text))
    else JSONObject(text.ifBlank { "{}" })
}

private suspend fun postJson(
    url: String,
    body: JSONObject,
    headers: Map<String, String>,
): JSONObject = withContext(Dispatchers.IO) {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 15_000
        readTimeout = 30_000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
        headers.forEach { (key, value) -> setRequestProperty(key, value) }
    }

    connection.outputStream.use { it.write(body.toString().toByteArray()) }
    val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
    val text = stream.bufferedReader().use { it.readText() }
    if (connection.responseCode !in 200..299) {
        val err = runCatching { JSONObject(text.ifBlank { "{}" }) }.getOrDefault(JSONObject())
        val message = err.optString("error_description").ifBlank {
            err.optString("message").ifBlank { "Request failed with ${connection.responseCode}" }
        }
        throw AuthException(message)
    }
    if (text.trim().startsWith("[")) JSONObject().put("data", JSONArray(text))
    else JSONObject(text.ifBlank { "{}" })
}

private fun JSONObject.toMealPlan(): MealPlan {
    val mealsJson = optJSONArray("meals") ?: JSONArray()
    val meals = (0 until mealsJson.length()).map { index ->
        val item = mealsJson.getJSONObject(index)
        Meal(
            id = item.optString("meal_id", "meal-$index"),
            type = mealTypeFor(item.optString("meal_type", "snack")),
            title = item.optString("title", "Generated meal"),
            description = item.optString("description").ifBlank { null },
            calories = item.optInt("calories", 0),
            proteinGrams = item.optInt("protein_g", 0),
            carbsGrams = item.optInt("carbs_g", 0),
            fatGrams = item.optInt("fat_g", 0),
            imageUrl = item.optString("image_url").ifBlank { null },
            ingredients = item.optJSONArray("ingredients")?.let { arr ->
                (0 until arr.length()).map { i ->
                    val ing = arr.getJSONObject(i)
                    Ingredient(
                        name = ing.optString("name"),
                        grams = ing.optInt("grams"),
                        calories = ing.optInt("calories"),
                        proteinGrams = ing.optInt("protein_g"),
                        carbsGrams = ing.optInt("carbs_g"),
                        fatGrams = ing.optInt("fat_g"),
                    )
                }
            } ?: emptyList(),
            recipeSteps = item.optJSONArray("recipe_steps")?.let { steps ->
                (0 until steps.length()).map { i -> steps.optString(i) }
            } ?: emptyList(),
        )
    }
    return MealPlan(dateLabel = LocalDate.now().toString(), meals = meals)
}

private fun mealTypeFor(value: String): MealType = when (value) {
    "breakfast" -> MealType.Breakfast
    "lunch" -> MealType.Lunch
    "dinner" -> MealType.Dinner
    else -> MealType.Snack
}
