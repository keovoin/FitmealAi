package com.fitmealai.data

import com.fitmealai.config.AppConfig
import com.fitmealai.config.requireApi
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import com.fitmealai.domain.SubscriptionTier
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate

// ---------------------------------------------------------------------------
// QuotaState — snapshot of the user's daily AI + shuffle counters returned
// by GET /api/quotas?user_id=. Mirrors the iOS QuotaState in
// `Core/Services/QuotaService.swift` and the JSON shape produced by
// `admin-web/src/app/api/quotas/route.ts`.
// ---------------------------------------------------------------------------

data class QuotaCounter(
    val used: Int,
    val limit: Int,
    val unlimited: Boolean,
) {
    /** Remaining for the day, or [Int.MAX_VALUE] when unlimited. */
    val remaining: Int
        get() = if (unlimited) Int.MAX_VALUE else (limit - used).coerceAtLeast(0)

    val isExhausted: Boolean
        get() = !unlimited && remaining <= 0

    /**
     * Pretty counter line shown under each Home button.
     *
     *   - "Unlimited" for paid tiers
     *   - "3 of 10 used today" otherwise
     *
     * Matches the iOS [QuotaCounter.subtitle] copy verbatim so QA can
     * screenshot-diff the two platforms.
     */
    val subtitle: String
        get() = if (unlimited) "Unlimited" else "$used of $limit used today"

    companion object {
        /** Used while the first /api/quotas call is in-flight. */
        val Loading = QuotaCounter(used = 0, limit = 0, unlimited = false)
    }
}

data class QuotaState(
    val tier: SubscriptionTier,
    val ai: QuotaCounter,
    val shuffles: QuotaCounter,
    val shuffleMealCount: Int,
    /** Set true when the latest /api/recipes/shuffle returned 503 catalog_not_ready. */
    val catalogNotReady: Boolean = false,
) {
    companion object {
        val Loading = QuotaState(
            tier = SubscriptionTier.Free,
            ai = QuotaCounter.Loading,
            shuffles = QuotaCounter.Loading,
            shuffleMealCount = 1,
            catalogNotReady = false,
        )
    }
}

// ---------------------------------------------------------------------------
// ShuffleResult / ShuffleException
// ---------------------------------------------------------------------------

/**
 * Successful shuffle response. Contains the materialised [MealPlan]
 * (one [Meal] per returned recipe) plus the post-bump counter the
 * server returned, so the UI can update without re-polling.
 */
data class ShuffleResult(
    val mealPlan: MealPlan,
    val shuffles: QuotaCounter,
)

/**
 * 429 cap_reached / 503 catalog_not_ready / 404 no_match are common
 * enough that we model them explicitly. Plain network errors keep
 * surfacing as [AuthException] from the shared HTTP helpers.
 */
sealed class ShuffleException(message: String) : Exception(message) {
    /** 429: bumping caused the user to hit their daily cap. UI shows paywall. */
    data class DailyCapReached(val shuffles: QuotaCounter) :
        ShuffleException("You've used today's free shuffles. Upgrade to keep going.")

    /** 503: < `catalog_min_published_per_meal_type` published recipes. UI hides the button. */
    data object CatalogNotReady :
        ShuffleException("Shuffle isn't ready yet — the recipe catalog is still being curated.")

    /** 404: published catalog has no recipe matching the user's diet/allergens/cook-time. */
    data object NoMatch :
        ShuffleException("No recipes match your diet, allergens, and cook-time.")
}

// ---------------------------------------------------------------------------
// QuotaRepository — GET /api/quotas?user_id=
// ---------------------------------------------------------------------------

class QuotaRepository(private val config: AppConfig = AppConfig()) {

    suspend fun fetch(session: AuthSession): QuotaState {
        config.requireApi()
        val url = "${config.apiBaseUrl.trimEnd('/')}/api/quotas?user_id=${session.userId}"
        val res = quotaGet(
            url = url,
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )
        return res.toQuotaState()
    }
}

// ---------------------------------------------------------------------------
// ShuffleRepository — GET /api/recipes/shuffle
// ---------------------------------------------------------------------------

class ShuffleRepository(private val config: AppConfig = AppConfig()) {

    /**
     * Pulls N random published recipes for [mealType], honouring the
     * user's diet/allergen/cook-time prefs server-side. The server
     * also bumps the user's daily shuffle counter, which is echoed back
     * in [ShuffleResult.shuffles] so the UI can update without
     * re-polling /api/quotas.
     */
    suspend fun shuffle(
        session: AuthSession,
        mealType: MealType,
        count: Int? = null,
    ): ShuffleResult {
        config.requireApi()
        val countParam = count?.let { "&count=$it" }.orEmpty()
        val url = "${config.apiBaseUrl.trimEnd('/')}/api/recipes/shuffle" +
            "?user_id=${session.userId}&meal_type=${mealType.apiValue}$countParam"

        val response = quotaGetRaw(
            url = url,
            headers = mapOf("Authorization" to "Bearer ${session.accessToken}"),
        )

        when (response.status) {
            in 200..299 -> {
                val json = response.parseJson()
                val recipes = json.optJSONArray("recipes") ?: JSONArray()
                if (recipes.length() == 0) throw ShuffleException.NoMatch
                val meals = (0 until recipes.length()).map { i ->
                    recipes.getJSONObject(i).toMealOrNull(fallbackType = mealType, index = i)
                }
                val shufflesJson = json.optJSONObject("shuffles") ?: JSONObject()
                return ShuffleResult(
                    mealPlan = MealPlan(
                        dateLabel = LocalDate.now().toString(),
                        meals = meals,
                    ),
                    shuffles = QuotaCounter(
                        used = shufflesJson.optInt("used", 0),
                        limit = shufflesJson.optInt("limit", 0),
                        unlimited = shufflesJson.optBoolean("unlimited", false),
                    ),
                )
            }
            429 -> {
                val json = response.parseJson()
                val shufflesJson = json.optJSONObject("shuffles") ?: JSONObject()
                throw ShuffleException.DailyCapReached(
                    shuffles = QuotaCounter(
                        used = shufflesJson.optInt("used", 0),
                        limit = shufflesJson.optInt("limit", 0),
                        unlimited = false,
                    ),
                )
            }
            503 -> {
                val json = response.parseJson()
                if (json.optString("error") == "catalog_not_ready") {
                    throw ShuffleException.CatalogNotReady
                }
                throw AuthException("Shuffle service unavailable.")
            }
            404 -> throw ShuffleException.NoMatch
            else -> {
                val json = response.parseJson()
                throw AuthException(
                    json.optString("error").ifBlank {
                        "Shuffle failed with ${response.status}"
                    },
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// JSON ↔ domain helpers
// ---------------------------------------------------------------------------

private fun JSONObject.toQuotaState(): QuotaState {
    val ai = optJSONObject("ai") ?: JSONObject()
    val shuffles = optJSONObject("shuffles") ?: JSONObject()
    return QuotaState(
        tier = when (optString("tier")) {
            "gold" -> SubscriptionTier.Gold
            "silver" -> SubscriptionTier.Silver
            else -> SubscriptionTier.Free
        },
        ai = QuotaCounter(
            used = ai.optInt("used", 0),
            limit = ai.optInt("limit", 0),
            unlimited = ai.optBoolean("unlimited", false),
        ),
        shuffles = QuotaCounter(
            used = shuffles.optInt("used", 0),
            limit = shuffles.optInt("limit", 0),
            unlimited = shuffles.optBoolean("unlimited", false),
        ),
        shuffleMealCount = optInt("shuffle_meal_count", 1).coerceAtLeast(1),
    )
}

private fun JSONObject.toMealOrNull(fallbackType: MealType, index: Int): Meal {
    val rawMealType = optString("mealType").ifBlank { optString("meal_type") }
    val type = when (rawMealType) {
        "breakfast" -> MealType.Breakfast
        "lunch" -> MealType.Lunch
        "dinner" -> MealType.Dinner
        "snack" -> MealType.Snack
        else -> fallbackType
    }
    val ingredientsArr = optJSONArray("ingredients") ?: JSONArray()
    val stepsArr = optJSONArray("recipeSteps")
        ?: optJSONArray("recipe_steps")
        ?: JSONArray()
    return Meal(
        id = optString("id").ifBlank { "shuffle-$index" },
        type = type,
        title = optString("title", "Recipe"),
        description = optString("description").ifBlank { null },
        calories = optInt("calories", 0),
        // Server emits camelCase per `recipes-shared.ts`, but tolerate
        // snake_case so the same DTO works for ad-hoc tests.
        proteinGrams = optInt("proteinGrams", optInt("protein_g", 0)),
        carbsGrams = optInt("carbsGrams", optInt("carbs_g", 0)),
        fatGrams = optInt("fatGrams", optInt("fat_g", 0)),
        imageUrl = optString("imageUrl").ifBlank { optString("image_url").ifBlank { null } },
        ingredients = (0 until ingredientsArr.length()).map { i ->
            val ing = ingredientsArr.getJSONObject(i)
            Ingredient(
                name = ing.optString("name"),
                grams = ing.optInt("grams", 0),
                calories = ing.optInt("calories", 0),
                proteinGrams = ing.optInt("proteinGrams", ing.optInt("protein_g", 0)),
                carbsGrams = ing.optInt("carbsGrams", ing.optInt("carbs_g", 0)),
                fatGrams = ing.optInt("fatGrams", ing.optInt("fat_g", 0)),
            )
        },
        recipeSteps = (0 until stepsArr.length()).map { i -> stepsArr.optString(i) },
    )
}

// ---------------------------------------------------------------------------
// Tiny GET helper. We'd love to share the helper in `Services.kt` but
// it's `private` there; duplicating the ~10 lines keeps the new file
// self-contained without altering existing call sites.
// ---------------------------------------------------------------------------

private data class HttpResponse(val status: Int, val body: String) {
    fun parseJson(): JSONObject =
        runCatching { JSONObject(body.ifBlank { "{}" }) }.getOrDefault(JSONObject())
}

private suspend fun quotaGetRaw(
    url: String,
    headers: Map<String, String>,
): HttpResponse = withContext(Dispatchers.IO) {
    val connection = (URL(url).openConnection() as HttpURLConnection).apply {
        requestMethod = "GET"
        connectTimeout = 15_000
        readTimeout = 30_000
        setRequestProperty("Accept", "application/json")
        headers.forEach { (k, v) -> setRequestProperty(k, v) }
    }
    val code = connection.responseCode
    val stream = if (code in 200..299) connection.inputStream else connection.errorStream
    val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
    HttpResponse(status = code, body = text)
}

private suspend fun quotaGet(
    url: String,
    headers: Map<String, String>,
): JSONObject {
    val response = quotaGetRaw(url, headers)
    if (response.status !in 200..299) {
        val err = response.parseJson()
        val message = err.optString("error_description")
            .ifBlank { err.optString("message") }
            .ifBlank { err.optString("error") }
            .ifBlank { "Request failed with ${response.status}" }
        throw AuthException(message)
    }
    return response.parseJson()
}
