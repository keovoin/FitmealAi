# Project Structure

Use this folder structure:

FitMealAI/
  App/
    FitMealAIApp.swift
    RootView.swift

  Core/
    Theme/
      AppTheme.swift
      GlassBackground.swift
      GlassCard.swift
      PrimaryButton.swift
      SecondaryGlassButton.swift
    Models/
      UserGoal.swift
      MealPlan.swift
      MealPrefs.swift
      WorkoutPlan.swift
      WorkoutPrefs.swift
      Habit.swift
      SubscriptionPlan.swift
      PaymentRequest.swift
      AuthCredentials.swift
    Services/
      AIService.swift
      AuthService.swift
      SubscriptionManager.swift
      PaymentService.swift
      LocalStorageService.swift
      PreferencesStore.swift

  Features/
    Splash/
    Login/
    Onboarding/
    Home/
    Meals/
    Workout/
    Habits/
    Progress/
    Paywall/
    Payment/
    Settings/
      Settings/         # SettingsView (root)
      SettingsMeal/     # SettingsMealView
      SettingsWorkout/  # SettingsWorkoutView

  Resources/
    Assets.xcassets
    MockData/
      MockData.swift

Folder protection:
- Anything inside FitMealAI/ and .kiro/ belongs to the iOS app and must NOT be touched by Figma Make sync.
- Anything inside src/, index.html, package.json, vite.config.* belongs to the React Figma export.
