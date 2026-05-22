# Test Credentials

## Admin Web
- Local development fallback password: `dev-only-password-please-change`
- Production/hosted admin password: set by `ADMIN_PASSWORD` environment variable outside this workspace. The real value is not stored in this repo.

## Mobile/iOS
- No fixed test user was created in this workspace. Supabase Auth users should be created through the iOS email/password flow or Supabase dashboard.
- Real `FITMEAL_SUPABASE_URL`, `FITMEAL_SUPABASE_ANON_KEY`, and `FITMEAL_API_BASE_URL` were not provided in chat, so placeholders remain.

## Google Sign-In
- No Google test account or OAuth client IDs were provided.
- Native Google runtime validation requires adding the GoogleSignIn-iOS package and real Google client IDs in Xcode.
- Android Google Credential Manager runtime still requires Google package/client IDs.

## Android
- Android reads config from Gradle properties/env.
- No real mobile credentials are stored in this repo.
