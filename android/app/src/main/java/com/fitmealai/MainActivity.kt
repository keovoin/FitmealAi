package com.fitmealai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.fitmealai.ui.FitMealAndroidApp
import com.fitmealai.ui.theme.FitMealTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FitMealTheme {
                FitMealAndroidApp()
            }
        }
    }
}