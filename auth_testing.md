# Auth Testing Notes

## Current status

- Admin web auth can be tested locally with the fallback password documented in `/app/memory/test_credentials.md`.
- iOS Supabase/Apple/Google auth code paths are implemented, but runtime validation requires real Info.plist values and Xcode.
- Android Supabase email/password repository is wired through config-driven REST calls.
- Android Google still requires Credential Manager to collect an ID token before calling `signInWithGoogleIdToken`.

## Required before live mobile auth testing

1. Add real Supabase URL and anon key to iOS Info.plist / Android Gradle properties.
2. Add Google client IDs and URL schemes for iOS.
3. Add Android Google Credential Manager dependency and OAuth client IDs.
4. Create a Supabase test user or use the app sign-up flow.

Do not store user Google passwords or Supabase service-role keys in mobile apps.