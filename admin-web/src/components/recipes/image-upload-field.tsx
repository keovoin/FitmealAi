"use client";

import { uploadRecipeImageAction } from "@/lib/supabase/admin-actions";
import { ImageOff, Loader2, Upload, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";

/**
 * Drop-in image picker for the recipe form.
 *
 *   ┌────────────────────────────────────────┐
 *   │ [preview thumb]  Replace | Remove      │
 *   │  Hero image                            │
 *   └────────────────────────────────────────┘
 *   ────── or paste a URL ──────────────────
 *   [ https://… ]
 *
 * The "paste URL" input stays as a fallback so curated recipes that
 * already point at external CDN URLs keep working without re-uploading.
 *
 * On upload, the file is sent to `uploadRecipeImageAction` (a server
 * action that pushes to the public `recipe-images` bucket) and the
 * resulting URL is propagated back via `onChange`.
 */
export function ImageUploadField({
  label,
  value,
  onChange,
  slugHint,
  testIdPrefix,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** Filename hint, e.g. the recipe's slug. */
  slugHint?: string;
  testIdPrefix?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasImage = value.trim().length > 0;

  function pickFile() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  function onFile(file: File) {
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    if (slugHint?.trim()) {
      formData.append("slug", slugHint.trim());
    }
    startTransition(async () => {
      const res = await uploadRecipeImageAction(formData);
      if (res.ok) {
        onChange(res.url);
      } else {
        setUploadError(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-white/60">{label}</p>

      <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
        {/* Preview ------------------------------------------------ */}
        <div
          className="relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-white/[0.04]"
          data-testid={`${testIdPrefix}-preview`}
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin text-white/55" />
          ) : hasImage ? (
            // We don't know if the URL is from our own CDN or an external
            // host; <Image> requires a remotePatterns config for arbitrary
            // hosts, so use a plain <img> which is fine for an admin tool.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Recipe preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <ImageOff className="h-5 w-5 text-white/35" />
          )}
        </div>

        {/* Buttons ------------------------------------------------ */}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={pickFile}
              disabled={pending}
              className="glass-pill inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-white/85 hover:bg-white/[0.14] hover:text-white disabled:opacity-50"
              data-testid={`${testIdPrefix}-upload-button`}
            >
              {pending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {hasImage ? "Replace" : "Upload image"}
            </button>
            {hasImage && (
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-white/55 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              // Reset so picking the same file again triggers onChange.
              e.target.value = "";
            }}
            data-testid={`${testIdPrefix}-file-input`}
          />

          {uploadError && (
            <p className="text-[11px] text-red-300">{uploadError}</p>
          )}
          {!uploadError && hasImage && (
            <p className="break-all font-mono text-[10px] text-white/40">
              {value}
            </p>
          )}
        </div>
      </div>

      {/* Fallback: paste a URL --------------------------------- */}
      <details className="text-[11px] text-white/45">
        <summary className="cursor-pointer hover:text-white/65">
          or paste a URL
        </summary>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…/recipe.jpg"
          className="glass-input mt-1 h-8 w-full text-xs"
          data-testid={`${testIdPrefix}-url-input`}
        />
      </details>
    </div>
  );
}
