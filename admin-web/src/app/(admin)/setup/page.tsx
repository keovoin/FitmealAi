import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import { DocLink } from "@/components/ui/doc-link";
import { isAIConfigured } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  probeRequiredTables,
  REQUIRED_TABLES_LIST,
} from "@/lib/supabase/setup-check";
import {
  AlertTriangle,
  Banknote,
  Check,
  Database,
  X,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SetupHealthPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const aiConfigured = isAIConfigured();
  const adminPasswordOk =
    !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8;
  const sessionSecretOk =
    !!process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.length >= 32;

  const report = supabaseConfigured ? await probeRequiredTables() : null;

  return (
    <PageShell
      title="Setup health check"
      subtitle="One-time configuration audit. Use this if something looks broken."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Environment variables
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Vercel project env
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <EnvRow
              name="ADMIN_PASSWORD"
              ok={adminPasswordOk}
              required
              docs={ENV_DOCS.ADMIN_PASSWORD}
            />
            <EnvRow
              name="ADMIN_SESSION_SECRET"
              ok={sessionSecretOk}
              required
              detail="At least 32 characters. Stable sessions on Vercel."
              docs={ENV_DOCS.ADMIN_SESSION_SECRET}
            />
            <EnvRow
              name="NEXT_PUBLIC_SUPABASE_URL"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              required
              docs={ENV_DOCS.SUPABASE_URL}
            />
            <EnvRow
              name="SUPABASE_SERVICE_ROLE_KEY"
              ok={!!process.env.SUPABASE_SERVICE_ROLE_KEY}
              required
              docs={ENV_DOCS.SUPABASE_SERVICE_KEY}
            />
            <EnvRow
              name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
              detail="Used by the iOS Info.plist export and mobile-config endpoint."
              docs={ENV_DOCS.SUPABASE_ANON_KEY}
            />
            <EnvRow
              name="OPENAI_API_KEY"
              ok={aiConfigured}
              detail="Required for /api/ai/meal-plan."
              docs={ENV_DOCS.OPENAI_API_KEY}
            />
            <EnvRow
              name="OPENAI_DAILY_BUDGET_USD"
              ok={!!process.env.OPENAI_DAILY_BUDGET_USD}
              detail="Optional cap; defaults to $5/day."
              docs={ENV_DOCS.OPENAI_BUDGET}
            />
            <EnvRow
              name="NEXT_PUBLIC_APP_URL"
              ok={!!process.env.NEXT_PUBLIC_APP_URL}
              detail="Used by the iOS app to find /api/ai endpoints."
              docs={ENV_DOCS.APP_URL}
            />
          </ul>
        </GlassCard>

        <GlassCard>
          <p className="text-xs uppercase tracking-wider text-white/50">
            Database schema
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            Supabase tables
          </p>
          {!supabaseConfigured && (
            <p className="mt-2 text-sm text-white/60">
              Set the Supabase env vars first. Then reload this page.
            </p>
          )}
          {supabaseConfigured && report && (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={report.hasMissing ? "gold" : "green"}>
                  {report.hasMissing
                    ? `${report.missing.length} of ${REQUIRED_TABLES_LIST.length} tables missing`
                    : `All ${REQUIRED_TABLES_LIST.length} tables present`}
                </Badge>
                {report.errored.length > 0 && (
                  <Badge tone="red">
                    {report.errored.length} other error
                    {report.errored.length === 1 ? "" : "s"}
                  </Badge>
                )}
                <DocLink
                  href="https://app.supabase.com/project/_/sql/new"
                  label="Open SQL editor"
                />
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
                {REQUIRED_TABLES_LIST.map((t) => {
                  const isMissing = report.missing.includes(t);
                  const isErrored = report.errored.find((e) => e.table === t);
                  const isOk = report.ready.includes(t);
                  return (
                    <li
                      key={t}
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5"
                    >
                      {isOk && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                      {isMissing && <X className="h-3.5 w-3.5 text-red-400" />}
                      {isErrored && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      <code className="text-xs text-white/85">{t}</code>
                      {isErrored && (
                        <span className="ml-auto text-[10px] text-amber-300/70">
                          {isErrored.message.slice(0, 28)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              {report.hasMissing && (
                <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                  <p className="flex items-center gap-2 font-semibold">
                    <Database className="h-4 w-4" /> Run the SQL migrations
                  </p>
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-[13px]">
                    <li>
                      Open{" "}
                      <a
                        href="https://app.supabase.com/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent-blue hover:underline"
                      >
                        app.supabase.com
                      </a>{" "}
                      -&gt; your project -&gt; <b>SQL Editor</b>.
                    </li>
                    <li>
                      Paste each file from{" "}
                      <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">
                        supabase/migrations/0001_extensions_and_enums.sql
                      </code>{" "}
                      through{" "}
                      <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">
                        0015_notification_templates.sql
                      </code>
                      , in order.
                    </li>
                    <li>Reload this page to verify everything is green.</li>
                  </ol>
                </div>
              )}

              {report.errored.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-100">
                  <p className="font-semibold">Other table errors</p>
                  <ul className="mt-1 space-y-1 font-mono break-all">
                    {report.errored.map((e) => (
                      <li key={e.table}>
                        <b>{e.table}</b>: {e.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <p className="text-xs uppercase tracking-wider text-white/50">
            Integrations
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <IntegrationTile
              name="Supabase"
              ok={supabaseConfigured}
              docHref="https://app.supabase.com/"
              docLabel="Dashboard"
            />
            <IntegrationTile
              name="OpenAI"
              ok={aiConfigured}
              docHref="https://platform.openai.com/api-keys"
              docLabel="API keys"
            />
            <IntegrationTile
              name="Admin auth"
              ok={adminPasswordOk && sessionSecretOk}
              docHref="https://vercel.com/docs/projects/environment-variables"
              docLabel="Vercel env vars"
            />
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Payment options
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                ABA + StoreKit + Play Billing
              </p>
            </div>
            <Link
              href="/payment-settings"
              className="glass-pill inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/[0.14] hover:text-white"
            >
              <Banknote className="h-3.5 w-3.5" />
              Open payment settings
            </Link>
          </div>
          <p className="mt-1 text-sm text-white/65">
            Manual ABA receipts + Apple StoreKit 2 + Google Play Billing are
            wired in. Toggle the manual ABA flow on/off and restrict it to
            specific countries (Cambodia by default) from the Payment
            settings page.
          </p>
        </GlassCard>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EnvRow({
  name,
  ok,
  required,
  detail,
  docs,
}: {
  name: string;
  ok: boolean;
  required?: boolean;
  detail?: string;
  docs?: { href: string; label: string };
}) {
  return (
    <li className="flex items-start gap-2">
      {ok ? (
        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
      ) : required ? (
        <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <code className="text-[12px] text-white/90 break-all">{name}</code>
          {required && !ok && (
            <span className="text-[10px] uppercase tracking-wider text-red-300">
              required
            </span>
          )}
          {docs && <DocLink href={docs.href} label={docs.label} inline />}
        </div>
        {detail && <p className="mt-0.5 text-[11px] text-white/55">{detail}</p>}
      </div>
    </li>
  );
}

function IntegrationTile({
  name,
  ok,
  docHref,
  docLabel,
}: {
  name: string;
  ok: boolean;
  docHref?: string;
  docLabel?: string;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-amber-500/30 bg-amber-500/10 text-amber-100"
      }`}
    >
      <p className="text-sm font-semibold">{name}</p>
      <div className="flex items-center gap-2">
        {ok ? (
          <Badge tone="green">Ready</Badge>
        ) : (
          <Badge tone="gold">Not configured</Badge>
        )}
        {docHref && docLabel && <DocLink href={docHref} label={docLabel} inline />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Doc link directory.
// ---------------------------------------------------------------------------

const ENV_DOCS = {
  ADMIN_PASSWORD: {
    href: "https://vercel.com/docs/projects/environment-variables",
    label: "Vercel env vars",
  },
  ADMIN_SESSION_SECRET: {
    href: "https://generate-secret.vercel.app/32",
    label: "Generate 32-byte secret",
  },
  SUPABASE_URL: {
    href: "https://app.supabase.com/project/_/settings/api",
    label: "Supabase API settings",
  },
  SUPABASE_SERVICE_KEY: {
    href: "https://app.supabase.com/project/_/settings/api",
    label: "Get service-role key",
  },
  SUPABASE_ANON_KEY: {
    href: "https://app.supabase.com/project/_/settings/api",
    label: "Get anon key",
  },
  OPENAI_API_KEY: {
    href: "https://platform.openai.com/api-keys",
    label: "OpenAI keys",
  },
  OPENAI_BUDGET: {
    href: "https://platform.openai.com/usage",
    label: "Usage dashboard",
  },
  APP_URL: {
    href: "https://vercel.com/docs/projects/domains",
    label: "Vercel domains",
  },
} as const;
