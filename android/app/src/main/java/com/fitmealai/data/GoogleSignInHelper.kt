package com.fitmealai.data

import android.content.Context
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialException
import com.fitmealai.config.AppConfig
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import java.security.SecureRandom

/**
 * Native Google Sign-In bridge using Jetpack Credential Manager.
 * Mirrors the iOS `GoogleSignInService`. Requires:
 *   - FITMEAL_GOOGLE_WEB_CLIENT_ID (server client) configured.
 *   - The Activity context (passed in at call-site).
 *
 * The returned ID token is then handed to `AuthRepository.signInWithGoogle`.
 */
class GoogleSignInHelper(private val config: AppConfig = AppConfig()) {

    suspend fun fetchIdToken(activityContext: Context): GoogleIdResult {
        if (!config.isGoogleReady) {
            return GoogleIdResult.NotConfigured
        }

        val nonce = randomNonce()
        val googleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId(config.googleWebClientId)
            .setAutoSelectEnabled(true)
            .setNonce(nonce)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        return try {
            val response = CredentialManager.create(activityContext)
                .getCredential(activityContext, request)
            val credential = response.credential
            if (credential is CustomCredential &&
                credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
            ) {
                val parsed = GoogleIdTokenCredential.createFrom(credential.data)
                GoogleIdResult.Ok(parsed.idToken, nonce)
            } else {
                GoogleIdResult.Error("Unexpected credential type: ${credential.type}")
            }
        } catch (e: GetCredentialException) {
            GoogleIdResult.Error(e.message ?: "Google Sign-In failed")
        } catch (e: GoogleIdTokenParsingException) {
            GoogleIdResult.Error(e.message ?: "Could not parse Google ID token")
        }
    }

    private fun randomNonce(): String {
        val random = SecureRandom()
        val bytes = ByteArray(16)
        random.nextBytes(bytes)
        return bytes.joinToString("") { byte -> "%02x".format(byte) }
    }
}

sealed interface GoogleIdResult {
    data object NotConfigured : GoogleIdResult
    data class Ok(val idToken: String, val nonce: String) : GoogleIdResult
    data class Error(val message: String) : GoogleIdResult
}
