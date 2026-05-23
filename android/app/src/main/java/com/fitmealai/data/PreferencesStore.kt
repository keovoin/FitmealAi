package com.fitmealai.data

import android.content.Context
import android.content.SharedPreferences
import com.fitmealai.domain.AppColorScheme
import com.fitmealai.domain.MealPrefs
import com.fitmealai.domain.NotificationPrefs
import com.fitmealai.domain.WorkoutPrefs
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject

/**
 * UserDefaults equivalent for non-sensitive client preferences. Mirrors iOS
 * `Core/Services/PreferencesStore.swift` plus an additional cache of
 * `NotificationPrefs` so the toggle UI can render instantly while the
 * server round-trip resolves.
 *
 * Backed by plain SharedPreferences (not encrypted) since the values
 * here are non-sensitive (diet choices, theme mode, notification toggles).
 *
 * Theme is exposed as a `StateFlow` so `MainActivity` can recompose the
 * Material theme when the user picks a different scheme.
 */
class PreferencesStore(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    var workoutPrefs: WorkoutPrefs = readWorkout()
        private set

    var mealPrefs: MealPrefs = readMeal()
        private set

    var notificationPrefs: NotificationPrefs = readNotificationPrefs()
        private set

    private val _colorScheme = MutableStateFlow(readColorScheme())
    val colorScheme: StateFlow<AppColorScheme> = _colorScheme.asStateFlow()

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

    fun saveColorScheme(scheme: AppColorScheme) {
        _colorScheme.value = scheme
        prefs.edit().putString(KEY_COLOR_SCHEME, scheme.storageValue).apply()
    }

    /**
     * Caches the latest server-side notification prefs so the UI can
     * render synchronously on next launch. The actual source of truth
     * lives in Supabase (`notification_prefs` table).
     */
    fun saveNotificationPrefs(prefs: NotificationPrefs) {
        notificationPrefs = prefs
        val json = JSONObject()
            .put("meal_plan_ready", prefs.mealPlanReady)
            .put("payment_approved", prefs.paymentApproved)
            .put("water_reminder", prefs.waterReminder)
            .put("workout_reminder", prefs.workoutReminder)
            .put("habit_streak", prefs.habitStreak)
            .put("weekly_summary", prefs.weeklySummary)
            .put("telegram_linked", prefs.telegramLinked)
        this.prefs.edit().putString(KEY_NOTIFICATIONS, json.toString()).apply()
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

    private fun readNotificationPrefs(): NotificationPrefs {
        val raw = prefs.getString(KEY_NOTIFICATIONS, null) ?: return NotificationPrefs.Default
        return runCatching {
            val obj = JSONObject(raw)
            NotificationPrefs(
                mealPlanReady = obj.optBoolean("meal_plan_ready", true),
                paymentApproved = obj.optBoolean("payment_approved", true),
                waterReminder = obj.optBoolean("water_reminder", true),
                workoutReminder = obj.optBoolean("workout_reminder", true),
                habitStreak = obj.optBoolean("habit_streak", true),
                weeklySummary = obj.optBoolean("weekly_summary", true),
                telegramLinked = obj.optBoolean("telegram_linked", false),
            )
        }.getOrDefault(NotificationPrefs.Default)
    }

    private fun readColorScheme(): AppColorScheme {
        val raw = prefs.getString(KEY_COLOR_SCHEME, null) ?: return AppColorScheme.System
        return AppColorScheme.fromStorage(raw)
    }

    private fun JSONObject.toStringSet(key: String): Set<String> {
        val arr = optJSONArray(key) ?: return emptySet()
        return (0 until arr.length()).mapNotNull { arr.optString(it).ifBlank { null } }.toSet()
    }

    companion object {
        private const val FILE = "fitmeal_prefs_v1"
        private const val KEY_WORKOUT = "workout_prefs"
        private const val KEY_MEAL = "meal_prefs"
        private const val KEY_COLOR_SCHEME = "color_scheme"
        private const val KEY_NOTIFICATIONS = "notification_prefs"
    }
}
