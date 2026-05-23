plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    // Firebase Cloud Messaging is opt-in: declare the plugin here but do
    // not apply it. The :app module applies it conditionally when a real
    // google-services.json is present, so CI (and contributors without
    // FCM credentials) still get green builds.
    id("com.google.gms.google-services") version "4.4.2" apply false
}
