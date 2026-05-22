# Design System

Style:
Apple-inspired glassmorphism.

Background:
Dark gradient from #0F172A to #1E3A8A to #7C3AED.
Per-screen accents allowed: purple #8F5CFF and blue #4F8CFF (matches React prototype).
Success green: #34D399. Error/allergy red: #EF4444.

Glass card:
- Material: .ultraThinMaterial
- Corner radius: 24
- Stroke: white opacity 0.20
- Shadow: black opacity 0.18, radius 24
- Padding: 18

Typography:
- Large title: 34 bold
- Title: 24 bold
- Headline: 18 semibold
- Body: 16 regular
- Caption: 13 regular

Buttons:
Primary:
- Height 52
- Gradient blue to purple (#4F8CFF -> #8F5CFF)
- Corner radius 16
- Optional success state: gradient green (#34D399 -> #059669)

Secondary:
- Height 48
- Glass background
- White stroke opacity 0.20

Selection chips:
- Multi-select cards: gradient overlay #8F5CFF/30 -> #4F8CFF/15 when active, glow shadow
- Toggle pills: green gradient when active for meal timings
- Allergy chips: red 0.20 background, red border when active

Step indicator:
- 3 steps: Goal, Workout, Meal
- Active: gradient circle with glow
- Completed: solid purple with check

Animation:
- Card entrance: opacity 0 to 1, y 30 to 0
- Button tap: scale 1 to 0.96 to 1
- AI loading: shimmer skeleton
- Tab change: fade + slight slide
- Screen transition: x 20 to 0 with opacity
