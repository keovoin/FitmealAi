"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Database, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Per-route-group error boundary. Replaces the Next.js default
 * "Application error: a server-side exception has occurred" with a
 * friendly screen that actually tells you what to check.
 *
 * The most common cause in this admin is "the Supabase migrations
 * haven't been run yet", so we surface that hint up front.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the full error in the browser console for engineers.
    // The user-facing message stays friendly above.
    console.error("[admin] route-level error:", error);
  }, [error]);

  const message = error.message || "Unknown error";
  const looksLikeMissingTables =
    /relation .* does not exist|42P01|could not find the table|schema cache/i.test(
      message,
    );
  const looksLikeMissingEnv =
    /SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL|OPENAI_API_KEY|ADMIN_PASSWORD/i.test(
      message,
    );

  return (
    <main className="flex min-h-screen items-start justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <GlassCard>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold text-white">
                Something went wrong loading this page
              </p>
              <p className="mt-1 text-sm text-white/70">
                {looksLikeMissingTables
                  ? "Supabase responded but the required tables don't exist yet. Run the migrations and reload."
                  : looksLikeMissingEnv
                    ? "An environment variable is missing in Vercel. Add it under Project -> Settings -> Environment Variables and redeploy."
                    : "The server hit an unexpected error. Try again, or check the deployment logs in Vercel."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={reset} leftIcon={<RefreshCcw className="h-3.5 w-3.5" />}>
              Try again
            </Button>
            {looksLikeMissingTables && (
              <Link
                href="/setup"
                className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
              >
                <Database className="h-3.5 w-3.5" />
                Run setup check
              </Link>
            )}
            <Link
              href="/settings"
              className="glass-pill flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
            >
              View admin settings
            </Link>
          </div>
        </GlassCard>

        {looksLikeMissingTables && (
          <GlassCard>
            <p className="text-xs uppercase tracking-wider text-white/50">
              How to fix
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              Apply the SQL migrations once
            </p>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-white/75">
              <li>
                Open
                {" "}
                <a
                  href="https://app.supabase.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  app.supabase.com
                </a>
                {" "}-&gt; your project -&gt; <b>SQL Editor</b>.
              </li>
              <li>
                Run each file in{" "}
                <code className="rounded bg-white/10 px-1 py-0.5 text-xs">
                  supabase/migrations/
                </code>{" "}
                from <code>0001</code> through <code>0013</code> in order.
              </li>
              <li>Click "Try again" above.</li>
            </ol>
          </GlassCard>
        )}

        <details className="glass-card p-4 text-[11px] text-white/55">
          <summary className="cursor-pointer text-white/70">
            Technical details
          </summary>
          <p className="mt-2 font-mono break-all">{message}</p>
          {error.digest && (
            <p className="mt-2 text-white/40">digest: {error.digest}</p>
          )}
        </details>
      </div>
    </main>
  );
}
