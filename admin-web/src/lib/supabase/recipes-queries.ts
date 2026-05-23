import "server-only";
import { getSupabaseAdmin } from "./server";
import {
  slugifyTitle,
  type MealType,
  type Recipe,
  type RecipeIngredient,
  type RecipeListSummary,
  type RecipeSource,
  type RecipeStats,
  type RecipeStatus,
  type RecipeWriteInput,
} from "./recipes-shared";

// Re-export the isomorphic surface so existing server-side imports of
// `./recipes-queries` keep working. Client code MUST import from
// `./recipes-shared` -- this module pulls in `server-only`.
export * from "./recipes-shared";

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  meal_type: MealType;
  diets: string[] | null;
  allergens: string[] | null;
  tags: string[] | null;
  cook_time_minutes: number | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: RecipeIngredient[] | null;
  recipe_steps: string[] | null;
  image_url: string | null;
  thumbnail_url: string | null;
  source: RecipeSource;
  status: RecipeStatus;
  popularity_score: number;
  view_count: number;
  like_count: number;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: RecipeRow): Recipe {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    mealType: r.meal_type,
    diets: r.diets ?? [],
    allergens: r.allergens ?? [],
    tags: r.tags ?? [],
    cookTimeMinutes: r.cook_time_minutes,
    calories: r.calories,
    proteinGrams: r.protein_g,
    carbsGrams: r.carbs_g,
    fatGrams: r.fat_g,
    ingredients: r.ingredients ?? [],
    recipeSteps: r.recipe_steps ?? [],
    imageUrl: r.image_url,
    thumbnailUrl: r.thumbnail_url,
    source: r.source,
    status: r.status,
    popularityScore: r.popularity_score,
    viewCount: r.view_count,
    likeCount: r.like_count,
    createdBy: r.created_by,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapSummary(r: RecipeRow): RecipeListSummary {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    mealType: r.meal_type,
    status: r.status,
    source: r.source,
    diets: r.diets ?? [],
    calories: r.calories,
    cookTimeMinutes: r.cook_time_minutes,
    thumbnailUrl: r.thumbnail_url,
    createdAt: r.created_at,
  };
}

const SUMMARY_SELECT = `
  id, slug, title, meal_type, status, source, diets, calories,
  cook_time_minutes, thumbnail_url, created_at
`;

const FULL_SELECT = `
  id, slug, title, description, meal_type, diets, allergens, tags,
  cook_time_minutes, calories, protein_g, carbs_g, fat_g, ingredients,
  recipe_steps, image_url, thumbnail_url, source, status,
  popularity_score, view_count, like_count, created_by, approved_by,
  approved_at, created_at, updated_at
`;

export async function listRecipes(filters?: {
  status?: RecipeStatus;
  mealType?: MealType;
  source?: RecipeSource;
  query?: string;
  limit?: number;
}): Promise<RecipeListSummary[]> {
  const sb = getSupabaseAdmin();
  let req = sb
    .from("recipes")
    .select(SUMMARY_SELECT)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 500);
  if (filters?.status) req = req.eq("status", filters.status);
  if (filters?.mealType) req = req.eq("meal_type", filters.mealType);
  if (filters?.source) req = req.eq("source", filters.source);
  if (filters?.query) req = req.ilike("title", `%${filters.query}%`);

  const { data, error } = await req;
  if (error) throw new Error(`listRecipes: ${error.message}`);
  return ((data ?? []) as unknown as RecipeRow[]).map(mapSummary);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("recipes")
    .select(FULL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getRecipeById: ${error.message}`);
  return data ? mapRow(data as unknown as RecipeRow) : null;
}

export async function getRecipeStats(): Promise<RecipeStats> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("recipes")
    .select("status,meal_type")
    .limit(10_000);
  if (error) throw new Error(`getRecipeStats: ${error.message}`);

  const empty: Record<MealType, number> = {
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snack: 0,
  };
  const stats: RecipeStats = {
    total: 0,
    published: 0,
    drafts: 0,
    archived: 0,
    byMealType: { ...empty },
    publishedByMealType: { ...empty },
  };
  for (const r of (data ?? []) as { status: RecipeStatus; meal_type: MealType }[]) {
    stats.total += 1;
    if (r.status === "published") stats.published += 1;
    else if (r.status === "draft") stats.drafts += 1;
    else if (r.status === "archived") stats.archived += 1;
    stats.byMealType[r.meal_type] += 1;
    if (r.status === "published") stats.publishedByMealType[r.meal_type] += 1;
  }
  return stats;
}

export async function upsertRecipe(input: RecipeWriteInput): Promise<Recipe> {
  const sb = getSupabaseAdmin();
  const slug = (input.slug?.trim() || slugifyTitle(input.title)).slice(0, 80);

  const { data: existing } = await sb
    .from("recipes")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  const finalSlug =
    existing && (!input.slug || input.slug !== slug)
      ? `${slug}-${Math.random().toString(36).slice(2, 6)}`
      : slug;

  const row = {
    slug: finalSlug,
    title: input.title.trim().slice(0, 200),
    description: input.description?.trim() ?? null,
    meal_type: input.mealType,
    diets: input.diets ?? [],
    allergens: input.allergens ?? [],
    tags: input.tags ?? [],
    cook_time_minutes: input.cookTimeMinutes ?? null,
    calories: Math.max(0, Math.trunc(input.calories || 0)),
    protein_g: Math.max(0, Math.trunc(input.proteinGrams ?? 0)),
    carbs_g: Math.max(0, Math.trunc(input.carbsGrams ?? 0)),
    fat_g: Math.max(0, Math.trunc(input.fatGrams ?? 0)),
    ingredients: input.ingredients ?? [],
    recipe_steps: input.recipeSteps ?? [],
    image_url: input.imageUrl ?? null,
    thumbnail_url: input.thumbnailUrl ?? null,
    source: input.source ?? "curated",
    status: input.status ?? "draft",
    created_by: input.createdBy ?? null,
  };

  const { data, error } = await sb
    .from("recipes")
    .insert(row)
    .select(FULL_SELECT)
    .single();
  if (error) throw new Error(`upsertRecipe: ${error.message}`);
  return mapRow(data as unknown as RecipeRow);
}

export async function updateRecipe(
  id: string,
  patch: Partial<RecipeWriteInput>,
): Promise<Recipe> {
  const sb = getSupabaseAdmin();
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update.title = patch.title.trim().slice(0, 200);
  if (patch.description !== undefined) update.description = patch.description?.trim() ?? null;
  if (patch.mealType !== undefined) update.meal_type = patch.mealType;
  if (patch.diets !== undefined) update.diets = patch.diets;
  if (patch.allergens !== undefined) update.allergens = patch.allergens;
  if (patch.tags !== undefined) update.tags = patch.tags;
  if (patch.cookTimeMinutes !== undefined)
    update.cook_time_minutes = patch.cookTimeMinutes;
  if (patch.calories !== undefined)
    update.calories = Math.max(0, Math.trunc(patch.calories || 0));
  if (patch.proteinGrams !== undefined)
    update.protein_g = Math.max(0, Math.trunc(patch.proteinGrams));
  if (patch.carbsGrams !== undefined)
    update.carbs_g = Math.max(0, Math.trunc(patch.carbsGrams));
  if (patch.fatGrams !== undefined) update.fat_g = Math.max(0, Math.trunc(patch.fatGrams));
  if (patch.ingredients !== undefined) update.ingredients = patch.ingredients;
  if (patch.recipeSteps !== undefined) update.recipe_steps = patch.recipeSteps;
  if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl;
  if (patch.thumbnailUrl !== undefined) update.thumbnail_url = patch.thumbnailUrl;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.source !== undefined) update.source = patch.source;

  const { data, error } = await sb
    .from("recipes")
    .update(update)
    .eq("id", id)
    .select(FULL_SELECT)
    .single();
  if (error) throw new Error(`updateRecipe: ${error.message}`);
  return mapRow(data as unknown as RecipeRow);
}

export async function setRecipeStatus(
  id: string,
  next: RecipeStatus,
  approvedBy?: string,
): Promise<void> {
  const sb = getSupabaseAdmin();
  const update: Record<string, unknown> = { status: next };
  if (next === "published") {
    update.approved_at = new Date().toISOString();
    if (approvedBy) update.approved_by = approvedBy;
  }
  const { error } = await sb.from("recipes").update(update).eq("id", id);
  if (error) throw new Error(`setRecipeStatus: ${error.message}`);
}

export async function shuffleForUser(opts: {
  userId: string;
  mealType: MealType;
  diets: string[];
  allergens: string[];
  cookTimeMinutes: number | null;
  count: number;
}): Promise<Recipe[]> {
  const sb = getSupabaseAdmin();
  const { userId: _userId, mealType, diets, allergens, cookTimeMinutes, count } = opts;
  void _userId;

  let req = sb
    .from("recipes")
    .select(FULL_SELECT)
    .eq("status", "published")
    .eq("meal_type", mealType);

  if (allergens.length > 0) {
    req = req.not(
      "allergens",
      "ov",
      `{${allergens.map((a) => a.replace(/[{}",]/g, "")).join(",")}}`,
    );
  }
  if (diets.length > 0) {
    req = req.overlaps("diets", diets);
  }
  if (cookTimeMinutes !== null && cookTimeMinutes > 0) {
    req = req.lte("cook_time_minutes", cookTimeMinutes);
  }

  const { data, error } = await req.limit(200);
  if (error) throw new Error(`shuffleForUser: ${error.message}`);
  const rows = ((data ?? []) as unknown as RecipeRow[]).map(mapRow);

  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows.slice(0, Math.max(1, Math.min(count, rows.length)));
}
