package com.fitmealai.ui.screens.progress

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.SegmentedPicker
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealSpacing

private val PERIODS = listOf("Week", "Month", "3 Months")

@Composable
fun ProgressScreen() {
    var period by remember { mutableStateOf("Week") }
    val weights = remember(period) {
        when (period) {
            "Week" -> listOf(72.4f, 72.2f, 72.0f, 71.9f, 71.8f, 71.6f, 71.5f)
            "Month" -> listOf(73.1f, 72.8f, 72.4f, 72.0f, 71.7f, 71.5f, 71.4f, 71.3f)
            else -> listOf(74.0f, 73.5f, 73.0f, 72.5f, 72.0f, 71.5f, 71.3f, 71.2f, 71.1f)
        }
    }

    ScreenContainer(modifier = Modifier.testTag("android-progress-screen")) {
        TopBar(title = "Progress", subtitle = "Stay close to your goal")

        SegmentedPicker(options = PERIODS, selected = period, onSelect = { period = it })

        GlassCard(modifier = Modifier.fillMaxWidth().testTag("android-progress-weight-card")) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text("WEIGHT", color = FitMealColors.TextTertiary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        Text(
                            "${weights.last()} kg",
                            color = FitMealColors.TextPrimary,
                            fontSize = 28.sp,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                    Column(horizontalAlignment = androidx.compose.ui.Alignment.End) {
                        val delta = weights.last() - weights.first()
                        val arrow = if (delta < 0) "▼" else if (delta > 0) "▲" else "="
                        val tint = if (delta < 0) FitMealColors.SuccessGreen else FitMealColors.WarningGold
                        Text("$arrow ${"%+.1f".format(delta)} kg", color = tint, fontWeight = FontWeight.SemiBold)
                        Text("vs $period start", color = FitMealColors.TextTertiary, fontSize = 11.sp)
                    }
                }
                Spacer(Modifier.height(FitMealSpacing.small))
                LineChart(values = weights, modifier = Modifier.fillMaxWidth().height(140.dp))
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text(
                    "Body composition",
                    color = FitMealColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                StatRow("Body fat", "21.4%", "-0.6")
                StatRow("Muscle mass", "33.1 kg", "+0.4")
                StatRow("Visceral fat", "Healthy", "")
            }
        }

        GlassCard(modifier = Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(FitMealSpacing.small)) {
                Text(
                    "This week",
                    color = FitMealColors.TextPrimary,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                )
                StatRow("Calories", "13,840 kcal", "")
                StatRow("Protein", "+12% vs target", "")
                StatRow("Workouts", "4 of 5", "")
                StatRow("Habit streak", "🔥 9 days", "")
            }
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
private fun StatRow(label: String, value: String, delta: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = FitMealColors.TextSecondary)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(value, color = FitMealColors.TextPrimary, fontWeight = FontWeight.SemiBold)
            if (delta.isNotBlank()) {
                Text(delta, color = FitMealColors.SuccessGreen, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun LineChart(values: List<Float>, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        if (values.size < 2) return@Canvas
        val minV = values.min()
        val maxV = values.max()
        val range = (maxV - minV).coerceAtLeast(0.0001f)
        val stepX = size.width / (values.size - 1)
        val path = Path().apply {
            values.forEachIndexed { i, v ->
                val x = i * stepX
                val y = size.height - ((v - minV) / range) * size.height
                if (i == 0) moveTo(x, y) else lineTo(x, y)
            }
        }
        drawPath(
            path = path,
            color = FitMealColors.AccentPurple,
            style = Stroke(width = 4f, cap = StrokeCap.Round),
        )
        // Dots
        values.forEachIndexed { i, v ->
            val x = i * stepX
            val y = size.height - ((v - minV) / range) * size.height
            drawCircle(
                color = FitMealColors.AccentPurple,
                radius = 5f,
                center = Offset(x, y),
            )
        }
    }
}
