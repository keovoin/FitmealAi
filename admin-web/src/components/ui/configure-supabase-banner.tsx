import { Database } from "lucide-react";

/**
 * Friendly empty state shown when Supabase env vars are missing.
 * Tells the user exactly what to set in Vercel.
 */
export function ConfigureSupabaseBanner() {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-purple/30">
        <Database className="h-6 w-6 text-accent-purple" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">
          Supabase isn&apos;t configured yet
        </p>
        <p className="max-w-sm text-sm text-white/60">
          Set <code className="rounded bg-white/10 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
          {" "}and{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
          {" "}in Vercel env vars and redeploy.
        </p>
      </div>
    </div>
  );
}
