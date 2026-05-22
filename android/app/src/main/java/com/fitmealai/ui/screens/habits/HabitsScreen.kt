package com.fitmealai.ui.screens.habits

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.fitmealai.data.MockData
import com.fitmealai.domain.Habit
import com.fitmealai.ui.components.GlassCard
import com.fitmealai.ui.components.ScreenContainer
import com.fitmealai.ui.components.TopBar
import com.fitmealai.ui.theme.FitMealColors
import com.fitmealai.ui.theme.FitMealRadius
import com.fitmealai.ui.theme.FitMealSpacing

@Composable
fun HabitsScreen() {
    var habits by remember { mutableStateOf(MockData.habits) }
    val completed = habits.count { it.isCompleted }

    ScreenContainer(modifier = Modifier.testTag("android-habits-screen")) {
        TopBar(title = "Habits", subtitle = "$completed of ${habits.size} done today")

        // Progress bar
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(FitMealColors.GlassStroke),
        ) {
            val progress = if (habits.isNotEmpty()) completed.toFloat() / habits.size else 0f
            Box(
                modifier = Modifier
                    .fillMaxWidth(fraction = progress)
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp))
                    .background(FitMealColors.SuccessGreen),
            )
        }

        habits.forEach { habit ->
            HabitRow(
                habit = habit,
                onToggle = {
                    habits = habits.map {
                        if (it.id == habit.id) it.copy(isCompleted = !it.isCompleted) else it
                    }
                },
            )
        }

        Spacer(Modifier.height(FitMealSpacing.large))
    }
}

@Composable
private fun HabitRow(habit: Habit, onToggle: () -> Unit) {
    GlassCard(
        modifier = Modifier.fillMaxWidth().testTag("android-habit-row-${habit.id}"),
        onClick = onToggle,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(FitMealSpacing.medium)) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(FitMealColors.GlassFillSoft)
                    .border(
                        width = 1.dp,
                        color = FitMealColors.GlassStroke,
                        shape = RoundedCornerShape(12.dp),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(habit.emoji, fontSize = 22.sp)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    habit.title,
                    color = FitMealColors.TextPrimary,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                )
                Text("🔥 ${habit.streakDays} day streak", color = FitMealColors.TextTertiary, fontSize = 12.sp)
            }
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(FitMealRadius.pill))
                    .background(
                        if (habit.isCompleted) FitMealColors.SuccessGreen
                        else FitMealColors.GlassFillSoft
                    )
                    .border(
                        width = 1.dp,
                        color = if (habit.isCompleted) FitMealColors.SuccessGreen else FitMealColors.GlassStroke,
                        shape = RoundedCornerShape(FitMealRadius.pill),
                    ),
                contentAlignment = Alignment.Center,
            ) {
                if (habit.isCompleted) {
                    Icon(Icons.Default.Check, contentDescription = "Done", tint = androidx.compose.ui.graphics.Color.White, modifier = Modifier.size(16.dp))
                }
            }
        }
    }
}
