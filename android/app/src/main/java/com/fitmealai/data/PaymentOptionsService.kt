package com.fitmealai.data

import com.fitmealai.config.AppConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

/**
 * Calls /api/payments/options to find out which payment methods are
 * available for the current user. The server side computes this from:
 *   - app_settings.aba_payment.enabled        (admin toggle)
 *   - app_settings.aba_payment.allowed_regions (country allow-list)
 *   - the IP-resolved country of this request  (Vercel header)
 *
 * Mirrors the iOS [PaymentOptionsService]. We use this to hide the
 * "Pay with ABA" button on the paywall when the user is outside the
 * Cambodia allow-list.
 */
class PaymentOptionsService(private val config: AppConfig = AppConfig()) {

    /**
     * Snapshot of `/api/payments/options`. Only the booleans are
     * load-bearing; `detectedCountry` is informational.
     */
    data class Options(
        val abaEnabled: Boolean,
        val abaAllowedRegions: List<String>,
        val abaAvailableForUser: Boolean,
        val khqrAvailable: Boolean,
        val activeKhqrProviders: List<String>,
        val detectedCountry: String?,
    ) {
        companion object {
            /**
             * Pessimistic default used when the network call fails: hides
             * the ABA button (we don't want to show a region-locked feature
             * outside its region) but keeps KHQR visible since the worst
             * case there is a transient gateway error.
             */
            val Unavailable = Options(
                abaEnabled = false,
                abaAllowedRegions = emptyList(),
                abaAvailableForUser = false,
                khqrAvailable = true,
                activeKhqrProviders = emptyList(),
                detectedCountry = null,
            )
        }
    }

    suspend fun fetch(): Options {
        if (config.apiBaseUrl.isBlank()) return Options.Unavailable
        val url = "${config.apiBaseUrl.trimEnd('/')}/api/payments/options"
        return withContext(Dispatchers.IO) {
            try {
                val connection = (URL(url).openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 10_000
                    readTimeout = 10_000
                    setRequestProperty("Accept", "application/json")
                }
                if (connection.responseCode !in 200..299) {
                    return@withContext Options.Unavailable
                }
                val text = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(text)
                val aba = json.optJSONObject("aba_payment") ?: JSONObject()
                val khqr = json.optJSONObject("khqr_payment") ?: JSONObject()
                Options(
                    abaEnabled = aba.optBoolean("enabled", false),
                    abaAllowedRegions = aba.optJSONArray("allowed_regions")?.let { arr ->
                        (0 until arr.length()).mapNotNull { arr.optString(it).ifBlank { null } }
                    } ?: emptyList(),
                    abaAvailableForUser = aba.optBoolean("available_for_user", false),
                    khqrAvailable = khqr.optBoolean("available", true),
                    activeKhqrProviders = khqr.optJSONArray("active_providers")?.let { arr ->
                        (0 until arr.length()).mapNotNull { arr.optString(it).ifBlank { null } }
                    } ?: emptyList(),
                    detectedCountry = json.optString("detected_country").ifBlank { null },
                )
            } catch (_: Throwable) {
                Options.Unavailable
            }
        }
    }
}
