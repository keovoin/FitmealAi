package com.fitmealai.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * FCM message receiver. Mirrors iOS's UNUserNotificationCenter delegate.
 *
 * Token registration is intentionally NOT triggered here — `AppState`
 * pulls a fresh token through [FirebaseTokenRegistrar] after a successful
 * sign-in so we know which `user_id` the token belongs to.
 *
 * Real delivery requires a `google-services.json` in `app/`. Without it,
 * `FirebaseApp` never initializes, this service is never invoked, and
 * the app keeps running normally.
 */
class FitMealMessagingService : FirebaseMessagingService() {

    override fun onCreate() {
        super.onCreate()
        ensureChannel(applicationContext)
    }

    override fun onNewToken(token: String) {
        // The user might not be signed in yet; AppState re-registers
        // the token after auth completes. Log here for visibility.
        Log.i(TAG, "FCM token refreshed (len=${token.length})")
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title
            ?: message.data["title"]
            ?: "FitMeal AI"
        val body = message.notification?.body
            ?: message.data["body"]
            ?: ""
        Log.i(TAG, "FCM payload: $title — $body")
        // System notification rendering is handled by the FCM SDK when the
        // payload includes the `notification` field. Data-only payloads
        // could be foreground-handled here if we ever need custom UI; for
        // now the default channel is sufficient.
    }

    companion object {
        const val TAG = "FitMealFCM"
        const val CHANNEL_ID = "fitmeal_default"
        const val CHANNEL_NAME = "FitMeal updates"
        const val CHANNEL_DESCRIPTION =
            "Meal plan ready, payment approved, reminders, and weekly recaps."

        fun ensureChannel(context: Context) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                ?: return
            if (nm.getNotificationChannel(CHANNEL_ID) != null) return
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = CHANNEL_DESCRIPTION
            }
            nm.createNotificationChannel(channel)
        }
    }
}
