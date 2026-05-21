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
