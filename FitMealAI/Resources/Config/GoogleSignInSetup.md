# Google Sign-In iOS Setup

The native token flow is implemented in `Core/Services/GoogleSignInService.swift`.
It is compiled conditionally, so the app still builds before the Google package is added.

When ready:

1. In Xcode, add Swift Package `https://github.com/google/GoogleSignIn-iOS`.
2. Add these Info.plist keys:
   - `FITMEAL_GOOGLE_IOS_CLIENT_ID`
   - `FITMEAL_GOOGLE_REVERSED_CLIENT_ID`
   - `FITMEAL_GOOGLE_SERVER_CLIENT_ID`
3. Add the reversed client ID as a URL scheme in the app target.
4. Confirm Supabase Auth has Google enabled with the matching web/server client ID.
5. Tap **Continue with Google**. The app will:
   - open native Google Sign-In,
   - read `result.user.idToken.tokenString`,
   - pass that token to Supabase via `AuthService.signInWithIDToken(provider: .google, idToken:)`.

```swift
try await authService.signInWithIDToken(provider: .google, idToken: idToken)
```

Do not put Supabase service-role keys or Google client secrets in the iOS app.