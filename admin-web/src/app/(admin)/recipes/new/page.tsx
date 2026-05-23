import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { NewRecipeShell } from "./new-recipe-shell";
import { ChevronLeft, Upload } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewRecipePage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="New recipe">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="New recipe"
      subtitle="Drafts are private until you publish them."
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/recipes/bulk-upload"
            className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.14] hover:text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            Bulk upload JSON
          </Link>
          <Link
            href="/recipes"
            className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.14] hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to recipes
          </Link>
        </div>
      }
    >
      <GlassCard>
        <NewRecipeShell />
      </GlassCard>
    </PageShell>
  );
}
