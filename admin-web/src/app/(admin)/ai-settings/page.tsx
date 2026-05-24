import { ConfigureSupabaseBanner } from "@/components/ui/configure-supabase-banner";
import { GlassCard } from "@/components/ui/glass-card";
import { PageShell } from "@/components/layout/page-shell";
import {
  getProviderEnvStatus,
  type ProviderEnvStatus,
} from "@/lib/ai/openai";
import { getAIProviderSettings } from "@/lib/supabase/ai-provider";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { Cpu, Sparkles } from "lucide-react";
import { AIProviderForm } from "./ai-provider-form";

export const dynamic = "force-dynamic";

export default async function AIProviderSettingsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageShell title="AI provider">
        <ConfigureSupabaseBanner />
      </PageShell>
    );
  }

  const settings = await getAIProviderSettings();
  const envStatus: ProviderEnvStatus = getProviderEnvStatus();

  return (
    <PageShell
      title="AI provider"
      subtitle="Choose where AI meal-plan and recipe generation calls go."
    >
      <GlassCard>
        <div className="flex items-start gap-3">
          <Cpu className="h-6 w-6 flex-shrink-0 text-accent-purple" />
          <div>
            <p className="text-xs uppercase tracking-wider text-white/50">
              How this works
            </p>
            <p className="mt-1 text-sm text-white/70">
              Three providers are supported. <Sparkles className="inline h-3.5 w-3.5 align-text-bottom text-accent-purple" /> <b className="text-white">OpenAI</b> hits the OpenAI cloud (<code className="rounded bg-white/10 px-1 text-[11px]">OPENAI_*</code> env vars). <b className="text-white">Kiro AI</b> hits the Kiro AI gateway (<code className="rounded bg-white/10 px-1 text-[11px]">KIRO_AI_*</code> env vars). <b className="text-white">Custom</b> hits any OpenAI-compatible endpoint (vLLM, Anyscale, Together, your own self-hosted build) configured through the <code className="rounded bg-white/10 px-1 text-[11px]">CUSTOM_AI_*</code> env vars. When the active provider doesn&apos;t support image generation, it will automatically fall back to OpenAI for hero images if <code className="rounded bg-white/10 px-1 text-[11px]">OPENAI_API_KEY</code> is set.
            </p>
            <p className="mt-2 text-xs text-white/55">
              Switching is instant. The choice is stored in <code className="rounded bg-white/10 px-1 text-[10px]">app_settings.ai_provider.text</code> and re-read on every AI call. The actual API key + base URL stay in Vercel env vars and never round-trip to the browser.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="mt-3">
        <GlassCard>
          <AIProviderForm initial={settings} envStatus={envStatus} />
        </GlassCard>
      </div>
    </PageShell>
  );
}
