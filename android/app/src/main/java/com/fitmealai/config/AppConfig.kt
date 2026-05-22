package com.fitmealai.config

import com.fitmealai.BuildConfig

data class AppConfig(
    val supabaseUrl: String = BuildConfig.FITMEAL_SUPABASE_URL,
    val supabaseAnonKey: String = BuildConfig.FITMEAL_SUPABASE_ANON_KEY,
    val apiBaseUrl: String = BuildConfig.FITMEAL_API_BASE_URL,
    val googleAndroidClientId: String = BuildConfig.FITMEAL_GOOGLE_ANDROID_CLIENT_ID,
    val googleWebClientId: String = BuildConfig.FITMEAL_GOOGLE_WEB_CLIENT_ID,
) {
    val isSupabaseReady: Boolean get() = supabaseUrl.isNotBlank() && supabaseAnonKey.isNotBlank()
    val isApiReady: Boolean get() = apiBaseUrl.isNotBlank()
    val isGoogleReady: Boolean get() = googleAndroidClientId.isNotBlank() && googleWebClientId.isNotBlank()
}

class MissingConfigException(name: String) : IllegalStateException("Missing required config: $name")

fun AppConfig.requireSupabase() {
    if (!isSupabaseReady) throw MissingConfigException("FITMEAL_SUPABASE_URL / FITMEAL_SUPABASE_ANON_KEY")
}

fun AppConfig.requireApi() {
    if (!isApiReady) throw MissingConfigException("FITMEAL_API_BASE_URL")
}