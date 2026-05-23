package com.fitmealai.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.fitmealai.domain.AppColorScheme

/**
 * Palette tokens. Colors that change between light/dark live in
 * [FitMealPalette]; truly invariant brand tones (gold, accent emerald,
 * status red) stay on the `FitMealColors` object so the rest of the
 * UI doesn't need to know whether dark/light is active.
 *
 * Mirrors the iOS `Core/Theme/AppTheme.swift` Phase-4e premium emerald
 * palette so the Android app and the iOS app feel like the same product.
 */
object FitMealColors {
    // Accent palette (emerald + jade) — invariant across schemes.
    val AccentPurple   = Color(0xFF38D399)   // primary CTA accent
    val AccentBlue     = Color(0xFF19B887)   // secondary accent
    val SuccessGreen   = Color(0xFF34D399)
    val WarningGold    = Color(0xFFF5A524)
    val ErrorRed       = Color(0xFFEF4444)

    // Tier gradient stops (matches iOS `goldStart`/`goldEnd`).
    val GoldStart      = Color(0xFFFFD666)
    val GoldEnd        = Color(0xFFF39E33)

    // Dark scheme tokens (the original premium gradient).
    object Dark {
        val GradientStart  = Color(0xFF040B08)
        val GradientMid    = Color(0xFF081611)
        val GradientEnd    = Color(0xFF0B3B2E)

        val TextPrimary    = Color.White
        val TextSecondary  = Color.White.copy(alpha = 0.70f)
        val TextTertiary   = Color.White.copy(alpha = 0.45f)
        val TextQuaternary = Color.White.copy(alpha = 0.30f)

        val GlassFill      = Color.White.copy(alpha = 0.08f)
        val GlassStroke    = Color.White.copy(alpha = 0.20f)
        val GlassFillSoft  = Color.White.copy(alpha = 0.04f)
        val GlassStrokeSoft = Color.White.copy(alpha = 0.10f)
    }

    // Light scheme tokens. Soft mint-on-white that keeps the same
    // emerald accent so brand identity stays consistent. We don't
    // try to invert every color: glass treatments switch to dark
    // strokes on light fills.
    object Light {
        val GradientStart  = Color(0xFFF1FBF6)
        val GradientMid    = Color(0xFFE1F5EA)
        val GradientEnd    = Color(0xFFC9EAD7)

        val TextPrimary    = Color(0xFF0B1F17)
        val TextSecondary  = Color(0xFF0B1F17).copy(alpha = 0.70f)
        val TextTertiary   = Color(0xFF0B1F17).copy(alpha = 0.45f)
        val TextQuaternary = Color(0xFF0B1F17).copy(alpha = 0.30f)

        val GlassFill      = Color.White.copy(alpha = 0.55f)
        val GlassStroke    = Color(0xFF0B1F17).copy(alpha = 0.10f)
        val GlassFillSoft  = Color.White.copy(alpha = 0.30f)
        val GlassStrokeSoft = Color(0xFF0B1F17).copy(alpha = 0.06f)
    }

    // -------------------------------------------------------------------
    // Active-scheme aliases. Composables read these directly. They are
    // populated by [FitMealTheme] for the current scheme. We default to
    // dark so previews / non-themed call sites still render correctly.
    // -------------------------------------------------------------------
    var GradientStart: Color = Dark.GradientStart;   internal set
    var GradientMid: Color   = Dark.GradientMid;     internal set
    var GradientEnd: Color   = Dark.GradientEnd;     internal set

    var TextPrimary: Color    = Dark.TextPrimary;    internal set
    var TextSecondary: Color  = Dark.TextSecondary;  internal set
    var TextTertiary: Color   = Dark.TextTertiary;   internal set
    var TextQuaternary: Color = Dark.TextQuaternary; internal set

    var GlassFill: Color       = Dark.GlassFill;       internal set
    var GlassStroke: Color     = Dark.GlassStroke;     internal set
    var GlassFillSoft: Color   = Dark.GlassFillSoft;   internal set
    var GlassStrokeSoft: Color = Dark.GlassStrokeSoft; internal set
}

/**
 * Brushes are recomputed with the active palette every time the theme
 * recomposes (see [FitMealTheme]).
 */
object FitMealBrushes {
    var Background: Brush = brandGradient(
        FitMealColors.Dark.GradientStart,
        FitMealColors.Dark.GradientMid,
        FitMealColors.Dark.GradientEnd,
    )
        internal set
    val PrimaryButton: Brush = Brush.horizontalGradient(
        colors = listOf(FitMealColors.AccentBlue, FitMealColors.AccentPurple),
    )
    val Gold: Brush = Brush.horizontalGradient(
        colors = listOf(FitMealColors.GoldStart, FitMealColors.GoldEnd),
    )
}

private fun brandGradient(start: Color, mid: Color, end: Color): Brush =
    Brush.linearGradient(colors = listOf(start, mid, end))

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

private val DarkColorScheme: ColorScheme = darkColorScheme(
    primary       = FitMealColors.AccentPurple,
    secondary     = FitMealColors.AccentBlue,
    tertiary      = FitMealColors.SuccessGreen,
    background    = FitMealColors.Dark.GradientStart,
    surface       = FitMealColors.Dark.GlassFill,
    error         = FitMealColors.ErrorRed,
    onPrimary     = Color.White,
    onSecondary   = Color.White,
    onBackground  = Color.White,
    onSurface     = Color.White,
)

private val LightColorScheme: ColorScheme = lightColorScheme(
    primary       = FitMealColors.AccentPurple,
    secondary     = FitMealColors.AccentBlue,
    tertiary      = FitMealColors.SuccessGreen,
    background    = FitMealColors.Light.GradientStart,
    surface       = FitMealColors.Light.GlassFill,
    error         = FitMealColors.ErrorRed,
    onPrimary     = Color.White,
    onSecondary   = Color.White,
    onBackground  = FitMealColors.Light.TextPrimary,
    onSurface     = FitMealColors.Light.TextPrimary,
)

/**
 * Resolves an [AppColorScheme] picker value into an effective dark/light
 * boolean for a given system setting. Useful for unit tests.
 */
fun AppColorScheme.resolveDark(systemDark: Boolean): Boolean = when (this) {
    AppColorScheme.System -> systemDark
    AppColorScheme.Dark   -> true
    AppColorScheme.Light  -> false
}

/**
 * Provides the active [AppColorScheme] selection down the tree so deep
 * composables (e.g. settings picker) can read the current value without
 * threading it through every parameter.
 */
val LocalAppColorScheme = compositionLocalOf { AppColorScheme.System }

@Composable
fun FitMealTheme(
    appColorScheme: AppColorScheme = AppColorScheme.System,
    content: @Composable () -> Unit,
) {
    val systemDark = isSystemInDarkTheme()
    val isDark = appColorScheme.resolveDark(systemDark)

    // Mutate the active-scheme aliases. Compose recomposes on State change,
    // not on plain `var` writes, but [FitMealTheme] is the only writer and
    // it always re-runs together with the rest of the tree on scheme change
    // because it's the root of the call graph.
    if (isDark) {
        FitMealColors.GradientStart   = FitMealColors.Dark.GradientStart
        FitMealColors.GradientMid     = FitMealColors.Dark.GradientMid
        FitMealColors.GradientEnd     = FitMealColors.Dark.GradientEnd
        FitMealColors.TextPrimary     = FitMealColors.Dark.TextPrimary
        FitMealColors.TextSecondary   = FitMealColors.Dark.TextSecondary
        FitMealColors.TextTertiary    = FitMealColors.Dark.TextTertiary
        FitMealColors.TextQuaternary  = FitMealColors.Dark.TextQuaternary
        FitMealColors.GlassFill       = FitMealColors.Dark.GlassFill
        FitMealColors.GlassStroke     = FitMealColors.Dark.GlassStroke
        FitMealColors.GlassFillSoft   = FitMealColors.Dark.GlassFillSoft
        FitMealColors.GlassStrokeSoft = FitMealColors.Dark.GlassStrokeSoft
    } else {
        FitMealColors.GradientStart   = FitMealColors.Light.GradientStart
        FitMealColors.GradientMid     = FitMealColors.Light.GradientMid
        FitMealColors.GradientEnd     = FitMealColors.Light.GradientEnd
        FitMealColors.TextPrimary     = FitMealColors.Light.TextPrimary
        FitMealColors.TextSecondary   = FitMealColors.Light.TextSecondary
        FitMealColors.TextTertiary    = FitMealColors.Light.TextTertiary
        FitMealColors.TextQuaternary  = FitMealColors.Light.TextQuaternary
        FitMealColors.GlassFill       = FitMealColors.Light.GlassFill
        FitMealColors.GlassStroke     = FitMealColors.Light.GlassStroke
        FitMealColors.GlassFillSoft   = FitMealColors.Light.GlassFillSoft
        FitMealColors.GlassStrokeSoft = FitMealColors.Light.GlassStrokeSoft
    }
    FitMealBrushes.Background = brandGradient(
        FitMealColors.GradientStart,
        FitMealColors.GradientMid,
        FitMealColors.GradientEnd,
    )

    val materialScheme = remember(isDark) { if (isDark) DarkColorScheme else LightColorScheme }

    androidx.compose.runtime.CompositionLocalProvider(LocalAppColorScheme provides appColorScheme) {
        MaterialTheme(
            colorScheme = materialScheme,
            typography  = MaterialTheme.typography,
            content     = content,
        )
    }
}
