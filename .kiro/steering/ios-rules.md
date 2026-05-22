# iOS Development Rules

Always:
- Use SwiftUI
- Use MVVM
- Use reusable components
- Keep view files small
- Use async/await
- Use localized strings where possible
- Support dark glass UI only for v1
- Use iPhone 15 Pro as primary preview target

Never:
- Put API keys in the app
- Hardcode payment approval
- Mix business logic directly inside views
- Create huge single SwiftUI files
- Skip loading, empty, and error states

Preview:
- Every major view should include a #Preview block
- Use mock sample data for previews

Reuse rules:
- Multi-select grid pickers (diet types, workout types) should share a generic `MultiSelectGrid<T>` component
- Step indicator (Goal -> Workout -> Meal) is a single `OnboardingStepIndicator` component, never duplicated
- Segmented pills (cook time, days, duration) share a single `SegmentedPicker` component
- Settings sub-screens reuse the same pickers as Onboarding screens
