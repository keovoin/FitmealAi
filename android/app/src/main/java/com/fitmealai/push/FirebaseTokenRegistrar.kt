package com.fitmealai.push

import android.util.Log
import com.google.android.gms.tasks.Task
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

/**
 * Thin wrapper around `FirebaseMessaging.getInstance().token` that turns
 * the Play Services [Task] API into a suspending function. Returns null
 * (instead of throwing) when Firebase isn't initialized — the app should
 * keep working when contributors don't have `google-services.json`.
 */
object FirebaseTokenRegistrar {

    suspend fun fetchToken(): String? {
        return runCatching {
            suspendCancellableCoroutine<String?> { cont ->
                val task: Task<String> = FirebaseMessaging.getInstance().token
                task.addOnCompleteListener { t ->
                    if (t.isSuccessful) {
                        cont.resume(t.result)
                    } else {
                        Log.w(TAG, "FCM token fetch failed: ${t.exception?.message}")
                        cont.resume(null)
                    }
                }
            }
        }.getOrElse {
            // FirebaseApp not initialized (no google-services.json) lands here.
            Log.w(TAG, "FCM not available: ${it.message}")
            null
        }
    }

    private const val TAG = "FitMealFCM"
}
