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
- Optional Firebase later for user account and payment approval

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
