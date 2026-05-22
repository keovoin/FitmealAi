# Google Sign-In iOS Setup

Google is scaffolded but not activated because credentials were not provided yet.

When ready:

1. In Xcode, add Swift Package `https://github.com/google/GoogleSignIn-iOS`.
2. Add these Info.plist keys:
   - `FITMEAL_GOOGLE_IOS_CLIENT_ID`
   - `FITMEAL_GOOGLE_REVERSED_CLIENT_ID`
   - `FITMEAL_GOOGLE_SERVER_CLIENT_ID`
3. Add the reversed client ID as a URL scheme in the app target.
4. In `GoogleSignInService.fetchGoogleIDToken()`, call GoogleSignIn native flow and pass the returned ID token to:

```swift
try await authService.signInWithIDToken(provider: .google, idToken: idToken)
```

Do not put Supabase service-role keys or Google client secrets in the iOS app.