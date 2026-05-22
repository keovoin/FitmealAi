//
//  PaywallView.swift
//  FitMealAI
//
//  Free / Silver / Gold cards (Gold highlighted with gold gradient ring
//  and glow), StoreKit primary action, Restore + ABA secondary actions.
//

import SwiftUI

struct PaywallView: View {
    @StateObject private var vm: PaywallViewModel

    var onClose: (() -> Void)? = nil
    var onPurchased: (() -> Void)? = nil
    var onABAPaymentTapped: (() -> Void)? = nil

    init(
        viewModel: PaywallViewModel = PaywallViewModel(),
        onClose: (() -> Void)? = nil,
        onPurchased: (() -> Void)? = nil,
        onABAPaymentTapped: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onClose = onClose
        self.onPurchased = onPurchased
        self.onABAPaymentTapped = onABAPaymentTapped
    }

    var body: some View {
        ScreenContainer(showGlows: true) {
            TopBar(title: "Choose your plan", showBack: true, onBack: { onClose?() }) {
                Image(systemName: "sparkles")
                    .foregroundStyle(AppTheme.Colors.goldStart)
            }

            heroCard
            planCards

            if let error = vm.errorMessage {
                Text(error)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.errorRed)
            }

            PrimaryButton(
                title: vm.primaryButtonTitle,
                icon: "lock.shield.fill",
                isLoading: vm.isPurchasing
            ) {
                Task {
                    if await vm.purchase() { onPurchased?() }
                }
            }

            secondaryActions
            footer
        }
        .task {
            // Loads StoreKit 2 products + their localized prices the first
            // time the paywall opens. No-op when SubscriptionManager isn't
            // wired (preview).
            await vm.loadProducts()
            // Resolve the per-user payment availability so we know whether
            // to show the manual ABA button (Cambodia-only by default).
            await vm.refreshPaymentOptions()
        }
    }

    // MARK: - Sections

    private var heroCard: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.medium) {
                Image(systemName: "wand.and.stars")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Circle().fill(AppTheme.Gradients.gold))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Smarter plans, every day")
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("Cancel anytime in Settings.")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                Spacer()
            }
        }
    }

    private var planCards: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            ForEach(vm.plans) { plan in
                planCard(plan)
            }
        }
    }

    @ViewBuilder
    private func planCard(_ plan: SubscriptionPlan) -> some View {
        let isSelected = vm.selectedTier == plan.tier
        let isGold = plan.tier == .gold

        Button(action: { vm.select(plan.tier) }) {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Text(plan.tier.rawValue)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    if isGold {
                        Tag(title: "BEST", icon: "sparkles", variant: .gold, isActive: true)
                    }
                    Spacer()
                    HStack(spacing: 2) {
                        Text(plan.pricePerMonth)
                            .font(AppTheme.Typography.title)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text("/mo")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    ForEach(plan.features, id: \.self) { feature in
                        HStack(spacing: 6) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(isGold ? AppTheme.Colors.goldStart : AppTheme.Colors.successGreen)
                            Text(feature)
                                .font(AppTheme.Typography.caption)
                                .foregroundStyle(AppTheme.Colors.textSecondary)
                        }
                    }
                }

                HStack {
                    Spacer()
                    selectionIndicator(isSelected: isSelected, isGold: isGold)
                }
            }
            .padding(AppTheme.Spacing.large)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.card, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.card, style: .continuous)
                    .stroke(borderColor(isSelected: isSelected, isGold: isGold), lineWidth: isSelected ? 2 : 1)
            )
            .shadow(
                color: isGold ? AppTheme.Colors.goldStart.opacity(0.25) : .clear,
                radius: isGold ? 18 : 0, y: 8
            )
        }
        .buttonStyle(PressableScaleStyle())
    }

    @ViewBuilder
    private func selectionIndicator(isSelected: Bool, isGold: Bool) -> some View {
        if isSelected {
            HStack(spacing: 4) {
                Image(systemName: "checkmark")
                    .font(.system(size: 11, weight: .bold))
                Text("Selected")
                    .font(.system(size: 11, weight: .semibold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(
                Capsule().fill(isGold ? AnyShapeStyle(AppTheme.Gradients.gold) : AnyShapeStyle(AppTheme.Gradients.primaryButton))
            )
        } else {
            Text("Tap to choose")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(AppTheme.Colors.textTertiary)
        }
    }

    private func borderColor(isSelected: Bool, isGold: Bool) -> Color {
        if isSelected {
            return isGold ? AppTheme.Colors.goldStart.opacity(0.85) : AppTheme.Colors.accentPurple.opacity(0.7)
        }
        return Color.white.opacity(0.12)
    }

    private var secondaryActions: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            SecondaryGlassButton(title: "Restore Purchase", icon: "arrow.clockwise") {
                Task { await vm.restore() }
            }
            // "Pay with ABA (manual)" is geo-locked: the admin toggle in
            // /payment-settings can disable it entirely, and the country
            // allow-list (default: Cambodia only) hides it everywhere else.
            if vm.isAbaPaymentAvailable {
                SecondaryGlassButton(title: "Pay with ABA (manual)", icon: "qrcode") {
                    onABAPaymentTapped?()
                }
            }
        }
    }

    private var footer: some View {
        Text("Subscriptions auto-renew until canceled. Manage in Settings.")
            .font(AppTheme.Typography.caption)
            .foregroundStyle(AppTheme.Colors.textQuaternary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
    }
}

#Preview("PaywallView") {
    PaywallView()
        .preferredColorScheme(.dark)
}
