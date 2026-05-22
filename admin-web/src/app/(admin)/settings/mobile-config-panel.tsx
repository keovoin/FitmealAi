"use client";

import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";

export function MobileConfigPanel({
  initialSupabaseUrl,
  initialAPIBaseUrl,
}: {
  initialSupabaseUrl: string;
  initialAPIBaseUrl: string;
}) {
  const [supabaseUrl, setSupabaseUrl] = useState(initialSupabaseUrl);
  const [anonKey, setAnonKey] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(initialAPIBaseUrl);
  const [googleIOSClientID, setGoogleIOSClientID] = useState("");
  const [googleReversedClientID, setGoogleReversedClientID] = useState("");
  const [googleServerClientID, setGoogleServerClientID] = useState("");
  const [copied, setCopied] = useState(false);

  const plistSnippet = useMemo(
    () => `<key>FITMEAL_SUPABASE_URL</key>\n<string>${supabaseUrl}</string>\n<key>FITMEAL_SUPABASE_ANON_KEY</key>\n<string>${anonKey}</string>\n<key>FITMEAL_API_BASE_URL</key>\n<string>${apiBaseUrl}</string>\n<key>FITMEAL_GOOGLE_IOS_CLIENT_ID</key>\n<string>${googleIOSClientID}</string>\n<key>FITMEAL_GOOGLE_REVERSED_CLIENT_ID</key>\n<string>${googleReversedClientID}</string>\n<key>FITMEAL_GOOGLE_SERVER_CLIENT_ID</key>\n<string>${googleServerClientID}</string>`,
    [anonKey, apiBaseUrl, googleIOSClientID, googleReversedClientID, googleServerClientID, supabaseUrl],
  );

  async function copySnippet() {
    await navigator.clipboard.writeText(plistSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div data-testid="mobile-config-panel" className="mt-4 space-y-3">
      <div className="grid grid-cols-1 gap-2">
        <label className="space-y-1 text-xs text-white/60">
          <span>Supabase URL</span>
          <input
            data-testid="mobile-config-supabase-url-input"
            value={supabaseUrl}
            onChange={(event) => setSupabaseUrl(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="https://your-project-ref.supabase.co"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Supabase anon key</span>
          <input
            data-testid="mobile-config-anon-key-input"
            value={anonKey}
            onChange={(event) => setAnonKey(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="Paste public anon key here when generating Xcode config"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>API base URL</span>
          <input
            data-testid="mobile-config-api-url-input"
            value={apiBaseUrl}
            onChange={(event) => setApiBaseUrl(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="https://your-admin-domain.vercel.app"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Google iOS Client ID</span>
          <input
            data-testid="mobile-config-google-ios-client-id-input"
            value={googleIOSClientID}
            onChange={(event) => setGoogleIOSClientID(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="your-ios-client-id.apps.googleusercontent.com"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Google reversed client ID</span>
          <input
            data-testid="mobile-config-google-reversed-client-id-input"
            value={googleReversedClientID}
            onChange={(event) => setGoogleReversedClientID(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="com.googleusercontent.apps.your-ios-client-id"
          />
        </label>
        <label className="space-y-1 text-xs text-white/60">
          <span>Google server client ID</span>
          <input
            data-testid="mobile-config-google-server-client-id-input"
            value={googleServerClientID}
            onChange={(event) => setGoogleServerClientID(event.target.value)}
            className="glass-input h-10 text-xs"
            placeholder="your-web-client-id.apps.googleusercontent.com"
          />
        </label>
      </div>

      <pre
        data-testid="mobile-config-plist-snippet"
        className="max-h-44 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] leading-5 text-white/70"
      >
        {plistSnippet}
      </pre>

      <Button
        data-testid="mobile-config-copy-button"
        type="button"
        variant="secondary"
        size="sm"
        onClick={copySnippet}
      >
        {copied ? "Copied" : "Copy Xcode config"}
      </Button>
    </div>
  );
}