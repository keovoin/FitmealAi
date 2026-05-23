-- =============================================================================
-- 0015_notification_templates.sql
-- Admin-customizable text templates for the push / Telegram notification types
-- the mobile app surfaces in `notification_prefs`. Stored as a single JSONB
-- row in `app_settings` so the existing /payment-settings pattern transfers.
--
-- The shape stored at key `notification_templates` is a JSON object with keys
-- meal_plan_ready, payment_approved, water_reminder, workout_reminder,
-- habit_streak, weekly_summary, each pointing to { title, body }.
--
-- Bodies may contain {name}, {tier}, {streak} placeholders which the
-- /api/push/send and /api/telegram/send routes substitute at delivery time.
--
-- Idempotent on re-run.
-- =============================================================================

insert into public.app_settings(key, value, description) values
  (
    'notification_templates',
    '{"meal_plan_ready":{"title":"Today is plan is ready","body":"Your personalized meal plan is waiting in FitMeal AI."},"payment_approved":{"title":"Welcome to FitMeal {tier}","body":"Your payment has been approved. Enjoy unlimited generations."},"water_reminder":{"title":"Hydration check","body":"Time to sip some water. Aim for 8 glasses a day."},"workout_reminder":{"title":"Move your body","body":"Your workout is scheduled. A short session beats none."},"habit_streak":{"title":"{streak}-day streak!","body":"You are on a roll, {name}. Keep it going."},"weekly_summary":{"title":"Your weekly recap","body":"Here is how the past 7 days looked. Open the app for details."}}'::jsonb,
    'Editable text for each push notification type. Surfaced on /notifications.'
  )
on conflict (key) do nothing;
