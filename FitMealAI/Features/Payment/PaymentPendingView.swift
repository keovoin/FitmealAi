//
//  PaymentPendingView.swift
//  FitMealAI
//
//  Confirmation screen shown after submitting an ABA payment receipt.
//  Stateless - takes the submitted PaymentRequest and renders status,
//  amount, transaction id, and a "Done" action.
//

import SwiftUI

struct PaymentPendingView: View {

    let request: PaymentRequest
    var onDone: (() -> Void)? = nil
    var onContactSupport: (() -> Void)? = nil

    var body: some View {
        ScreenContainer(showGlows: true) {
            TopBar(title: "Receipt submitted", subtitle: "We're reviewing your payment") {
                Image(systemName: "hourglass")
                    .foregroundStyle(AppTheme.Colors.goldStart)
            }

            heroCard
            statusCard
            timelineCard
            actionsBlock
            supportFooter
        }
    }

    // MARK: - Sections

    private var heroCard: some View {
        VStack(spacing: AppTheme.Spacing.medium) {
            ZStack {
                Circle()
                    .fill(AppTheme.Gradients.gold)
                    .frame(width: 96, height: 96)
                    .shadow(color: AppTheme.Colors.goldStart.opacity(0.5), radius: 24)
                Image(systemName: "checkmark")
                    .font(.system(size: 40, weight: .bold))
                    .foregroundStyle(.white)
            }

            VStack(spacing: 4) {
                Text("Thanks, Alex!")
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("Your payment is pending approval. We'll unlock your plan once we verify the receipt.")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, AppTheme.Spacing.medium)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, AppTheme.Spacing.small)
    }

    private var statusCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                HStack {
                    Text("Status")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                    Spacer()
                    Tag(
                        title: "Pending review",
                        icon: "hourglass",
                        variant: .gold,
                        isActive: true
                    )
                }
                detailRow(label: "Plan", value: "FitMeal \(request.tier.rawValue)")
                detailRow(label: "Amount", value: request.amount)
                detailRow(label: "Transaction", value: displayTransactionId)
                detailRow(label: "Submitted", value: submittedDateLine)
            }
        }
    }

    private var timelineCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                Text("What happens next")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)

                timelineRow(
                    icon: "tray.and.arrow.down.fill",
                    iconBg: AppTheme.Colors.successGreen,
                    title: "Receipt received",
                    detail: "We received your screenshot and transaction ID.",
                    isComplete: true
                )
                timelineRow(
                    icon: "magnifyingglass",
                    iconBg: AppTheme.Colors.accentPurple,
                    title: "We're verifying",
                    detail: "Usually takes under 24 hours.",
                    isComplete: false
                )
                timelineRow(
                    icon: "lock.open.fill",
                    iconBg: AppTheme.Colors.goldStart,
                    title: "Plan unlocked",
                    detail: "You'll get a notification once Gold is active.",
                    isComplete: false
                )
            }
        }
    }

    private var actionsBlock: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            PrimaryButton(title: "Back to FitMeal", icon: "house.fill") {
                onDone?()
            }
            SecondaryGlassButton(title: "Contact support", icon: "questionmark.circle") {
                onContactSupport?()
            }
        }
    }

    private var supportFooter: some View {
        Text("Reference your transaction ID when contacting support so we can help fast.")
            .font(AppTheme.Typography.caption)
            .foregroundStyle(AppTheme.Colors.textQuaternary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
    }

    // MARK: - Helpers

    @ViewBuilder
    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textSecondary)
            Spacer()
            Text(value)
                .font(AppTheme.Typography.body.weight(.medium))
                .foregroundStyle(AppTheme.Colors.textPrimary)
                .textSelection(.enabled)
                .lineLimit(1)
        }
    }

    @ViewBuilder
    private func timelineRow(icon: String, iconBg: Color, title: String, detail: String, isComplete: Bool) -> some View {
        HStack(alignment: .top, spacing: AppTheme.Spacing.medium) {
            ZStack {
                Circle()
                    .fill(iconBg.opacity(isComplete ? 1.0 : 0.30))
                    .frame(width: 32, height: 32)
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(title)
                        .font(AppTheme.Typography.body.weight(.semibold))
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    if isComplete {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.successGreen)
                    }
                }
                Text(detail)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            Spacer(minLength: 0)
        }
    }

    private var displayTransactionId: String {
        request.transactionId.isEmpty ? "-" : request.transactionId
    }

    private var submittedDateLine: String {
        guard let date = request.submittedAt else { return "Just now" }
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, h:mm a"
        return formatter.string(from: date)
    }
}

#Preview("PaymentPendingView") {
    PaymentPendingView(request: MockData.pendingPayment)
        .preferredColorScheme(.dark)
}
