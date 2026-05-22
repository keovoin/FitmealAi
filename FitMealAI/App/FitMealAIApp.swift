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
                .preferredColorScheme(.dark) // v1: dark glass UI only
                .onOpenURL { url in
                    _ = GoogleSignInService(config: appState.config).handleOpenURL(url)
                }
        }
    }
}
