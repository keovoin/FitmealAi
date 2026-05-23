"use client";

import { AIGeneratePanel } from "@/components/recipes/ai-generate-panel";
import type { RecipeWriteInput } from "@/lib/supabase/recipes-shared";
import { useState } from "react";
import { RecipeForm } from "../recipe-form";

/**
 * Client-side wrapper around <RecipeForm /> that adds the AI generate
 * panel above it. Lives here (instead of in `page.tsx`) because the
 * panel is interactive and the page itself is a server component.
 *
 * The shell holds the `prefill` draft so the AI panel and the form
 * stay decoupled: the panel emits a fresh `RecipeWriteInput`, the
 * shell hands it to the form, and the form resets its internal state
 * via a useEffect on the prefill identity.
 */
export function NewRecipeShell() {
  const [prefill, setPrefill] = useState<RecipeWriteInput | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <AIGeneratePanel
        onGenerated={(recipe, w) => {
          setPrefill(recipe);
          setWarnings(w);
        }}
      />
      {warnings.length > 0 && (
        <ul className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
          {warnings.map((w, i) => (
            <li key={i}>⚠ {w}</li>
          ))}
        </ul>
      )}
      <RecipeForm existing={null} prefill={prefill} />
    </div>
  );
}
