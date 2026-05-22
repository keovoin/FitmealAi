//
//  MainTabView.swift
//  FitMealAI
//
//  Real Phase-4d app shell replacing the previous development index.
//

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ZStack(alignment: .bottom) {
            activeTab
                .padding(.bottom, 78)

            BottomNav(selection: $appState.selectedTab)
                .padding(.bottom, AppTheme.Spacing.small)
        }
        .sheet(item: $appState.activeSheet) { sheet in
            sheetContent(sheet)
                .preferredColorScheme(.dark)
                .environmentObject(appState)
        }
    }

    @ViewBuilder
    private var activeTab: some View {
        switch appState.selectedTab {
        case .home:
            HomeDashboardView(
                onOpenMeals: { appState.selectedTab = .meals },
                onOpenWorkout: { appState.selectedTab = .workout },
                onOpenHabits: { appState.selectedTab = .habits },
                onUpgradeTapped: { appState.activeSheet = .paywall },
                onRegenerateTapped: { appState.selectedTab = .meals }
            )
        case .meals:
            MealPlanView(onUpgradeTapped: { appState.activeSheet = .paywall })
        case .workout:
            WorkoutView()
        case .habits:
            HabitsView()
        case .progress:
            ProgressDashboardView()
        case .settings:
            SettingsView(
                onOpenWorkoutSettings: { appState.activeSheet = .workoutSettings },
                onOpenMealSettings: { appState.activeSheet = .mealSettings },
                onOpenPaywall: { appState.activeSheet = .paywall },
                onSignOut: { Task { await appState.signOut() } }
            )
        }
    }

    @ViewBuilder
    private func sheetContent(_ sheet: AppSheet) -> some View {
        switch sheet {
        case .paywall:
            PaywallView(
                viewModel: PaywallViewModel(
                    subscriptionManager: appState.subscriptionManager
                ),
                onClose: { appState.activeSheet = nil },
                onPurchased: { appState.activeSheet = nil },
                onABAPaymentTapped: { appState.activeSheet = .abaPayment }
            )
        case .abaPayment:
            ABAPaymentView(
                viewModel: ABAPaymentViewModel(
                    receiptUploader: ReceiptUploadService(
                        config: appState.config,
                        authService: appState.authService,
                    ),
                    authService: appState.authService,
                    config: appState.config,
                ),
                onBack: { appState.activeSheet = .paywall },
                onSubmitted: { request in appState.activeSheet = .paymentPending(request) }
            )
        case .paymentPending(let request):
            PaymentPendingView(
                request: request,
                onDone: { appState.activeSheet = nil }
            )
        case .workoutSettings:
            SettingsWorkoutView(
                store: appState.preferencesStore,
                onBack: { appState.activeSheet = nil }
            )
        case .mealSettings:
            SettingsMealView(
                store: appState.preferencesStore,
                onBack: { appState.activeSheet = nil }
            )
        }
    }
}

#Preview("MainTabView") {
    MainTabView()
        .environmentObject(AppState.preview)
        .preferredColorScheme(.dark)
}