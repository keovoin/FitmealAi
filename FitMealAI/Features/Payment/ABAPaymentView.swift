//
//  ABAPaymentView.swift
//  FitMealAI
//
//  Manual ABA bank transfer flow. Shows a QR placeholder, merchant
//  details, transaction ID input, screenshot upload placeholder, and
//  a submit button. On submit the request flips to .pending and we
//  hand off to PaymentPendingView via onSubmitted.
//

import SwiftUI
import PhotosUI

struct ABAPaymentView: View {
    @StateObject private var vm: ABAPaymentViewModel
    @State private var pickerItem: PhotosPickerItem? = nil

    var onBack: (() -> Void)? = nil
    var onSubmitted: ((PaymentRequest) -> Void)? = nil

    init(
        viewModel: ABAPaymentViewModel = ABAPaymentViewModel(),
        onBack: (() -> Void)? = nil,
        onSubmitted: ((PaymentRequest) -> Void)? = nil
    ) {
        _vm = StateObject(wrappedValue: viewModel)
        self.onBack = onBack
        self.onSubmitted = onSubmitted
    }

    var body: some View {
        ScreenContainer {
            TopBar(title: "ABA Payment", subtitle: "Manual transfer", showBack: true, onBack: { onBack?() }) {
                Image(systemName: "qrcode")
                    .foregroundStyle(AppTheme.Colors.accentBlue)
            }

            qrCard
            merchantCard
            instructionsCard
            transactionField
            screenshotPicker

            if let error = vm.errorMessage {
                Text(error)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.errorRed)
            }

            PrimaryButton(
                title: vm.request.status == .pending ? "Already submitted" : "Submit for review",
                icon: "paperplane.fill",
                isLoading: vm.isSubmitting,
                isDisabled: !vm.canSubmit
            ) {
                Task {
                    if await vm.submit() { onSubmitted?(vm.request) }
                }
            }

            footerNote
        }
    }

    // MARK: - Sections

    private var qrCard: some View {
        GlassCard {
            VStack(spacing: AppTheme.Spacing.small) {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                        .fill(.white)
                        .frame(width: 180, height: 180)
                    Image(systemName: "qrcode")
                        .font(.system(size: 140, weight: .regular))
                        .foregroundStyle(.black)
                    // Center logo overlay - mimics ABA's branded QR.
                    Circle()
                        .fill(AppTheme.Gradients.primaryButton)
                        .frame(width: 36, height: 36)
                        .overlay(
                            Image(systemName: "leaf.fill")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.white)
                        )
                }
                .frame(maxWidth: .infinity)
                Text("Scan with the ABA app to transfer")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
        }
    }

    private var merchantCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                Text(vm.planLine)
                    .font(AppTheme.Typography.headline)
                    .foregroundStyle(AppTheme.Colors.textPrimary)

                detailRow(label: "Merchant", value: vm.merchantName)
                detailRow(label: "Merchant ID", value: vm.merchantId)
                detailRow(label: "Account", value: vm.merchantAccount)
                detailRow(label: "Amount", value: vm.request.amount)
            }
        }
    }

    private var instructionsCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
                Text("How it works")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                instructionRow(number: "1", text: "Scan the QR or send to the merchant ID above.")
                instructionRow(number: "2", text: "Save the ABA receipt screenshot.")
                instructionRow(number: "3", text: "Paste the transaction ID and attach the screenshot below.")
                instructionRow(number: "4", text: "We'll review and unlock your plan, usually within 24h.")
            }
        }
    }

    private var transactionField: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Text("Transaction ID")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(AppTheme.Colors.textSecondary)

            TextField("e.g. ABA-TX-00042", text: $vm.request.transactionId)
                .textFieldStyle(.plain)
                .textInputAutocapitalization(.characters)
                .autocorrectionDisabled()
                .padding(.horizontal, AppTheme.Spacing.medium)
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .stroke(Color.white.opacity(0.12), lineWidth: 1)
                )
                .foregroundStyle(AppTheme.Colors.textPrimary)
        }
    }

    private var screenshotPicker: some View {
        VStack(alignment: .leading, spacing: AppTheme.Spacing.small) {
            Text("Receipt screenshot")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(AppTheme.Colors.textSecondary)

            if let name = vm.request.screenshotFileName {
                HStack(spacing: AppTheme.Spacing.small) {
                    Image(systemName: "photo.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.white)
                        .frame(width: 28, height: 28)
                        .background(Circle().fill(AppTheme.Colors.successGreen))
                    Text(name)
                        .font(AppTheme.Typography.body)
                        .foregroundStyle(AppTheme.Colors.textPrimary)
                        .lineLimit(1)
                    Spacer()
                    Button(action: vm.clearScreenshot) {
                        Image(systemName: "xmark")
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(AppTheme.Colors.textSecondary)
                            .frame(width: 24, height: 24)
                            .background(Circle().fill(Color.white.opacity(0.10)))
                    }
                }
                .padding(AppTheme.Spacing.medium)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .fill(Color.white.opacity(0.06))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .stroke(AppTheme.Colors.successGreen.opacity(0.4), lineWidth: 1)
                )
            } else {
                PhotosPicker(
                    selection: $pickerItem,
                    matching: .images,
                    photoLibrary: .shared(),
                ) {
                    VStack(spacing: AppTheme.Spacing.xSmall) {
                        Image(systemName: vm.isUploadingScreenshot
                              ? "arrow.up.circle"
                              : "square.and.arrow.up")
                            .font(.system(size: 22, weight: .semibold))
                            .foregroundStyle(AppTheme.Colors.accentPurple)
                        Text(vm.isUploadingScreenshot
                             ? "Loading…"
                             : "Tap to attach receipt")
                            .font(AppTheme.Typography.body)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text("PNG / JPG up to 5 MB")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textTertiary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, AppTheme.Spacing.large)
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                            .strokeBorder(
                                AppTheme.Colors.accentPurple.opacity(0.40),
                                style: StrokeStyle(lineWidth: 1, dash: [6, 4])
                            )
                    )
                    .background(
                        RoundedRectangle(cornerRadius: AppTheme.Radius.chip, style: .continuous)
                            .fill(Color.white.opacity(0.04))
                    )
                }
                .buttonStyle(PressableScaleStyle())
                .onChange(of: pickerItem) { _, newItem in
                    guard let newItem else { return }
                    Task {
                        vm.isUploadingScreenshot = true
                        defer { vm.isUploadingScreenshot = false }
                        if let data = try? await newItem.loadTransferable(type: Data.self) {
                            // PhotosPicker can return HEIC; stamp a sane MIME.
                            let mime = (newItem.supportedContentTypes.first?.preferredMIMEType
                                        ?? "image/jpeg")
                            await MainActor.run {
                                vm.setScreenshot(data: data, mimeType: mime)
                            }
                        }
                    }
                }
            }
        }
    }

    private var footerNote: some View {
        Text("Your access is unlocked once we verify the receipt.")
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
        }
    }

    @ViewBuilder
    private func instructionRow(number: String, text: String) -> some View {
        HStack(alignment: .top, spacing: AppTheme.Spacing.small) {
            Text(number)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 20, height: 20)
                .background(Circle().fill(AppTheme.Colors.accentPurple))
            Text(text)
                .font(AppTheme.Typography.body)
                .foregroundStyle(AppTheme.Colors.textPrimary)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 0)
        }
    }
}

#Preview("ABAPaymentView - empty") {
    ABAPaymentView()
        .preferredColorScheme(.dark)
}

#Preview("ABAPaymentView - filled") {
    let vm = ABAPaymentViewModel()
    vm.request.transactionId = "ABA-TX-00042"
    vm.request.screenshotFileName = "receipt.png"
    return ABAPaymentView(viewModel: vm)
        .preferredColorScheme(.dark)
}
