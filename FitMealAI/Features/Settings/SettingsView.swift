//
//  SettingsView.swift
//  FitMealAI
//
//  Settings root: account header, Plan row (highlighted Upgrade for Free),
//  Preferences (Workout / Meal -> sub-screens), Account, About, Sign Out.
//

import SwiftUI

struct SettingsView: View {
    @StateObject private var vm: SettingsViewModel

    var onOpenWorkoutSettings: (() -> Void)? = nil
    var onOpenMealSettings: (() -> Void)? = nil
    var onOpenPaywall: (() -> Void)? = nil
    var onSignOut: (() -> Void)? = nil

    init(
        viewModel: SettingsViewModel = SettingsViewModel(),
        onOpenWorkoutSettings: (() -> Void)? = nil,
        onOpenMealSettings: (() -> Void)? = nil,
        onOpenPaywall: (() -> Void)? = nil,
        onSignOut: (() -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onOpenWorkoutSettings = onOpenWorkoutSettings
        self.onOpenMealSettings = onOpenMealSettings
        self.onOpenPaywall = onOpenPaywall
        self.onSignOut = onSignOut
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "Settings", subtitle: "Personalize FitMeal AI") {
                Image(systemName: "gearshape.fill")
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            accountHeader
            planSection
            preferencesSection
            accountSection
            aboutSection
            signOutButton
            versionFooter
        }
    }

    // MARK: - Sections

    private var accountHeader: some View {
        GlassCard {
            HStack(spacing: AppTheme.Spacing.medium) {
                ZStack {
                    Circle()
                        .fill(AppTheme.Gradients.primaryButton)
                        .frame(width: 56, height: 56)
                    Text(initials(for: vm.user.name))
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(.white)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(vm.user.name)
                        .font(AppTheme.Typography.headline)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                    Text("Goal: \(vm.user.goal.rawValue)")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                Spacer()
            }
        }
    }

    private var planSection: some View {
        section(title: "Plan") {
            Button(action: { onOpenPaywall?() }) {
                row(
                    icon: "sparkles",
                    iconBg: AppTheme.Gradients.gold,
                    title: vm.planTitle,
                    detail: vm.planSubtitle,
                    trailing: vm.showsUpgradeHighlight ? .upgrade : .chevron
                )
            }
            .buttonStyle(PressableScaleStyle())
        }
    }

    private var preferencesSection: some View {
        section(title: "Preferences") {
            VStack(spacing: AppTheme.Spacing.xSmall) {
                Button(action: { onOpenWorkoutSettings?() }) {
                    row(
                        icon: "figure.strengthtraining.traditional",
                        iconBg: AnyShapeStyle(AppTheme.Colors.accentBlue),
                        title: "Workout",
                        detail: vm.workoutSummary,
                        trailing: .chevron
                    )
                }
                .buttonStyle(PressableScaleStyle())

                Button(action: { onOpenMealSettings?() }) {
                    row(
                        icon: "fork.knife",
                        iconBg: AnyShapeStyle(AppTheme.Colors.accentPurple),
                        title: "Meals",
                        detail: vm.mealSummary,
                        trailing: .chevron
                    )
                }
                .buttonStyle(PressableScaleStyle())
            }
        }
    }

    private var accountSection: some View {
        section(title: "Account") {
            VStack(spacing: AppTheme.Spacing.xSmall) {
                row(
                    icon: "envelope.fill",
                    iconBg: AnyShapeStyle(AppTheme.Colors.successGreen),
                    title: "Email",
                    detail: "alex@example.com",
                    trailing: .chevron
                )
                row(
                    icon: "bell.fill",
                    iconBg: AnyShapeStyle(AppTheme.Colors.accentPurple),
                    title: "Notifications",
                    detail: "Daily reminders on",
                    trailing: .chevron
                )
            }
        }
    }

    private var aboutSection: some View {
        section(title: "About") {
            VStack(spacing: AppTheme.Spacing.xSmall) {
                row(
                    icon: "questionmark.circle.fill",
                    iconBg: AnyShapeStyle(AppTheme.Colors.accentBlue),
                    title: "Help & Support",
                    detail: "FAQ, contact us",
                    trailing: .chevron
                )
                row(
                    icon: "doc.text.fill",
                    iconBg: AnyShapeStyle(AppTheme.Colors.textTertiary),
                    title: "Terms & Privacy",
                    detail: "Read the fine print",
                    trailing: .chevron
                )
            }
        }
    }

    private var signOutButton: some View {
        Button(action: { onSignOut?() }) {
            HStack {
                Spacer()
                HStack(spacing: 6) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .font(.system(size: 14, weight: .semibold))
                    Text("Sign Out")
                        .font(AppTheme.Typography.headline)
                }
                .foregroundStyle(AppTheme.Colors.errorRed)
                Spacer()
            }
            .frame(height: 52)
            .background(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .fill(.ultraThinMaterial)
            )
            .overlay(
                RoundedRectangle(cornerRadius: AppTheme.Radius.button, style: .continuous)
                    .stroke(AppTheme.Colors.errorRed.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(PressableScaleStyle())
    }

    private var versionFooter: some View {
        Text(vm.versionString)
            .font(AppTheme.Typography.caption)
            .foregroundStyle(AppTheme.Colors.textQuaternary)
            .multilineTextAlignment(.center)
            .frame(maxWidth: .infinity)
            .padding(.top, AppTheme.Spacing.small)
    }

    // MARK: - Helpers

    private enum TrailingStyle {
        case chevron
        case upgrade
    }

    @ViewBuilder
    private func section<Content: View>(title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Text(title.uppercased())
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textTertiary)
                .padding(.leading, AppTheme.Spacing.small)
            content()
        }
    }

    /// Variant taking a ShapeStyle (gradient OR color) for the icon background.
    @ViewBuilder
    private func row(
        icon: String,
        iconBg: AnyShapeStyle,
        title: String,
        detail: String,
        trailing: TrailingStyle
    ) -> some View {
        rowBody(icon: icon, iconBg: iconBg, title: title, detail: detail, trailing: trailing)
    }

    /// Convenience for rows whose icon background is a gradient.
    @ViewBuilder
    private func row(
        icon: String,
        iconBg: LinearGradient,
        title: String,
        detail: String,
        trailing: TrailingStyle
    ) -> some View {
        rowBody(icon: icon, iconBg: AnyShapeStyle(iconBg), title: title, detail: detail, trailing: trailing)
    }

    @ViewBuilder
    private func rowBody(
        icon: String,
        iconBg: AnyShapeStyle,
        title: String,
        detail: String,
        trailing: TrailingStyle
    ) -> some View {
        HStack(spacing: AppTheme.Spacing.medium) {
            Image(systemName: icon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Circle().fill(iconBg))

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(AppTheme.Typography.headline)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text(detail)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }

            Spacer()

            switch trailing {
            case .chevron:
                Image(systemName: "chevron.right")
                    .foregroundStyle(AppTheme.Colors.textTertiary)
            case .upgrade:
                Tag(title: "Upgrade", icon: "sparkles", variant: .gold, isActive: true)
            }
        }
        .padding(.horizontal, AppTheme.Spacing.medium)
        .padding(.vertical, AppTheme.Spacing.medium)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .fill(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                .stroke(Color.white.opacity(0.12), lineWidth: 1)
        )
    }

    private func initials(for name: String) -> String {
        let parts = name.split(separator: " ")
        let letters = parts.prefix(2).compactMap { $0.first }
        return String(letters).uppercased()
    }
}

#Preview("SettingsView - Free") {
    SettingsView(viewModel: SettingsViewModel(tier: .free))
        .preferredColorScheme(.dark)
}

#Preview("SettingsView - Gold") {
    SettingsView(viewModel: SettingsViewModel(tier: .gold))
        .preferredColorScheme(.dark)
}
