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
