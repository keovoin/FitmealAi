import "server-only";

/**
 * Resolves a request's ISO-3166-1 alpha-2 country code from the standard
 * platform headers, in priority order:
 *
 *  1. `x-vercel-ip-country`         (Vercel Edge / Serverless infrastructure)
 *  2. `cf-ipcountry`                (Cloudflare in front of Vercel)
 *  3. `x-country`                   (custom proxies)
 *  4. `accept-language` first tag   (best-effort fallback for local dev only)
 *
 * Returns `null` when nothing matches — callers fall back to the
 * "unknown country" code path (e.g. hide a region-locked feature).
 */
export function resolveCountryCode(
  headers: Headers | Record<string, string | undefined>,
): string | null {
  const get = (name: string): string | undefined => {
    if (headers instanceof Headers) return headers.get(name) ?? undefined;
    return headers[name] ?? headers[name.toLowerCase()];
  };

  const candidates = [
    get("x-vercel-ip-country"),
    get("cf-ipcountry"),
    get("x-country"),
  ].filter((value): value is string => typeof value === "string");

  for (const raw of candidates) {
    const cc = raw.trim().toUpperCase();
    // Vercel returns "XX" when geo-IP fails — treat as unknown.
    if (/^[A-Z]{2}$/.test(cc) && cc !== "XX") {
      return cc;
    }
  }

  // Best-effort: pull the country tag out of an Accept-Language header
  // like `km-KH,en-US;q=0.7`. Useful for local dev where there's no edge
  // header, but never authoritative.
  const accept = get("accept-language");
  if (accept) {
    const match = accept.match(/[a-z]{2,3}-([A-Z]{2})/);
    if (match) return match[1].toUpperCase();
  }

  // Local dev override: a comma-separated `DEV_FORCE_COUNTRY=KH` env makes
  // every request appear to come from KH so testing the geo-lock is easy.
  const forced = process.env.DEV_FORCE_COUNTRY;
  if (forced && /^[A-Z]{2}$/i.test(forced)) {
    return forced.toUpperCase();
  }

  return null;
}
