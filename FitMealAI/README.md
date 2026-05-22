# FitMealAI (iOS / SwiftUI)

This folder contains the native iOS implementation of FitMeal AI.

The sibling `src/` folder is the React/Vite Figma Make export and is the design source-of-truth, but it is **not** the production app. Anything inside this `FitMealAI/` folder is owned by the iOS workstream.

## Scope ownership

- `FitMealAI/` and `.kiro/` are owned by the iOS team. **Figma Make must not modify these paths.**
- `src/`, `index.html`, `package.json`, `vite.config.*` belong to the React Figma export.

## Phase 1 contents

- `App/` - app entry and root container
- `Core/Theme/` - design tokens and reusable UI components
- `Core/Models/` - value types (UserGoal, MealPlan, Habit, etc.)
- `Core/Services/PreferencesStore.swift` - UserDefaults-backed prefs (mirrors React preferences.ts)
- `Resources/MockData/MockData.swift` - sample data for SwiftUI previews

Phase 2 will add screens under `Features/`.

## How to open

1. Open Xcode -> File -> New -> Project -> iOS App, name `FitMealAI`, language Swift, interface SwiftUI, minimum iOS 17.
2. Delete the auto-generated `FitMealAIApp.swift` and `ContentView.swift`.
3. Drag this `FitMealAI/` folder into the Xcode project ("Create groups").
4. Build with iPhone 15 Pro target. Open any component file - the canvas will render its `#Preview`.

## Phase 4c/4d runtime config

The iOS app now reads Supabase/API values from Info.plist keys so real values stay out of Git:

| Info.plist key | Value |
|---|---|
| `FITMEAL_SUPABASE_URL` | Your Supabase project URL |
| `FITMEAL_SUPABASE_ANON_KEY` | Your public Supabase anon key |
| `FITMEAL_API_BASE_URL` | Your hosted `admin-web` base URL |

Use `Resources/Config/FitMealConfig.example.plist` as the template, or open the admin Settings page and use the **iOS runtime config** helper to generate the snippet.

Email/password and Apple Sign In are wired through Supabase Auth. Google Sign-In has the service hook ready (`AuthService.signInWithIDToken(provider: .google, idToken:)`); add the GoogleSignIn iOS package/client ID in Xcode to complete the native token handoff.
