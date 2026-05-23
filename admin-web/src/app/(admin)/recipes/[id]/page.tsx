import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { SetupRequiredBanner } from "@/components/ui/setup-required-banner";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { classifySupabaseError } from "@/lib/supabase/setup-check";
import { getRecipeById } from "@/lib/supabase/recipes-queries";
import { formatDateTime } from "@/lib/format";
import { RecipeForm } from "../recipe-form";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Recipe">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  let recipe;
  try {
    recipe = await getRecipeById(id);
  } catch (error) {
    const hint = classifySupabaseError(error);
    return (
      <PageShell title="Recipe">
        {hint.isMissingTable ? (
          <SetupRequiredBanner page="The recipe editor" rawMessage={hint.rawMessage} />
        ) : (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Unable to load recipe</p>
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

  if (!recipe) notFound();

  return (
    <PageShell
      title={recipe.title}
      subtitle={`Slug: ${recipe.slug}`}
      actions={
        <Link
          href="/recipes"
          className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.14] hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to recipes
        </Link>
      }
    >
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
          <Badge tone={recipe.status === "published" ? "green" : recipe.status === "draft" ? "gold" : "outline"}>
            {recipe.status}
          </Badge>
          <span>Source: {recipe.source}</span>
          <span>Created: {formatDateTime(recipe.createdAt)}</span>
          {recipe.approvedAt && (
            <span>Published: {formatDateTime(recipe.approvedAt)}</span>
          )}
        </div>
        <RecipeForm existing={recipe} />
      </GlassCard>
    </PageShell>
  );
}
