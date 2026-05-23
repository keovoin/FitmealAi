import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { BulkUploadShell } from "./bulk-upload-shell";

export const dynamic = "force-dynamic";

export default function BulkUploadRecipesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="Bulk upload recipes">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Bulk upload recipes"
      subtitle="Paste or drop a JSON file containing an array of recipe objects. Valid rows are inserted as drafts."
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
        <BulkUploadShell />
      </GlassCard>
    </PageShell>
  );
}
