//
//  LoginView.swift
//  FitMealAI
//
//  Email/Phone login + Google + Apple. Matches the React Login.tsx
//  layout: hero glow background, glass form card, "or continue with"
//  divider, and a "Get started free" footer link to Onboarding.
//

import SwiftUI

struct LoginView: View {
    @StateObject private var vm = LoginViewModel()

    var onAuthenticated: (() -> Void)? = nil
    var onSignUpTapped: (() -> Void)? = nil
    var onForgotPasswordTapped: (() -> Void)? = nil

    var body: some View {
        ScreenContainer(showGlows: true, topPadding: AppTheme.Spacing.xxLarge) {
            header
            modeToggle
            formCard
            socialDivider
            socialButtons
            footer
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            ZStack {
                Circle()
                    .fill(AppTheme.Gradients.primaryButton)
                    .frame(width: 56, height: 56)
                    .shadow(color: AppTheme.Colors.accentPurple.opacity(0.6), radius: 16)
                Image(systemName: "leaf.fill")
                    .font(.system(size: 24, weight: .semibold))
                    .foregroundStyle(.white)
            }
            Text("Welcome back")
                .font(AppTheme.Typography.largeTitle)
                .foregroundStyle(AppTheme.Colors.textPrimary)
            Text("Sign in to keep your plan moving forward.")
                .font(AppTheme.Typography.body)
                .foregroundStyle(AppTheme.Colors.textSecondary)
        }
    }

    private var modeToggle: some View {
        SegmentedPicker(
            options: AuthMode.allCases.map { $0.label },
            selection: Binding(
                get: { vm.credentials.mode.label },
                set: { newLabel in
                    if let mode = AuthMode.allCases.first(where: { $0.label == newLabel }) {
                        vm.setMode(mode)
                    }
                }
            )
        )
    }

    private var formCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.medium) {
                Text(vm.credentials.mode == .email ? "Email" : "Phone number")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(AppTheme.Colors.textSecondary)

                TextField(
                    vm.primaryFieldPlaceholder,
                    text: $vm.credentials.emailOrPhone
                )
                .textFieldStyle(.plain)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(vm.credentials.mode == .email ? .emailAddress : .phonePad)
                .padding(.horizontal, AppTheme.Spacing.medium)
                .frame(height: 44)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
                .foregroundStyle(AppTheme.Colors.textPrimary)

                if vm.credentials.mode == .email {
                    HStack {
                        Text("Password")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                        Spacer()
                        Button("Forgot?") { onForgotPasswordTapped?() }
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(AppTheme.Colors.accentBlue)
                    }

                    HStack(spacing: AppTheme.Spacing.small) {
                        Group {
                            if vm.isPasswordVisible {
                                TextField("••••••••", text: $vm.credentials.password)
                            } else {
                                SecureField("••••••••", text: $vm.credentials.password)
                            }
                        }
                        .textFieldStyle(.plain)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .foregroundStyle(AppTheme.Colors.textPrimary)

                        Button(action: vm.togglePasswordVisibility) {
                            Image(systemName: vm.isPasswordVisible ? "eye.slash.fill" : "eye.fill")
                                .foregroundStyle(AppTheme.Colors.textTertiary)
                        }
                    }
                    .padding(.horizontal, AppTheme.Spacing.medium)
                    .frame(height: 44)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                            .fill(Color.white.opacity(0.06))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 1)
                    )
                }

                if let error = vm.errorMessage {
                    Text(error)
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.errorRed)
                }

                PrimaryButton(
                    title: vm.primaryButtonTitle,
                    icon: vm.credentials.mode == .phone ? "paperplane.fill" : nil,
                    isLoading: vm.isSubmitting,
                    isDisabled: !vm.canSubmit
                ) {
                    Task {
                        if await vm.submit() { onAuthenticated?() }
                    }
                }
                .padding(.top, AppTheme.Spacing.xSmall)
            }
        }
    }

    private var socialDivider: some View {
        HStack(spacing: AppTheme.Spacing.small) {
            Rectangle().fill(Color.white.opacity(0.12)).frame(height: 1)
            Text("OR CONTINUE WITH")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(AppTheme.Colors.textTertiary)
            Rectangle().fill(Color.white.opacity(0.12)).frame(height: 1)
        }
    }

    private var socialButtons: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            SecondaryGlassButton(title: "Continue with Google", icon: "g.circle.fill") {
                Task {
                    if await vm.socialSignIn(.google) { onAuthenticated?() }
                }
            }
            SecondaryGlassButton(title: "Continue with Apple", icon: "apple.logo") {
                Task {
                    if await vm.socialSignIn(.apple) { onAuthenticated?() }
                }
            }
        }
    }

    private var footer: some View {
        VStack(spacing: AppTheme.Spacing.small) {
            HStack(spacing: 4) {
                Text("New to FitMeal?")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                Button("Get started free") { onSignUpTapped?() }
                    .font(AppTheme.Typography.body.weight(.semibold))
                    .foregroundStyle(AppTheme.Colors.accentBlue)
            }
            Text("By continuing you agree to our Terms and Privacy Policy.")
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textQuaternary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, alignment: .center)
        .padding(.top, AppTheme.Spacing.small)
    }
}

#Preview("LoginView") {
    LoginView()
        .preferredColorScheme(.dark)
}
