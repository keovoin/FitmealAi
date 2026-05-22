import { AlertTriangle, Database } from "lucide-react";
import Link from "next/link";

/**
 * Shown on every admin page when a query failed because the Supabase
 * tables haven't been created yet. Replaces the generic Next.js
 * "Application error" page with something a non-engineer can act on.
 */
export function SetupRequiredBanner({
  rawMessage,
  page = "this page",
  showInstructions = true,
}: {
  rawMessage?: string;
  page?: string;
  showInstructions?: boolean;
}) {
  return (
    <div className="glass-card flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-white">
            Database tables aren&apos;t set up yet
          </p>
          <p className="mt-1 text-sm text-white/70">
            {page} couldn&apos;t load because the Supabase schema is missing.
            Run the SQL migrations once and reload.
          </p>
        </div>
      </div>

      {showInstructions && (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/75">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Database className="h-4 w-4 text-accent-purple" />
            One-time setup (about 2 minutes)
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed">
            <li>
              Open your Supabase project
              {" "}
              <a
                href="https://app.supabase.com/"
                target="_blank"
                rel="noreferrer"
                className="text-accent-blue hover:underline"
              >
                Dashboard
              </a>
              {" "}-&gt; <b>SQL Editor</b> -&gt; <b>New query</b>.
            </li>
            <li>
              Copy each file from{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                supabase/migrations/0001_*.sql
              </code>{" "}
              through{" "}
              <code className="rounded bg-white/10 px-1 py-0.5 text-[11px]">
                0013_*.sql
              </code>{" "}
              and run them in order.
            </li>
            <li>
              Reload this page. The dashboard, payments, users and
              subscriptions screens will start showing live data.
            </li>
          </ol>
          <p className="mt-3 text-xs text-white/55">
            Each migration is idempotent, so re-running them is safe.
          </p>
          <p className="mt-2 text-xs">
            <Link href="/setup" className="text-accent-blue hover:underline">
              Run a setup health check &rarr;
            </Link>
          </p>
        </div>
      )}

      {rawMessage && (
        <details className="rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/55">
          <summary className="cursor-pointer text-white/70">
            Technical details
          </summary>
          <pre className="mt-2 whitespace-pre-wrap break-all font-mono">
            {rawMessage}
          </pre>
        </details>
      )}
    </div>
  );
}
