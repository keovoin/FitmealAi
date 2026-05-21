//
//  FitMealAIApp.swift
//  FitMealAI
//
//  App entry point. Keeps logic minimal and delegates to RootView.
//

import SwiftUI

@main
struct FitMealAIApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .preferredColorScheme(.dark) // v1: dark glass UI only
        }
    }
}
