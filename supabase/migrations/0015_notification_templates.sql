-- =============================================================================
-- 0015_notification_templates.sql
-- Admin-customizable text templates for the push / Telegram notification types
-- the mobile app surfaces in `notification_prefs`. Stored as a single JSONB
-- row in `app_settings` so the existing /payment-settings pattern transfers.
--
-- The shape stored at key `notification_templates` is:
--   {
--     "meal_plan_ready":   { "title": "...", "body": "..." },
--     "payment_approved":  { "title": "...", "body": "..." },
--     "water_reminder":    { "title": "...", "body": "..." },
--     "workout_reminder":  { "title": "...", "body": "..." },
--     "habit_streak":      { "title": "...", "body": "..." },
--     "weekly_summary":    { "title": "...", "body": "..." }
--   }
--
-- Bodies may contain `{name}`, `{tier}`, `{streak}` placeholders which the
-- /api/push/send and /api/telegram/send routes substitute at delivery time.
--
-- Idempotent on re-run.
-- =============================================================================

insert into public.app_settings(key, value, description) values
  (
    'notification_templates',
    jsonb_build_object(
      'meal_plan_ready',   jsonb_build_object(
        'title', 'Today''s plan is ready',
        'body',  'Your personalized meal plan is waiting in FitMeal AI.'
      ),
      'payment_approved',  jsonb_build_object(
        'title', 'Welcome to FitMeal {tier}',
        'body',  'Your payment has been approved. Enjoy unlimited generations.'
      ),
      'water_reminder',    jsonb_build_object(
        'title', 'Hydration check',
        'body',  'Time to sip some water. Aim for 8 glasses a day.'
      ),
      'workout_reminder',  jsonb_build_object(
        'title', 'Move your body',
        'body',  'Your workout is scheduled. A short session beats none.'
      ),
      'habit_streak',      jsonb_build_object(
        'title', '{streak}-day streak!',
        'body',  'You''re on a roll, {name}. Keep it going.'
      ),
      'weekly_summary',    jsonb_build_object(
        'title', 'Your weekly recap',
        'body',  'Here''s how the past 7 days looked. Open the app for details.'
      )
    ),
    'Editable text for each push notification type. Surfaced on /notifications.'
  )
on conflict (key) do nothing;
