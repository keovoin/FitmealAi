import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { SetupRequiredBanner } from "@/components/ui/setup-required-banner";
import { DataTable } from "@/components/ui/data-table";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { StatTile } from "@/components/ui/stat-tile";
import { Badge } from "@/components/ui/badge";
import {
  getRecipeStats,
  listRecipes,
  type MealType,
  type RecipeListSummary,
  type RecipeStatus,
  type RecipeSource,
} from "@/lib/supabase/recipes-queries";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { classifySupabaseError } from "@/lib/supabase/setup-check";
import { relativeFromNow } from "@/lib/format";
import {
  AlertTriangle,
  ChefHat,
  Clock,
  FileText,
  Inbox,
  Plus,
  Sparkles,
  Upload,
  Utensils,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_TABS: Array<{ key: RecipeStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function statusTone(status: RecipeStatus): "gold" | "green" | "outline" {
  if (status === "published") return "green";
  if (status === "draft") return "gold";
  return "outline";
}

function sourceTone(source: RecipeSource): "blue" | "purple" | "neutral" {
  if (source === "curated") return "blue";
  if (source === "ai_generated") return "purple";
  return "neutral";
}

export default async function RecipesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    meal_type?: string;
    source?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const statusFilter = (params.status as RecipeStatus | "all") ?? "all";
  const mealTypeFilter = (params.meal_type as MealType | "all" | undefined) ?? "all";
  const sourceFilter = (params.source as RecipeSource | "all" | undefined) ?? "all";
  const query = (params.q ?? "").trim();

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Recipes">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  let stats;
  let rows: RecipeListSummary[] = [];
  try {
    [stats, rows] = await Promise.all([
      getRecipeStats(),
      listRecipes({
        status: statusFilter === "all" ? undefined : statusFilter,
        mealType: mealTypeFilter === "all" ? undefined : (mealTypeFilter as MealType),
        source: sourceFilter === "all" ? undefined : (sourceFilter as RecipeSource),
        query: query || undefined,
      }),
    ]);
  } catch (error) {
    const hint = classifySupabaseError(error);
    return (
      <PageShell title="Recipes" subtitle="Catalog of meals offered by the Shuffle button.">
        {hint.isMissingTable ? (
          <SetupRequiredBanner page="The recipes catalog" rawMessage={hint.rawMessage} />
        ) : (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Unable to load recipes</p>
                <p className="mt-1 break-all font-mono text-sm opacity-80">
                  {hint.rawMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Recipes"
      subtitle="Catalog of meals offered by the mobile Shuffle button."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/recipes/bulk-upload"
            className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/[0.14] hover:text-white"
            data-testid="recipes-bulk-upload-button"
          >
            <Upload className="h-3.5 w-3.5" />
            Bulk upload
          </Link>
          <Link
            href="/recipes/new"
            className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/[0.14] hover:text-white"
            data-testid="recipes-new-button"
          >
            <Plus className="h-3.5 w-3.5" />
            New recipe
          </Link>
        </div>
      }
    >
      {/* Stat row -------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={ChefHat}
          label="Total recipes"
          value={stats.total}
          delta={`${stats.published} published`}
          tone="purple"
        />
        <StatTile
          icon={FileText}
          label="Drafts"
          value={stats.drafts}
          delta="Awaiting review"
          tone="gold"
        />
        <StatTile
          icon={Utensils}
          label="By meal type (published)"
          value={`${stats.publishedByMealType.breakfast}/${stats.publishedByMealType.lunch}/${stats.publishedByMealType.dinner}/${stats.publishedByMealType.snack}`}
          delta="B / L / D / S"
          tone="blue"
        />
        <StatTile
          icon={Sparkles}
          label="AI-generated"
          value={(rows.filter((r) => r.source === "ai_generated").length).toString()}
          delta="In current view"
          tone="green"
        />
      </div>

      {/* Filters --------------------------------------------------------- */}
      <div className="mt-3">
        <GlassCard>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => {
              const active = tab.key === statusFilter;
              const url = new URLSearchParams();
              if (tab.key !== "all") url.set("status", tab.key);
              if (mealTypeFilter !== "all") url.set("meal_type", mealTypeFilter);
              if (sourceFilter !== "all") url.set("source", sourceFilter);
              if (query) url.set("q", query);
              const href = url.toString() ? `/recipes?${url.toString()}` : "/recipes";
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`glass-pill px-3 py-1.5 text-xs transition ${
                    active
                      ? "bg-white/[0.16] text-white"
                      : "text-white/65 hover:bg-white/[0.10] hover:text-white"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}

            <form action="/recipes" className="ml-auto flex items-center gap-2">
              {statusFilter !== "all" && (
                <input type="hidden" name="status" value={statusFilter} />
              )}
              <select
                name="meal_type"
                defaultValue={mealTypeFilter}
                className="glass-input h-9 w-32 text-xs"
              >
                <option value="all">All meal types</option>
                {MEAL_TYPES.map((m) => (
                  <option key={m} value={m}>
                    {m[0].toUpperCase() + m.slice(1)}
                  </option>
                ))}
              </select>
              <select
                name="source"
                defaultValue={sourceFilter}
                className="glass-input h-9 w-36 text-xs"
              >
                <option value="all">Any source</option>
                <option value="curated">Curated</option>
                <option value="ai_generated">AI-generated</option>
                <option value="imported">Imported</option>
              </select>
              <input
                name="q"
                defaultValue={query}
                placeholder="Search title"
                className="glass-input h-9 w-56"
              />
            </form>
          </div>
        </GlassCard>
      </div>

      <div className="mt-3">
        <DataTable<RecipeListSummary>
          columns={[
            {
              key: "title",
              header: "Title",
              render: (r) => (
                <Link
                  href={`/recipes/${r.id}`}
                  className="text-sm font-medium text-white hover:underline"
                >
                  {r.title}
                </Link>
              ),
            },
            {
              key: "meal_type",
              header: "Meal",
              render: (r) => (
                <Badge tone="outline">
                  {r.mealType[0].toUpperCase() + r.mealType.slice(1)}
                </Badge>
              ),
              width: "w-24",
            },
            {
              key: "diets",
              header: "Diets",
              render: (r) =>
                r.diets.length === 0 ? (
                  <span className="text-xs text-white/35">—</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {r.diets.slice(0, 3).map((d) => (
                      <Badge key={d} tone="outline">
                        {d}
                      </Badge>
                    ))}
                    {r.diets.length > 3 && (
                      <span className="text-xs text-white/55">
                        +{r.diets.length - 3}
                      </span>
                    )}
                  </div>
                ),
              width: "w-48",
            },
            {
              key: "calories",
              header: "kcal",
              render: (r) => (
                <span className="font-semibold text-white">{r.calories}</span>
              ),
              width: "w-20",
              align: "right",
            },
            {
              key: "cook_time",
              header: "Cook",
              render: (r) =>
                r.cookTimeMinutes ? (
                  <span className="inline-flex items-center gap-1 text-xs text-white/65">
                    <Clock className="h-3 w-3" />
                    {r.cookTimeMinutes}m
                  </span>
                ) : (
                  <span className="text-xs text-white/35">—</span>
                ),
              width: "w-20",
            },
            {
              key: "source",
              header: "Source",
              render: (r) => (
                <Badge tone={sourceTone(r.source)}>
                  {r.source === "ai_generated" ? "AI" : r.source}
                </Badge>
              ),
              width: "w-24",
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge>,
              width: "w-28",
            },
            {
              key: "created",
              header: "Created",
              render: (r) => (
                <span className="text-xs text-white/65">
                  {relativeFromNow(r.createdAt)}
                </span>
              ),
              width: "w-32",
            },
          ]}
          rows={rows}
          emptyState={
            <GlassCard className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.08]">
                <Inbox className="h-6 w-6 text-white/70" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">
                No recipes match
              </p>
              <p className="text-xs text-white/55">
                Hit{" "}
                <Link href="/recipes/new" className="text-accent-blue hover:underline">
                  New recipe
                </Link>{" "}
                to add the first one.
              </p>
            </GlassCard>
          }
        />
      </div>
    </PageShell>
  );
}
