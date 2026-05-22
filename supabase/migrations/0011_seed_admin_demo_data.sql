-- =============================================================================
-- 0011_seed_admin_demo_data.sql
-- Optional: seed enough rows so the admin dashboard isn't empty before any
-- real user signs up. Safe to run multiple times - everything is upsert.
--
-- Skip this if you'd rather start with an empty database.
-- =============================================================================

-- Seed three sample meals into the shared pool. These are the same dishes
-- the iOS MockData.swift uses, so the iOS app can show them too.
insert into public.meals (slug, title, meal_type, calories, protein_g, carbs_g, fat_g, ingredients, recipe_steps, generated_by_model)
values
  ('greek-yogurt-bowl', 'Greek Yogurt Bowl', 'breakfast', 380, 28, 42, 9,
   '[{"name":"Greek yogurt","grams":200,"calories":200,"protein_g":20,"carbs_g":12,"fat_g":6},
     {"name":"Granola","grams":40,"calories":160,"protein_g":4,"carbs_g":24,"fat_g":5},
     {"name":"Blueberries","grams":60,"calories":35,"protein_g":0,"carbs_g":9,"fat_g":0},
     {"name":"Honey","grams":10,"calories":30,"protein_g":0,"carbs_g":8,"fat_g":0}]'::jsonb,
   '["Spoon yogurt into a bowl.","Top with granola and blueberries.","Drizzle honey on top."]'::jsonb,
   'seed'),

  ('grilled-chicken-quinoa', 'Grilled Chicken Quinoa', 'lunch', 620, 45, 60, 18,
   '[{"name":"Chicken breast","grams":180,"calories":300,"protein_g":36,"carbs_g":0,"fat_g":12},
     {"name":"Quinoa","grams":120,"calories":220,"protein_g":8,"carbs_g":40,"fat_g":4},
     {"name":"Mixed greens","grams":80,"calories":60,"protein_g":1,"carbs_g":12,"fat_g":0},
     {"name":"Olive oil","grams":10,"calories":90,"protein_g":0,"carbs_g":0,"fat_g":10}]'::jsonb,
   '["Cook quinoa per package directions.","Season and grill chicken until 74C internal.","Plate greens, top with chicken and quinoa, finish with olive oil."]'::jsonb,
   'seed'),

  ('salmon-with-veggies', 'Salmon with Veggies', 'dinner', 540, 38, 30, 22,
   '[{"name":"Salmon fillet","grams":160,"calories":320,"protein_g":32,"carbs_g":0,"fat_g":18},
     {"name":"Sweet potato","grams":150,"calories":130,"protein_g":2,"carbs_g":30,"fat_g":0},
     {"name":"Roasted broccoli","grams":120,"calories":90,"protein_g":4,"carbs_g":14,"fat_g":4}]'::jsonb,
   '["Roast sweet potato and broccoli at 220C for 20 minutes.","Pan-sear salmon skin-side down 4 minutes, flip, 2 more.","Plate together."]'::jsonb,
   'seed')
on conflict (slug) do nothing;
