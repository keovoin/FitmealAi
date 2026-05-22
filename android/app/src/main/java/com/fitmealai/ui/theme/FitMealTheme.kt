package com.fitmealai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

object FitMealColors {
    val GradientStart = Color(0xFF0F172A)
    val GradientMid = Color(0xFF1E3A8A)
    val GradientEnd = Color(0xFF7C3AED)
    val AccentBlue = Color(0xFF4F8CFF)
    val AccentPurple = Color(0xFF8F5CFF)
    val SuccessGreen = Color(0xFF34D399)
    val ErrorRed = Color(0xFFEF4444)
    val TextPrimary = Color.White
    val TextSecondary = Color.White.copy(alpha = 0.70f)
    val GlassFill = Color.White.copy(alpha = 0.08f)
    val GlassStroke = Color.White.copy(alpha = 0.20f)
}

object FitMealBrushes {
    val Background = Brush.linearGradient(
        listOf(FitMealColors.GradientStart, FitMealColors.GradientMid, FitMealColors.GradientEnd)
    )
    val PrimaryButton = Brush.horizontalGradient(
        listOf(FitMealColors.AccentBlue, FitMealColors.AccentPurple)
    )
}

private val FitMealColorScheme: ColorScheme = darkColorScheme(
    primary = FitMealColors.AccentBlue,
    secondary = FitMealColors.AccentPurple,
    tertiary = FitMealColors.SuccessGreen,
    background = FitMealColors.GradientStart,
    surface = FitMealColors.GlassFill,
    error = FitMealColors.ErrorRed,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = Color.White,
    onSurface = Color.White,
)

@Composable
fun FitMealTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = FitMealColorScheme,
        typography = MaterialTheme.typography,
        content = content,
    )
}