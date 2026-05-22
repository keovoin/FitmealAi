package com.fitmealai.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONObject

/**
 * AES-256 GCM encrypted Supabase session store. Mirrors the iOS
 * `KeychainStore` so refresh tokens never leak into plain
 * SharedPreferences.
 *
 * The first read after install will initialize the key set in the
 * Android keystore. Subsequent reads/writes are zero-config.
 */
class SessionStore(context: Context) {

    private val prefs: SharedPreferences = createEncrypted(context)

    fun save(session: AuthSession) {
        val payload = JSONObject().apply {
            put(KEY_USER_ID, session.userId)
            put(KEY_EMAIL, session.email)
            put(KEY_ACCESS, session.accessToken)
            session.refreshToken?.let { put(KEY_REFRESH, it) }
            put(KEY_EXPIRES_AT, session.expiresAtEpochSeconds)
        }
        prefs.edit().putString(KEY_SESSION, payload.toString()).apply()
    }

    fun load(): AuthSession? {
        val raw = prefs.getString(KEY_SESSION, null) ?: return null
        return try {
            val obj = JSONObject(raw)
            AuthSession(
                userId = obj.optString(KEY_USER_ID),
                email = obj.optString(KEY_EMAIL),
                accessToken = obj.optString(KEY_ACCESS),
                refreshToken = obj.optString(KEY_REFRESH).ifBlank { null },
                expiresAtEpochSeconds = obj.optLong(KEY_EXPIRES_AT, 0L),
            )
        } catch (_: Throwable) {
            null
        }
    }

    fun clear() {
        prefs.edit().remove(KEY_SESSION).apply()
    }

    fun hasOnboardingCompleted(): Boolean = prefs.getBoolean(KEY_ONBOARDING, false)
    fun setOnboardingCompleted(value: Boolean) {
        prefs.edit().putBoolean(KEY_ONBOARDING, value).apply()
    }

    companion object {
        private const val FILE = "fitmeal_session_v1"
        private const val KEY_SESSION = "session_json"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_EMAIL = "email"
        private const val KEY_ACCESS = "access_token"
        private const val KEY_REFRESH = "refresh_token"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_ONBOARDING = "onboarding_complete"

        private fun createEncrypted(context: Context): SharedPreferences {
            val master = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()
            return EncryptedSharedPreferences.create(
                context,
                FILE,
                master,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
            )
        }
    }
}
