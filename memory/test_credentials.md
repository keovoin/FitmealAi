# Test Credentials

## Admin Web
- Local development fallback password: `dev-only-password-please-change`
- Production/hosted admin password: set by `ADMIN_PASSWORD` environment variable outside this workspace. The real value is not stored in this repo.

## Mobile/iOS
- No fixed test user was created in this workspace. Supabase Auth users should be created through the iOS email/password flow or Supabase dashboard.

## Google Sign-In
- No Google test account or OAuth client IDs were provided.
- Native Google runtime validation requires adding the GoogleSignIn-iOS package and real Google client IDs in Xcode.
