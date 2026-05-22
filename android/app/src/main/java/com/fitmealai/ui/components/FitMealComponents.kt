package com.fitmealai.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.ui.theme.FitMealBrushes
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing

// ---------------------------------------------------------------------------
// Screen container — every screen wraps its content in this so the dark
// emerald background gradient is always present.
// ---------------------------------------------------------------------------

@Composable
fun ScreenContainer(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(
        horizontal = FitMealSpacing.large,
        vertical = FitMealSpacing.medium,
    ),
    scrollable: Boolean = true,
    content: @Composable () -> Unit,
) {
    val scroll = rememberScrollState()
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(FitMealBrushes.Background)
    ) {
        val columnModifier = Modifier
            .fillMaxSize()
            .padding(contentPadding)
            .let { if (scrollable) it.verticalScroll(scroll) else it }
        Column(
            modifier = columnModifier,
            verticalArrangement = Arrangement.spacedBy(FitMealSpacing.medium),
        ) {
            content()
        }
    }
}

// ---------------------------------------------------------------------------
// Glass card (mirrors iOS GlassCard)
// ---------------------------------------------------------------------------

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(FitMealSpacing.medium),
    onClick: (() -> Unit)? = null,
    content: @Composable BoxScope.() -> Unit,
) {
    val shape = RoundedCornerShape(FitMealRadius.card)
    Box(
        modifier = modifier
            .clip(shape)
            .background(FitMealColors.GlassFill)
            .border(BorderStroke(1.dp, FitMealColors.GlassStroke), shape)
            .let { if (onClick != null) it.clickable(onClick = onClick) else it }
            .padding(contentPadding),
        content = content,
    )
}

// ---------------------------------------------------------------------------
// Top bar with optional back button + actions
// ---------------------------------------------------------------------------

@Composable
fun TopBar(
    title: String,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    actions: @Composable () -> Unit = {},
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        if (onBack != null) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(FitMealColors.GlassFill)
                    .border(BorderStroke(1.dp, FitMealColors.GlassStroke), CircleShape)
                    .clickable(onClick = onBack),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = FitMealColors.TextPrimary,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(
                title,
                color = FitMealColors.TextPrimary,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
            )
            if (!subtitle.isNullOrBlank()) {
                Text(subtitle, color = FitMealColors.TextSecondary, fontSize = 13.sp)
            }
        }
        actions()
    }
}

// ---------------------------------------------------------------------------
// Primary gradient button (mirrors iOS PrimaryButton)
// ---------------------------------------------------------------------------

@Composable
fun PrimaryGradientButton(
    title: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isLoading: Boolean = false,
    tag: String = "primary-gradient-button",
    onClick: () -> Unit,
) {
    val isInteractive = enabled && !isLoading
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(FitMealRadius.medium))
            .background(
                if (isInteractive) FitMealBrushes.PrimaryButton
                else Brush.horizontalGradient(listOf(Color.Gray, Color.DarkGray))
            )
            .clickable(enabled = isInteractive, onClick = onClick)
            .testTag(tag),
        contentAlignment = Alignment.Center,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                color = Color.White,
                strokeWidth = 2.dp,
                modifier = Modifier.size(22.dp),
            )
        } else {
            Text(title, color = Color.White, fontWeight = FontWeight.SemiBold)
        }
    }
}

// ---------------------------------------------------------------------------
// Secondary glass button (used for Apple/Google sign-in style rows)
// ---------------------------------------------------------------------------

@Composable
fun SecondaryGlassButton(
    title: String,
    modifier: Modifier = Modifier,
    leadingEmoji: String? = null,
    enabled: Boolean = true,
    tag: String = "secondary-glass-button",
    onClick: () -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp)
            .clip(RoundedCornerShape(FitMealRadius.medium))
            .background(FitMealColors.GlassFill)
            .border(BorderStroke(1.dp, FitMealColors.GlassStroke), RoundedCornerShape(FitMealRadius.medium))
            .clickable(enabled = enabled, onClick = onClick)
            .testTag(tag),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        if (leadingEmoji != null) {
            Text(leadingEmoji, fontSize = 18.sp)
            Spacer(Modifier.width(FitMealSpacing.small))
        }
        Text(title, color = FitMealColors.TextPrimary, fontWeight = FontWeight.Medium)
    }
}

// ---------------------------------------------------------------------------
// Segmented picker (mirrors iOS SegmentedPicker)
// ---------------------------------------------------------------------------

@Composable
fun SegmentedPicker(
    options: List<String>,
    selected: String,
    modifier: Modifier = Modifier,
    onSelect: (String) -> Unit,
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .height(40.dp)
            .clip(RoundedCornerShape(FitMealRadius.pill))
            .background(FitMealColors.GlassFill)
            .border(BorderStroke(1.dp, FitMealColors.GlassStrokeSoft), RoundedCornerShape(FitMealRadius.pill))
            .padding(4.dp),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        options.forEach { option ->
            val isSelected = option == selected
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxSize()
                    .clip(RoundedCornerShape(FitMealRadius.pill))
                    .background(if (isSelected) FitMealColors.AccentPurple.copy(alpha = 0.85f) else Color.Transparent)
                    .clickable { onSelect(option) },
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    option,
                    color = if (isSelected) Color.White else FitMealColors.TextSecondary,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Medium,
                    fontSize = 13.sp,
                )
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Multi-select grid (mirrors iOS MultiSelectGrid)
// ---------------------------------------------------------------------------

data class GridChoice(
    val id: String,
    val label: String,
    val emoji: String,
    val subtitle: String? = null,
)

@Composable
fun MultiSelectGrid(
    items: List<GridChoice>,
    selected: Set<String>,
    modifier: Modifier = Modifier,
    columns: Int = 2,
    onToggle: (String) -> Unit,
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(columns),
        modifier = modifier.fillMaxWidth().height((((items.size + columns - 1) / columns) * 92).dp),
        verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
        horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.small),
    ) {
        items(items, key = { it.id }) { item ->
            val isSelected = item.id in selected
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(84.dp)
                    .clip(RoundedCornerShape(FitMealRadius.medium))
                    .background(if (isSelected) FitMealColors.AccentPurple.copy(alpha = 0.18f) else FitMealColors.GlassFill)
                    .border(
                        BorderStroke(
                            1.dp,
                            if (isSelected) FitMealColors.AccentPurple else FitMealColors.GlassStroke,
                        ),
                        RoundedCornerShape(FitMealRadius.medium),
                    )
                    .clickable { onToggle(item.id) }
                    .padding(FitMealSpacing.small),
                contentAlignment = Alignment.Center,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(item.emoji, fontSize = 24.sp)
                    Text(
                        item.label,
                        color = FitMealColors.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                    )
                    if (!item.subtitle.isNullOrBlank()) {
                        Text(item.subtitle, color = FitMealColors.TextSecondary, fontSize = 11.sp)
                    }
                }
                if (isSelected) {
                    Box(
                        modifier = Modifier
                            .size(20.dp)
                            .clip(CircleShape)
                            .background(FitMealColors.AccentPurple)
                            .align(Alignment.TopEnd),
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Onboarding step indicator
// ---------------------------------------------------------------------------

@Composable
fun OnboardingStepIndicator(
    currentStep: Int,
    totalSteps: Int,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        repeat(totalSteps) { index ->
            val isActive = index <= currentStep
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        if (isActive) FitMealColors.AccentPurple
                        else FitMealColors.GlassStroke,
                    ),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Tag pill
// ---------------------------------------------------------------------------

@Composable
fun TagPill(
    text: String,
    modifier: Modifier = Modifier,
    background: Color = FitMealColors.GlassFill,
    foreground: Color = FitMealColors.TextSecondary,
) {
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(FitMealRadius.pill))
            .background(background)
            .border(BorderStroke(1.dp, FitMealColors.GlassStrokeSoft), RoundedCornerShape(FitMealRadius.pill))
            .padding(horizontal = 10.dp, vertical = 4.dp),
    ) {
        Text(text, color = foreground, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
    }
}
