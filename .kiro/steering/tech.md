# Technical Context

Platform:
- iOS

Language:
- Swift

UI:
- SwiftUI

Architecture:
- MVVM
- Reusable components
- Small views
- Async/await for networking

Storage:
- SwiftData for local saved plans, habits, and user preferences
- UserDefaults for lightweight onboarding/preference storage (mirrors the React `preferences.ts` localStorage)
- Optional Firebase later for user account and payment approval

Auth:
- Email + password (handled by backend)
- Phone OTP (handled by backend)
- Sign in with Apple (native AuthenticationServices)
- Sign in with Google (Google Sign-In iOS SDK)
- All token exchange must go through the secure backend; never call third-party APIs from the device

Payments:
- StoreKit 2 for App Store subscriptions
- ABA manual payment flow may be included as a pending approval design, but StoreKit should be primary for App Store release

AI:
- AI calls must go through a secure backend
- Never store API keys inside the iOS app

Minimum iOS:
- iOS 17+

Design:
- Apple-style glassmorphism
- Use .ultraThinMaterial
- Use rounded corners 24
- Use gradient backgrounds
