package com.fitmealai.data

import android.content.Context
import com.fitmealai.domain.Ingredient
import com.fitmealai.domain.Meal
import com.fitmealai.domain.MealPlan
import com.fitmealai.domain.MealType
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.time.LocalDate
import java.util.concurrent.TimeUnit

/**
 * Persists the AI-generated meal plan to disk so users can read today's
 * plan without network. Keyed by ISO date string (yyyy-MM-dd) and
 * auto-evicts entries older than [MAX_AGE_DAYS] on each write.
 *
 * Mirrors iOS `Core/Services/MealPlanCache.swift`. Storage lives in
 * `context.filesDir/meal-plan-cache/{date}.json`. We use vanilla
 * `org.json` so we don't have to pull kotlinx.serialization or Gson
 * into the APK just for one tiny cache.
 */
class MealPlanCache(context: Context) {

    private val directory: File =
        File(context.filesDir, DIR_NAME).apply { mkdirs() }

    /** Save a meal plan for a specific date. Auto-evicts old entries. */
    fun save(plan: MealPlan, date: String) {
        val file = fileFor(date)
        runCatching {
            file.writeText(plan.toJson(cachedAtMillis = System.currentTimeMillis()))
        }
        evictOldEntries()
    }

    /** Load the cached plan for a date. Returns null if missing or expired. */
    fun load(date: String): MealPlan? {
        val file = fileFor(date)
        if (!file.exists()) return null

        val plan = runCatching {
            val obj = JSONObject(file.readText())
            val cachedAt = obj.optLong("cachedAt", 0L)
            val ageMs = System.currentTimeMillis() - cachedAt
            if (cachedAt > 0L && ageMs > maxAgeMs) {
                file.delete()
                return null
            }
            obj.toMealPlan()
        }.getOrNull()

        return plan
    }

    /** Convenience for today's date in the device's local time zone. */
    fun loadToday(): MealPlan? = load(today())

    /** Convenience for save-with-today. */
    fun saveToday(plan: MealPlan) = save(plan, today())

    /** Wipe every cached plan. Used on sign-out. */
    fun clearAll() {
        directory.listFiles()?.forEach { it.delete() }
    }

    // -----------------------------------------------------------------------
    // Internals
    // -----------------------------------------------------------------------

    private val maxAgeMs: Long = TimeUnit.DAYS.toMillis(MAX_AGE_DAYS.toLong())

    private fun fileFor(date: String): File = File(directory, "$date.json")

    private fun today(): String = LocalDate.now().toString()

    private fun evictOldEntries() {
        val cutoff = System.currentTimeMillis() - maxAgeMs
        directory.listFiles()?.forEach { file ->
            if (file.lastModified() in 1 until cutoff) {
                file.delete()
            }
        }
    }

    companion object {
        const val DIR_NAME = "meal-plan-cache"
        const val MAX_AGE_DAYS = 7
    }
}

// ---------------------------------------------------------------------------
// JSON marshalling — kept private to the cache so the rest of the app can
// continue working with the plain `MealPlan` data class.
// ---------------------------------------------------------------------------

private fun MealPlan.toJson(cachedAtMillis: Long): String {
    val obj = JSONObject()
        .put("dateLabel", dateLabel)
        .put("cachedAt", cachedAtMillis)

    val mealsArray = JSONArray()
    meals.forEach { meal ->
        val mealObj = JSONObject()
            .put("id", meal.id)
            .put("type", meal.type.apiValue)
            .put("title", meal.title)
            .put("description", meal.description ?: JSONObject.NULL)
            .put("calories", meal.calories)
            .put("proteinGrams", meal.proteinGrams)
            .put("carbsGrams", meal.carbsGrams)
            .put("fatGrams", meal.fatGrams)
            .put("imageUrl", meal.imageUrl ?: JSONObject.NULL)

        val ingredientsArr = JSONArray()
        meal.ingredients.forEach { ing ->
            ingredientsArr.put(
                JSONObject()
                    .put("name", ing.name)
                    .put("grams", ing.grams)
                    .put("calories", ing.calories)
                    .put("proteinGrams", ing.proteinGrams)
                    .put("carbsGrams", ing.carbsGrams)
                    .put("fatGrams", ing.fatGrams),
            )
        }
        mealObj.put("ingredients", ingredientsArr)
        mealObj.put("recipeSteps", JSONArray(meal.recipeSteps))
        mealsArray.put(mealObj)
    }
    obj.put("meals", mealsArray)
    return obj.toString()
}

private fun JSONObject.toMealPlan(): MealPlan {
    val mealsArr = optJSONArray("meals") ?: JSONArray()
    val meals = (0 until mealsArr.length()).map { i ->
        val item = mealsArr.getJSONObject(i)

        val ingArr = item.optJSONArray("ingredients") ?: JSONArray()
        val ingredients = (0 until ingArr.length()).map { j ->
            val ing = ingArr.getJSONObject(j)
            Ingredient(
                name = ing.optString("name"),
                grams = ing.optInt("grams"),
                calories = ing.optInt("calories"),
                proteinGrams = ing.optInt("proteinGrams"),
                carbsGrams = ing.optInt("carbsGrams"),
                fatGrams = ing.optInt("fatGrams"),
            )
        }

        val stepsArr = item.optJSONArray("recipeSteps") ?: JSONArray()
        val steps = (0 until stepsArr.length()).map { stepsArr.optString(it) }

        Meal(
            id = item.optString("id", "meal-$i"),
            type = mealTypeFromApi(item.optString("type", "snack")),
            title = item.optString("title", "Cached meal"),
            description = item.optString("description").takeIf { it.isNotBlank() && it != "null" },
            calories = item.optInt("calories"),
            proteinGrams = item.optInt("proteinGrams"),
            carbsGrams = item.optInt("carbsGrams"),
            fatGrams = item.optInt("fatGrams"),
            imageUrl = item.optString("imageUrl").takeIf { it.isNotBlank() && it != "null" },
            ingredients = ingredients,
            recipeSteps = steps,
        )
    }
    return MealPlan(dateLabel = optString("dateLabel", "Today"), meals = meals)
}

private fun mealTypeFromApi(value: String): MealType = when (value) {
    "breakfast" -> MealType.Breakfast
    "lunch" -> MealType.Lunch
    "dinner" -> MealType.Dinner
    else -> MealType.Snack
}
