//
//  FitMealAIApp.swift
//  FitMealAI
//
//  App entry point. Keeps logic minimal and delegates to RootView.
//

import SwiftUI

@main
struct FitMealAIApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(resolvedColorScheme)
                .onOpenURL { url in
                    _ = GoogleSignInService(config: appState.config).handleOpenURL(url)
                }
        }
    }

    private var resolvedColorScheme: ColorScheme? {
        switch appState.preferencesStore.colorScheme {
        case .system: return nil   // follow device setting
        case .dark:   return .dark
        case .light:  return .light
        }
    }
}
