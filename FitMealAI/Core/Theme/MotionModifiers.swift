//
//  MotionModifiers.swift
//  FitMealAI
//
//  Shared premium motion for Phase 4e polish. Kept small so every screen
//  can opt in without rewriting layouts.
//

import SwiftUI

struct ScreenEntranceModifier: ViewModifier {
    @State private var appeared = false
    var delay: Double = 0

    func body(content: Content) -> some View {
        content
            .opacity(appeared ? 1 : 0)
            .offset(y: appeared ? 0 : 14)
            .onAppear {
                withAnimation(.spring(response: 0.58, dampingFraction: 0.86).delay(delay)) {
                    appeared = true
                }
            }
    }
}

struct EmeraldGlowModifier: ViewModifier {
    @State private var pulse = false

    func body(content: Content) -> some View {
        content
            .shadow(color: AppTheme.Colors.accentPurple.opacity(pulse ? 0.30 : 0.12), radius: pulse ? 22 : 10, y: pulse ? 10 : 4)
            .onAppear {
                withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
    }
}

extension View {
    func screenEntrance(delay: Double = 0) -> some View {
        modifier(ScreenEntranceModifier(delay: delay))
    }

    func emeraldGlow() -> some View {
        modifier(EmeraldGlowModifier())
    }
}