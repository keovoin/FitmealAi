//
//  IngredientModal.swift
//  FitMealAI
//
//  Bottom-sheet detail for a single meal. Shows ingredient list with
//  per-item kcal, three macro bars (P / C / F), and a rainbow
//  calorie-breakdown bar where each ingredient occupies width
//  proportional to its share of the meal's total kcal.
//
//  Divide-by-zero safe: if a meal has no ingredients/zero kcal, the
//  rainbow bar collapses gracefully and macro bars fall back to 0.
//

import SwiftUI

struct IngredientModal: View {
    let meal: Meal
    let onDismiss: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            handle
                .padding(.top, AppTheme.Spacing.small)

            ScrollView {
                VStack(alignment: .leading, spacing: AppTheme.Spacing.large) {
                    header
                    macrosSection
                    rainbowBarSection
                    ingredientList
                }
                .padding(AppTheme.Spacing.large)
                .padding(.bottom, AppTheme.Spacing.xLarge)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 32, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 32, style: .continuous)
                .stroke(AppTheme.Colors.glassStroke, lineWidth: 1)
        )
        .shadow(color: AppTheme.Colors.glassShadow, radius: 28, y: 12)
    }

    // MARK: - Sections

    private var handle: some View {
        Capsule()
            .fill(Color.white.opacity(0.30))
            .frame(width: 44, height: 4)
    }

    private var header: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(meal.type.rawValue.uppercased())
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(AppTheme.Colors.accentPurple)
                Text(meal.title)
                    .font(AppTheme.Typography.title)
                    .foregroundStyle(AppTheme.Colors.textPrimary)
                Text("\(meal.calories) kcal")
                    .font(AppTheme.Typography.body)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            Spacer()
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                    .frame(width: 32, height: 32)
                    .background(Circle().fill(Color.white.opacity(0.10)))
            }
            .buttonStyle(PressableScaleStyle())
        }
    }

    private var macrosSection: some View {
        let totalKcal = max(meal.calories, 1) // divide-by-zero guard
        // Protein/carbs are 4 kcal/g, fat is 9 kcal/g.
        let proteinPct = Double(meal.proteinGrams * 4) / Double(totalKcal)
        let carbsPct   = Double(meal.carbsGrams * 4)   / Double(totalKcal)
        let fatPct     = Double(meal.fatGrams * 9)     / Double(totalKcal)

        return VStack(spacing: AppTheme.Spacing.small) {
            MacroBar(label: "Protein", grams: meal.proteinGrams, percent: proteinPct, color: AppTheme.Colors.accentBlue)
            MacroBar(label: "Carbs",   grams: meal.carbsGrams,   percent: carbsPct,   color: AppTheme.Colors.successGreen)
            MacroBar(label: "Fat",     grams: meal.fatGrams,     percent: fatPct,     color: AppTheme.Colors.goldStart)
        }
    }

    private var rainbowBarSection: some View {
        let total = meal.totalIngredientCalories
        let safeTotal = max(total, 1)

        return VStack(alignment: .leading, spacing: AppTheme.Spacing.xSmall) {
            Text("Calories by ingredient")
                .font(AppTheme.Typography.caption)
                .foregroundStyle(AppTheme.Colors.textSecondary)

            GeometryReader { proxy in
                HStack(spacing: 2) {
                    ForEach(Array(meal.ingredients.enumerated()), id: \.element.id) { idx, ingredient in
                        let pct = Double(ingredient.calories) / Double(safeTotal)
                        Rectangle()
                            .fill(rainbowColor(for: idx))
                            .frame(width: max(proxy.size.width * pct - 2, 2))
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
            }
            .frame(height: 14)

            HStack {
                Text("\(total) kcal total")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textTertiary)
                Spacer()
                if meal.ingredients.isEmpty {
                    Text("No ingredients yet")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textTertiary)
                }
            }
        }
    }

    private var ingredientList: some View {
        VStack(spacing: AppTheme.Spacing.xSmall) {
            ForEach(Array(meal.ingredients.enumerated()), id: \.element.id) { idx, ingredient in
                HStack(spacing: AppTheme.Spacing.small) {
                    Circle()
                        .fill(rainbowColor(for: idx))
                        .frame(width: 10, height: 10)
                    VStack(alignment: .leading, spacing: 1) {
                        Text(ingredient.name)
                            .font(AppTheme.Typography.body)
                            .foregroundStyle(AppTheme.Colors.textPrimary)
                        Text("\(ingredient.grams)g")
                            .font(AppTheme.Typography.caption)
                            .foregroundStyle(AppTheme.Colors.textTertiary)
                    }
                    Spacer()
                    Text("\(ingredient.calories) kcal")
                        .font(AppTheme.Typography.caption)
                        .foregroundStyle(AppTheme.Colors.textSecondary)
                }
                .padding(.horizontal, AppTheme.Spacing.medium)
                .padding(.vertical, AppTheme.Spacing.small)
                .background(
                    RoundedRectangle(cornerRadius: AppTheme.Radius.small, style: .continuous)
                        .fill(Color.white.opacity(0.05))
                )
            }
        }
    }

    // Slight hue shift so adjacent ingredients are visually distinct.
    private func rainbowColor(for index: Int) -> Color {
        let hue = Double((index * 47) % 360) / 360.0
        return Color(hue: hue, saturation: 0.65, brightness: 0.95)
    }
}

// MARK: - Macro bar

private struct MacroBar: View {
    let label: String
    let grams: Int
    let percent: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(label)
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
                Spacer()
                Text("\(grams)g . \(Int(percent * 100))%")
                    .font(AppTheme.Typography.caption)
                    .foregroundStyle(AppTheme.Colors.textSecondary)
            }
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.white.opacity(0.10))
                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: proxy.size.width * min(max(percent, 0), 1))
                }
            }
            .frame(height: 8)
        }
    }
}

#Preview("IngredientModal") {
    ZStack {
        GlassBackground()
        IngredientModal(meal: MockData.todayMealPlan.meals[0]) {}
            .padding(.horizontal, AppTheme.Spacing.small)
            .padding(.top, AppTheme.Spacing.xxLarge)
    }
    .preferredColorScheme(.dark)
}
