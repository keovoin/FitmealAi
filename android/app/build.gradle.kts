plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.fitmealai"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.fitmealai"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0-a1"

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

    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}