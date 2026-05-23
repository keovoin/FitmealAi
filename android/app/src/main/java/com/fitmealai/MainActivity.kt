package com.fitmealai

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.fitmealai.push.FitMealMessagingService
import com.fitmealai.ui.AppState
import com.fitmealai.ui.FitMealAndroidApp
import com.fitmealai.ui.theme.FitMealTheme

class MainActivity : ComponentActivity() {

    private val notificationsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* User decision is handled silently; channel + service are
           already registered. We re-pull the FCM token now so the new
           consent unblocks delivery. */
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Pre-create the notification channel so any push that arrives
        // before the user opens Settings is correctly displayed.
        FitMealMessagingService.ensureChannel(applicationContext)
        ensureNotificationsPermission()

        setContent {
            // Read the persisted theme picker selection at the root so
            // every screen recomposes when the user flips the toggle.
            val state: AppState = viewModel()
            val scheme by state.colorScheme.collectAsState()
            FitMealTheme(appColorScheme = scheme) {
                FitMealAndroidApp()
            }
        }
    }

    /**
     * Android 13+ requires runtime consent for `POST_NOTIFICATIONS`.
     * Older versions auto-grant via the manifest entry. Asking on launch
     * is the path of least resistance for now; we can move it behind a
     * Settings-screen "Enable notifications" CTA later.
     */
    private fun ensureNotificationsPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        val granted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
        if (!granted) {
            notificationsLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
