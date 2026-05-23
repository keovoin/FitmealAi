plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// Apply Google Services (FCM) only when a real google-services.json
// is present in app/. Lets `./gradlew :app:assembleDebug` succeed for
// contributors who haven't downloaded the Firebase config yet, while
// still wiring Firebase normally for full release builds.
val hasGoogleServices = file("google-services.json").exists()
if (hasGoogleServices) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "com.fitmealai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fitmealai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.2.0-a4"

        vectorDrawables.useSupportLibrary = true

        fun configValue(name: String): String =
            (project.findProperty(name) as? String)
                ?: System.getenv(name)
                ?: ""

        buildConfigField("String", "FITMEAL_SUPABASE_URL", "\"${configValue("FITMEAL_SUPABASE_URL")}\"")
        buildConfigField("String", "FITMEAL_SUPABASE_ANON_KEY", "\"${configValue("FITMEAL_SUPABASE_ANON_KEY")}\"")
        buildConfigField("String", "FITMEAL_API_BASE_URL", "\"${configValue("FITMEAL_API_BASE_URL")}\"")
        buildConfigField("String", "FITMEAL_GOOGLE_ANDROID_CLIENT_ID", "\"${configValue("FITMEAL_GOOGLE_ANDROID_CLIENT_ID")}\"")
        buildConfigField("String", "FITMEAL_GOOGLE_WEB_CLIENT_ID", "\"${configValue("FITMEAL_GOOGLE_WEB_CLIENT_ID")}\"")
        buildConfigField("String", "FITMEAL_TELEGRAM_BOT_USERNAME", "\"${configValue("FITMEAL_TELEGRAM_BOT_USERNAME")}\"")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.12.01")

    implementation(composeBom)
    androidTestImplementation(composeBom)

    // Compose + lifecycle + navigation
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material:material-icons-extended")

    // A3: encrypted session storage
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    // A3: Google Sign-In via Credential Manager
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")

    // A4: Google Play Billing for Silver/Gold subscriptions
    implementation("com.android.billingclient:billing-ktx:7.1.1")

    // A5: Firebase Cloud Messaging for push notifications. Working FCM
    // also requires a `google-services.json` in `app/` (see
    // `hasGoogleServices` flag above). The dependency itself compiles
    // and links without that file; runtime calls are wrapped in
    // try/catch so the app degrades gracefully when Firebase isn't
    // initialized.
    implementation(platform("com.google.firebase:firebase-bom:33.7.0"))
    implementation("com.google.firebase:firebase-messaging-ktx")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
