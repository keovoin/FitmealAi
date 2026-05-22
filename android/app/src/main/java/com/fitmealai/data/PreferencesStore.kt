package com.fitmealai.data

import android.content.Context
import android.content.SharedPreferences
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.WorkoutPrefs
import org.json.JSONArray
import org.json.JSONObject

/**
 * UserDefaults equivalent for meal/workout prefs. Mirrors iOS
 * `Core/Services/PreferencesStore.swift`.
 *
 * Backed by plain SharedPreferences (not encrypted) since the values
 * here are non-sensitive (diet choices etc).
 */
class PreferencesStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    var workoutPrefs: WorkoutPrefs = readWorkout()
        private set

    var mealPrefs: MealPrefs = readMeal()
        private set

    fun saveWorkoutPrefs(prefs: WorkoutPrefs) {
        workoutPrefs = prefs
        val json = JSONObject()
            .put("types", JSONArray(prefs.types.toList()))
            .put("days", prefs.days)
            .put("duration", prefs.duration)
        this.prefs.edit().putString(KEY_WORKOUT, json.toString()).apply()
    }

    fun saveMealPrefs(prefs: MealPrefs) {
        mealPrefs = prefs
        val json = JSONObject()
            .put("diets", JSONArray(prefs.diets.toList()))
            .put("timings", JSONArray(prefs.timings.toList()))
            .put("cookTime", prefs.cookTime)
            .put("allergies", JSONArray(prefs.allergies.toList()))
        this.prefs.edit().putString(KEY_MEAL, json.toString()).apply()
    }

    private fun readWorkout(): WorkoutPrefs {
        val raw = prefs.getString(KEY_WORKOUT, null) ?: return WorkoutPrefs.Default
        return runCatching {
            val obj = JSONObject(raw)
            WorkoutPrefs(
                types = obj.toStringSet("types"),
                days = obj.optString("days", WorkoutPrefs.Default.days),
                duration = obj.optString("duration", WorkoutPrefs.Default.duration),
            )
        }.getOrDefault(WorkoutPrefs.Default)
    }

    private fun readMeal(): MealPrefs {
        val raw = prefs.getString(KEY_MEAL, null) ?: return MealPrefs.Default
        return runCatching {
            val obj = JSONObject(raw)
            MealPrefs(
                diets = obj.toStringSet("diets"),
                timings = obj.toStringSet("timings"),
                cookTime = obj.optString("cookTime", MealPrefs.Default.cookTime),
                allergies = obj.toStringSet("allergies"),
            )
        }.getOrDefault(MealPrefs.Default)
    }

    private fun JSONObject.toStringSet(key: String): Set<String> {
        val arr = optJSONArray(key) ?: return emptySet()
        return (0 until arr.length()).mapNotNull { arr.optString(it).ifBlank { null } }.toSet()
    }

    companion object {
        private const val FILE = "fitmeal_prefs_v1"
        private const val KEY_WORKOUT = "workout_prefs"
        private const val KEY_MEAL = "meal_prefs"
    }
}
