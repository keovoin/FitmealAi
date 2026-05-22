package com.fitmealai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Mirrors the iOS `Core/Theme/AppTheme.swift` Phase-4e premium emerald
 * palette so the Android app and the iOS app feel like the same product.
 */
object FitMealColors {
    // Background gradient (deep blacks that lift toward emerald at the bottom).
    val GradientStart  = Color(0xFF040B08)
    val GradientMid    = Color(0xFF081611)
    val GradientEnd    = Color(0xFF0B3B2E)

    // Accent palette (emerald + jade).
    val AccentPurple   = Color(0xFF38D399)   // primary CTA accent
    val AccentBlue     = Color(0xFF19B887)   // secondary accent
    val SuccessGreen   = Color(0xFF34D399)
    val WarningGold    = Color(0xFFF5A524)
    val ErrorRed       = Color(0xFFEF4444)

    // Tier gradient stops (matches iOS `goldStart`/`goldEnd`).
    val GoldStart      = Color(0xFFFFD666)
    val GoldEnd        = Color(0xFFF39E33)

    // Text tokens.
    val TextPrimary    = Color.White
    val TextSecondary  = Color.White.copy(alpha = 0.70f)
    val TextTertiary   = Color.White.copy(alpha = 0.45f)
    val TextQuaternary = Color.White.copy(alpha = 0.30f)

    // Glass treatment.
    val GlassFill      = Color.White.copy(alpha = 0.08f)
    val GlassStroke    = Color.White.copy(alpha = 0.20f)
    val GlassFillSoft  = Color.White.copy(alpha = 0.04f)
    val GlassStrokeSoft = Color.White.copy(alpha = 0.10f)
}

object FitMealBrushes {
    val Background       = Brush.linearGradient(
        colors = listOf(FitMealColors.GradientStart, FitMealColors.GradientMid, FitMealColors.GradientEnd),
    )
    val PrimaryButton    = Brush.horizontalGradient(
        colors = listOf(FitMealColors.AccentBlue, FitMealColors.AccentPurple),
    )
    val Gold             = Brush.horizontalGradient(
        colors = listOf(FitMealColors.GoldStart, FitMealColors.GoldEnd),
    )
}

object FitMealSpacing {
    val xSmall  = 4.dp
    val small   = 8.dp
    val medium  = 16.dp
    val large   = 24.dp
    val xLarge  = 32.dp
    val xxLarge = 48.dp
}

object FitMealRadius {
    val small  = 12.dp
    val medium = 18.dp
    val card   = 24.dp
    val pill   = 999.dp
}

private val FitMealColorScheme: ColorScheme = darkColorScheme(
    primary       = FitMealColors.AccentPurple,
    secondary     = FitMealColors.AccentBlue,
    tertiary      = FitMealColors.SuccessGreen,
    background    = FitMealColors.GradientStart,
    surface       = FitMealColors.GlassFill,
    error         = FitMealColors.ErrorRed,
    onPrimary     = Color.White,
    onSecondary   = Color.White,
    onBackground  = Color.White,
    onSurface     = Color.White,
)

@Composable
fun FitMealTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = FitMealColorScheme,
        typography  = MaterialTheme.typography,
        content     = content,
    )
}
