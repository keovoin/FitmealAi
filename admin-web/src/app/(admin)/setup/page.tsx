import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/layout/page-shell";
import { isAIConfigured } from "@/lib/ai/openai";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  probeRequiredTables,
  REQUIRED_TABLES_LIST,
} from "@/lib/supabase/setup-check";
import { getProviderConfigSnapshot } from "@/lib/payments/factory";
import { Check, X, AlertTriangle, Database, CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SetupHealthPage() {
  const supabaseConfigured = isSupabaseConfigured();
  const aiConfigured = isAIConfigured();
  const adminPasswordOk =
    !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8;
  const sessionSecretOk =
    !!process.env.ADMIN_SESSION_SECRET &&
    process.env.ADMIN_SESSION_SECRET.length >= 32;

  let report = supabaseConfigured ? await probeRequiredTables() : null;

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
            <EnvRow name="ADMIN_PASSWORD" ok={adminPasswordOk} required />
            <EnvRow
              name="ADMIN_SESSION_SECRET"
              ok={sessionSecretOk}
              required
              detail="At least 32 characters. Stable sessions on Vercel."
            />
            <EnvRow
              name="NEXT_PUBLIC_SUPABASE_URL"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_URL}
              required
            />
            <EnvRow
              name="SUPABASE_SERVICE_ROLE_KEY"
              ok={!!process.env.SUPABASE_SERVICE_ROLE_KEY}
              required
            />
            <EnvRow
              name="NEXT_PUBLIC_SUPABASE_ANON_KEY"
              ok={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}
              detail="Used by the iOS Info.plist export and mobile-config endpoint."
            />
            <EnvRow
              name="OPENAI_API_KEY"
              ok={aiConfigured}
              detail="Required for /api/ai/meal-plan."
            />
            <EnvRow
              name="OPENAI_DAILY_BUDGET_USD"
              ok={!!process.env.OPENAI_DAILY_BUDGET_USD}
              detail="Optional cap; defaults to $5/day."
            />
            <EnvRow
              name="NEXT_PUBLIC_APP_URL"
              ok={!!process.env.NEXT_PUBLIC_APP_URL}
              detail="Used by the iOS app to find /api/ai endpoints."
            />
            <EnvRow
              name="PAYMENT_PROVIDER_DEFAULT"
              ok={!!process.env.PAYMENT_PROVIDER_DEFAULT}
              detail="bakong_khqr | aba_payway | camrapidpay (default: bakong_khqr)."
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
                    {report.errored.length} other error{report.errored.length === 1 ? "" : "s"}
                  </Badge>
                )}
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
                      Paste each file from{" "}
                      <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">
                        supabase/migrations/0001_extensions_and_enums.sql
                      </code>{" "}
                      through{" "}
                      <code className="rounded bg-black/30 px-1 py-0.5 text-[11px]">
                        0011_seed_admin_demo_data.sql
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
            <IntegrationTile name="Supabase" ok={supabaseConfigured} />
            <IntegrationTile name="OpenAI" ok={aiConfigured} />
            <IntegrationTile name="Admin auth" ok={adminPasswordOk && sessionSecretOk} />
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/50">
                Payment providers
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                KHQR &amp; subscription gateways
              </p>
            </div>
            <CreditCard className="h-5 w-5 text-accent-blue" />
          </div>
          <p className="mt-1 text-sm text-white/65">
            Active provider is selected by{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">PAYMENT_PROVIDER_DEFAULT</code>
            {" "}env, or per-request via the{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">provider</code> field on
            {" "}
            <code className="rounded bg-white/10 px-1 py-0.5 text-xs">/api/payments/create-khqr</code>.
          </p>
          <ul className="mt-3 space-y-2">
            {getProviderConfigSnapshot().map((p) => (
              <li
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[12px] text-white/85">{p.id}</p>
                  <p className="text-xs text-white/55">{p.description}</p>
                </div>
                <Badge tone={p.configured ? "green" : "outline"}>
                  {p.configured ? "Configured" : "Missing env"}
                </Badge>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function EnvRow({
  name,
  ok,
  required,
  detail,
}: {
  name: string;
  ok: boolean;
  required?: boolean;
  detail?: string;
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
      <div className="min-w-0">
        <code className="text-[12px] text-white/90 break-all">{name}</code>
        {required && !ok && (
          <span className="ml-1.5 text-[10px] uppercase tracking-wider text-red-300">
            required
          </span>
        )}
        {detail && (
          <p className="text-[11px] text-white/55">{detail}</p>
        )}
      </div>
    </li>
  );
}

function IntegrationTile({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
        ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
          : "border-amber-500/30 bg-amber-500/10 text-amber-100"
      }`}
    >
      <p className="text-sm font-semibold">{name}</p>
      {ok ? (
        <Badge tone="green">Ready</Badge>
      ) : (
        <Badge tone="gold">Not configured</Badge>
      )}
    </div>
  );
}
