"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/recipes/image-upload-field";
import { createRecipe, saveRecipe, transitionRecipe } from "@/lib/supabase/admin-actions";
import {
  slugifyTitle,
  type Recipe,
  type RecipeStatus,
  type RecipeWriteInput,
  type MealType,
  type RecipeIngredient,
} from "@/lib/supabase/recipes-shared";
import { Check, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

const DIET_SUGGESTIONS = [
  "balanced",
  "high-protein",
  "low-carb",
  "keto",
  "vegetarian",
  "vegan",
  "pescatarian",
  "gluten-free",
];

const ALLERGEN_SUGGESTIONS = [
  "nuts",
  "dairy",
  "eggs",
  "gluten",
  "soy",
  "shellfish",
];

interface FormState {
  title: string;
  description: string;
  mealType: MealType;
  diets: string[];
  allergens: string[];
  tags: string[];
  cookTimeMinutes: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatGrams: string;
  imageUrl: string;
  thumbnailUrl: string;
  ingredients: RecipeIngredient[];
  recipeSteps: string[];
  status: RecipeStatus;
}

function fromRecipe(r: Recipe | null): FormState {
  return {
    title: r?.title ?? "",
    description: r?.description ?? "",
    mealType: r?.mealType ?? "lunch",
    diets: r?.diets ?? [],
    allergens: r?.allergens ?? [],
    tags: r?.tags ?? [],
    cookTimeMinutes: r?.cookTimeMinutes ? String(r.cookTimeMinutes) : "",
    calories: r ? String(r.calories) : "",
    proteinGrams: r ? String(r.proteinGrams) : "",
    carbsGrams: r ? String(r.carbsGrams) : "",
    fatGrams: r ? String(r.fatGrams) : "",
    imageUrl: r?.imageUrl ?? "",
    thumbnailUrl: r?.thumbnailUrl ?? "",
    ingredients:
      r?.ingredients && r.ingredients.length > 0
        ? r.ingredients
        : [emptyIngredient()],
    recipeSteps: r?.recipeSteps && r.recipeSteps.length > 0 ? r.recipeSteps : [""],
    status: r?.status ?? "draft",
  };
}

/**
 * Same as `fromRecipe` but seeded from a `RecipeWriteInput` (the
 * shape returned by the AI generate panel). Falls back to the existing
 * recipe's status so we don't accidentally re-publish a draft when an
 * admin regenerates over a published row.
 */
function fromWriteInput(
  input: RecipeWriteInput,
  existing: Recipe | null,
): FormState {
  return {
    title: input.title,
    description: input.description ?? "",
    mealType: input.mealType,
    diets: input.diets ?? [],
    allergens: input.allergens ?? [],
    tags: input.tags ?? [],
    cookTimeMinutes:
      input.cookTimeMinutes !== null && input.cookTimeMinutes !== undefined
        ? String(input.cookTimeMinutes)
        : "",
    calories: String(input.calories ?? 0),
    proteinGrams: String(input.proteinGrams ?? 0),
    carbsGrams: String(input.carbsGrams ?? 0),
    fatGrams: String(input.fatGrams ?? 0),
    imageUrl: input.imageUrl ?? "",
    thumbnailUrl: input.thumbnailUrl ?? "",
    ingredients:
      input.ingredients && input.ingredients.length > 0
        ? input.ingredients
        : [emptyIngredient()],
    recipeSteps:
      input.recipeSteps && input.recipeSteps.length > 0
        ? input.recipeSteps
        : [""],
    status: existing?.status ?? input.status ?? "draft",
  };
}

function emptyIngredient(): RecipeIngredient {
  return {
    name: "",
    grams: 0,
    calories: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
  };
}

function toWriteInput(form: FormState): RecipeWriteInput {
  return {
    title: form.title,
    description: form.description.trim() || null,
    mealType: form.mealType,
    diets: form.diets,
    allergens: form.allergens,
    tags: form.tags,
    cookTimeMinutes: form.cookTimeMinutes.trim() === "" ? null : Number(form.cookTimeMinutes),
    calories: Number(form.calories || 0),
    proteinGrams: Number(form.proteinGrams || 0),
    carbsGrams: Number(form.carbsGrams || 0),
    fatGrams: Number(form.fatGrams || 0),
    ingredients: form.ingredients.filter((i) => i.name.trim().length > 0),
    recipeSteps: form.recipeSteps.map((s) => s.trim()).filter((s) => s.length > 0),
    imageUrl: form.imageUrl.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    status: form.status,
  };
}

export function RecipeForm({
  existing,
  prefill,
}: {
  existing: Recipe | null;
  /**
   * Optional pre-filled draft (e.g. from the AI generate panel). When
   * this prop's identity changes, the form resets to its values. Pass
   * the same object reference repeatedly to avoid clobbering edits.
   */
  prefill?: RecipeWriteInput | null;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(fromRecipe(existing));
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // When the AI panel hands us a fresh draft, replace the form state.
  // The dependency on the prefill identity (not its fields) means
  // typing in the form between generations doesn't get clobbered.
  useEffect(() => {
    if (prefill) {
      setForm(fromWriteInput(prefill, existing));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const isNew = !existing;
  const macroSum = useMemo(() => {
    const c = form.ingredients.reduce(
      (acc, i) => ({
        cal: acc.cal + (i.calories || 0),
        p: acc.p + (i.proteinGrams || 0),
        cb: acc.cb + (i.carbsGrams || 0),
        f: acc.f + (i.fatGrams || 0),
      }),
      { cal: 0, p: 0, cb: 0, f: 0 },
    );
    return c;
  }, [form.ingredients]);

  const macroMatches =
    Number(form.calories) === macroSum.cal &&
    Number(form.proteinGrams) === macroSum.p &&
    Number(form.carbsGrams) === macroSum.cb &&
    Number(form.fatGrams) === macroSum.f;

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setIngredient(idx: number, field: keyof RecipeIngredient, value: string) {
    setForm((prev) => {
      const next = [...prev.ingredients];
      const numFields: (keyof RecipeIngredient)[] = [
        "grams",
        "calories",
        "proteinGrams",
        "carbsGrams",
        "fatGrams",
      ];
      const updated: RecipeIngredient = {
        ...next[idx],
        [field]: numFields.includes(field) ? Number(value) || 0 : value,
      };
      next[idx] = updated;
      return { ...prev, ingredients: next };
    });
  }

  function addIngredient() {
    setForm((p) => ({ ...p, ingredients: [...p.ingredients, emptyIngredient()] }));
  }
  function removeIngredient(idx: number) {
    setForm((p) => ({
      ...p,
      ingredients: p.ingredients.filter((_, i) => i !== idx),
    }));
  }

  function setStep(idx: number, value: string) {
    setForm((p) => {
      const next = [...p.recipeSteps];
      next[idx] = value;
      return { ...p, recipeSteps: next };
    });
  }
  function addStep() {
    setForm((p) => ({ ...p, recipeSteps: [...p.recipeSteps, ""] }));
  }
  function removeStep(idx: number) {
    setForm((p) => ({
      ...p,
      recipeSteps: p.recipeSteps.filter((_, i) => i !== idx),
    }));
  }

  function toggleTag(arrKey: "diets" | "allergens", value: string) {
    setForm((p) => {
      const has = p[arrKey].includes(value);
      return {
        ...p,
        [arrKey]: has ? p[arrKey].filter((d) => d !== value) : [...p[arrKey], value],
      };
    });
  }

  function save() {
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!Number.isFinite(Number(form.calories))) {
      setError("Calories must be a number.");
      return;
    }
    startTransition(async () => {
      const input = toWriteInput(form);
      if (existing) {
        const res = await saveRecipe(existing.id, input);
        if (res.ok) setSavedAt(Date.now());
        else setError(res.error);
      } else {
        const res = await createRecipe({ ...input, status: "draft" });
        if (res.ok) {
          router.push(`/recipes/${res.id}`);
        } else {
          setError(res.error);
        }
      }
    });
  }

  function transition(next: RecipeStatus) {
    if (!existing) return;
    startTransition(async () => {
      const res = await transitionRecipe(existing.id, next);
      if (!res.ok) setError(res.error);
      else {
        setSavedAt(Date.now());
        setForm((p) => ({ ...p, status: next }));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ---------- Title + meal type + status ------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="col-span-2 space-y-1 text-xs text-white/60">
            <span>Title</span>
            <input
              value={form.title}
              onChange={(e) => patch("title", e.target.value)}
              maxLength={200}
              className="glass-input h-10 w-full text-sm"
              data-testid="recipe-title-input"
              placeholder="Greek yogurt bowl"
            />
          </label>
          <label className="space-y-1 text-xs text-white/60">
            <span>Meal type</span>
            <select
              value={form.mealType}
              onChange={(e) => patch("mealType", e.target.value as MealType)}
              className="glass-input h-10 w-full text-sm"
              data-testid="recipe-meal-type"
            >
              {MEAL_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m[0].toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block space-y-1 text-xs text-white/60">
          <span>Description (optional)</span>
          <textarea
            value={form.description}
            onChange={(e) => patch("description", e.target.value)}
            rows={2}
            maxLength={500}
            className="glass-input min-h-[60px] py-2 text-sm leading-relaxed"
            placeholder="Creamy yogurt with granola, fresh berries, and honey."
          />
        </label>
      </div>

      {/* ---------- Macros ----------------------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">Per-serving nutrition</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          <NumField
            label="Calories"
            value={form.calories}
            onChange={(v) => patch("calories", v)}
            tag="recipe-calories-input"
          />
          <NumField
            label="Protein g"
            value={form.proteinGrams}
            onChange={(v) => patch("proteinGrams", v)}
          />
          <NumField
            label="Carbs g"
            value={form.carbsGrams}
            onChange={(v) => patch("carbsGrams", v)}
          />
          <NumField
            label="Fat g"
            value={form.fatGrams}
            onChange={(v) => patch("fatGrams", v)}
          />
          <NumField
            label="Cook (min)"
            value={form.cookTimeMinutes}
            onChange={(v) => patch("cookTimeMinutes", v)}
          />
        </div>
        {!macroMatches && form.ingredients.some((i) => i.name.trim()) && (
          <p className="mt-2 text-[11px] text-amber-300/80">
            ⚠ Per-serving totals don&apos;t match the sum across ingredients
            ({macroSum.cal} kcal / {macroSum.p}P / {macroSum.cb}C / {macroSum.f}F). Update
            either side before publishing.
          </p>
        )}
      </div>

      {/* ---------- Diets / allergens ----------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">Tags</p>
        <p className="mt-0.5 text-xs text-white/55">
          Used by the mobile shuffle to filter recipes against the user&apos;s
          meal preferences.
        </p>
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-white/45">Diets</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {DIET_SUGGESTIONS.map((d) => {
                const on = form.diets.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleTag("diets", d)}
                    className={`glass-pill px-2.5 py-1 text-[11px] ${
                      on
                        ? "bg-accent-purple/30 text-white border border-accent-purple/50"
                        : "text-white/65 hover:bg-white/[0.10] hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-white/45">Allergens</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {ALLERGEN_SUGGESTIONS.map((a) => {
                const on = form.allergens.includes(a);
                return (
                  <button
                    type="button"
                    key={a}
                    onClick={() => toggleTag("allergens", a)}
                    className={`glass-pill px-2.5 py-1 text-[11px] ${
                      on
                        ? "bg-danger/30 text-white border border-danger/50"
                        : "text-white/65 hover:bg-white/[0.10] hover:text-white"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Ingredients ----------------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Ingredients</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={addIngredient}
          >
            Add
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {form.ingredients.map((ing, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2"
            >
              <input
                value={ing.name}
                onChange={(e) => setIngredient(idx, "name", e.target.value)}
                placeholder="Greek yogurt"
                className="glass-input col-span-4 h-8 text-xs"
              />
              <input
                type="number"
                value={ing.grams || ""}
                onChange={(e) => setIngredient(idx, "grams", e.target.value)}
                placeholder="g"
                className="glass-input col-span-1 h-8 text-xs"
              />
              <input
                type="number"
                value={ing.calories || ""}
                onChange={(e) => setIngredient(idx, "calories", e.target.value)}
                placeholder="kcal"
                className="glass-input col-span-2 h-8 text-xs"
              />
              <input
                type="number"
                value={ing.proteinGrams || ""}
                onChange={(e) => setIngredient(idx, "proteinGrams", e.target.value)}
                placeholder="P"
                className="glass-input col-span-1 h-8 text-xs"
              />
              <input
                type="number"
                value={ing.carbsGrams || ""}
                onChange={(e) => setIngredient(idx, "carbsGrams", e.target.value)}
                placeholder="C"
                className="glass-input col-span-1 h-8 text-xs"
              />
              <input
                type="number"
                value={ing.fatGrams || ""}
                onChange={(e) => setIngredient(idx, "fatGrams", e.target.value)}
                placeholder="F"
                className="glass-input col-span-1 h-8 text-xs"
              />
              <button
                type="button"
                onClick={() => removeIngredient(idx)}
                aria-label="Remove ingredient"
                className="col-span-2 inline-flex items-center justify-center rounded-md border border-white/10 text-white/55 hover:bg-white/[0.06] hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Steps ----------------------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Recipe steps</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="h-3 w-3" />}
            onClick={addStep}
          >
            Add step
          </Button>
        </div>
        <ol className="mt-3 space-y-2">
          {form.recipeSteps.map((s, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <span className="w-6 text-right text-xs text-white/45">{idx + 1}.</span>
              <input
                value={s}
                onChange={(e) => setStep(idx, e.target.value)}
                placeholder="Spoon yogurt into a bowl."
                className="glass-input h-9 flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => removeStep(idx)}
                aria-label={`Remove step ${idx + 1}`}
                className="rounded-md p-1 text-white/45 hover:bg-white/[0.06] hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* ---------- Image picker --------------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-sm font-semibold text-white">Imagery</p>
        <p className="mt-0.5 text-xs text-white/55">
          Upload a hero image (PNG/JPEG/WebP, up to 8 MB) or paste an
          existing CDN URL. Stored in the public <code>recipe-images</code>
          bucket.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <ImageUploadField
            label="Hero image"
            value={form.imageUrl}
            onChange={(v) => patch("imageUrl", v)}
            slugHint={existing?.slug ?? slugifyTitle(form.title || "recipe")}
            testIdPrefix="recipe-image"
          />
          <ImageUploadField
            label="Thumbnail (optional, falls back to hero)"
            value={form.thumbnailUrl}
            onChange={(v) => patch("thumbnailUrl", v)}
            slugHint={
              (existing?.slug ?? slugifyTitle(form.title || "recipe")) + "-thumb"
            }
            testIdPrefix="recipe-thumb"
          />
        </div>
      </div>

      {/* ---------- Footer: status + save ------------------------------ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {existing && <Badge tone="outline">Status: {existing.status}</Badge>}
          {savedAt && (
            <Badge tone="green">
              <Check className="h-3 w-3" /> Saved
            </Badge>
          )}
          {error && <span className="text-[11px] text-red-300">{error}</span>}
        </div>
        <div className="flex items-center gap-2">
          {existing?.status === "draft" && (
            <Button
              type="button"
              size="sm"
              variant="success"
              onClick={() => transition("published")}
              loading={pending}
              data-testid="recipe-publish-button"
            >
              Publish
            </Button>
          )}
          {existing?.status === "published" && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => transition("archived")}
              loading={pending}
            >
              Archive
            </Button>
          )}
          {existing?.status === "archived" && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => transition("draft")}
              loading={pending}
            >
              Restore as draft
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={save}
            loading={pending}
            data-testid="recipe-save-button"
          >
            {isNew ? "Create draft" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  tag,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tag?: string;
}) {
  return (
    <label className="space-y-1 text-xs text-white/60">
      <span>{label}</span>
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input h-9 w-full text-sm"
        data-testid={tag}
      />
    </label>
  );
}
