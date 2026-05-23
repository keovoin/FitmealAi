/**
 * Isomorphic types + pure helpers for the recipes catalog. Safe to
 * import from client components (recipe form) and server code. The
 * DB-touching helpers live in `recipes-queries.ts`, which is
 * `server-only` and re-exports everything below.
 */

export type RecipeStatus = "draft" | "published" | "archived";
export type RecipeSource = "ai_generated" | "curated" | "imported";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface RecipeIngredient {
  name: string;
  grams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  mealType: MealType;
  diets: string[];
  allergens: string[];
  tags: string[];
  cookTimeMinutes: number | null;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  ingredients: RecipeIngredient[];
  recipeSteps: string[];
  imageUrl: string | null;
  thumbnailUrl: string | null;
  source: RecipeSource;
  status: RecipeStatus;
  popularityScore: number;
  viewCount: number;
  likeCount: number;
  createdBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipeListSummary {
  id: string;
  slug: string;
  title: string;
  mealType: MealType;
  status: RecipeStatus;
  source: RecipeSource;
  diets: string[];
  calories: number;
  cookTimeMinutes: number | null;
  thumbnailUrl: string | null;
  createdAt: string;
}

export interface RecipeStats {
  total: number;
  published: number;
  drafts: number;
  archived: number;
  byMealType: Record<MealType, number>;
  publishedByMealType: Record<MealType, number>;
}

export interface RecipeWriteInput {
  slug?: string;
  title: string;
  description?: string | null;
  mealType: MealType;
  diets?: string[];
  allergens?: string[];
  tags?: string[];
  cookTimeMinutes?: number | null;
  calories: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  ingredients?: RecipeIngredient[];
  recipeSteps?: string[];
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  source?: RecipeSource;
  status?: RecipeStatus;
  createdBy?: string | null;
}

/** Slugify a title for use as the recipe's stable URL key. */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 64) || `recipe-${Math.random().toString(36).slice(2, 10)}`
  );
}
