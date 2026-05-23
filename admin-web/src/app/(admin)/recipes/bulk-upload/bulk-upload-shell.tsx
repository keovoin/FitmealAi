"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BULK_RECIPES_SAMPLE,
  parseBulkRecipesJson,
  type BulkParseReport,
} from "@/lib/recipes/bulk-import";
import {
  BULK_RECIPES_CSV_TEMPLATE,
  spreadsheetFileToRecipesJson,
} from "@/lib/recipes/spreadsheet-import";
import { bulkUploadRecipesAction } from "@/lib/supabase/admin-actions";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";

/**
 * Bulk-upload UI for recipes. Accepts JSON (array of rows or
 * `{recipes: [...]}`), CSV, or Excel `.xlsx` / `.xls`.
 *
 * Excel/CSV path: the file is parsed in the browser (SheetJS) into the
 * same row shape `parseBulkRecipesJson` already understands — that
 * keeps the server action unchanged and means Excel mistakes (missing
 * columns, wrong meal type) are reported in the same UI as JSON
 * mistakes.
 *
 * Workflow:
 *   1. Admin pastes JSON or picks a `.json` / `.csv` / `.xlsx` file.
 *   2. Client-side validation runs immediately and renders a
 *      preview: N parseable rows + per-row error messages.
 *   3. Admin clicks "Insert N drafts" — the server action calls
 *      `upsertRecipe` for each valid row.
 *   4. Result table shows successes vs. failures.
 */
export function BulkUploadShell() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState("");
  const [pickedFileName, setPickedFileName] = useState<string | null>(null);
  const [pickedFileError, setPickedFileError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [insertResult, setInsertResult] = useState<
    | {
        total: number;
        inserted: number;
        failed: { index: number; error: string }[];
        fileErrors: string[];
      }
    | null
  >(null);

  // Re-validate on every text change so the preview stays in sync.
  const report: BulkParseReport | null = useMemo(() => {
    if (text.trim().length === 0) return null;
    return parseBulkRecipesJson(text);
  }, [text]);

  function pickFile() {
    fileInputRef.current?.click();
  }

  async function readFile(file: File) {
    setPickedFileError(null);
    setPickedFileName(file.name);
    setInsertResult(null);
    const lower = file.name.toLowerCase();
    try {
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv")) {
        // Spreadsheet path: parse client-side into the same JSON row
        // shape the JSON path produces, then drop into the textarea
        // so the admin can still review and tweak before uploading.
        const json = await spreadsheetFileToRecipesJson(file);
        setText(prettyPrint(json));
      } else {
        // Plain text / JSON path.
        const t = await file.text();
        setText(t);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPickedFileError(`Could not parse ${file.name}: ${msg}`);
      setText("");
    }
  }

  function loadSample() {
    setText(BULK_RECIPES_SAMPLE);
    setPickedFileName(null);
    setPickedFileError(null);
    setInsertResult(null);
  }

  function downloadTemplate() {
    const blob = new Blob([BULK_RECIPES_CSV_TEMPLATE], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fitmeal-recipes-template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function clear() {
    setText("");
    setPickedFileName(null);
    setPickedFileError(null);
    setInsertResult(null);
  }

  function insertAll() {
    if (!report || report.validRows.length === 0) return;
    setInsertResult(null);
    startTransition(async () => {
      const res = await bulkUploadRecipesAction({ payload: text });
      if (res.ok) {
        setInsertResult({
          total: res.total,
          inserted: res.inserted,
          failed: res.failed,
          fileErrors: res.fileErrors,
        });
      } else {
        setInsertResult({
          total: 0,
          inserted: 0,
          failed: [{ index: -1, error: res.error }],
          fileErrors: [],
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* ---------- Picker / paste -------------------------------- */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Source</p>
            <p className="text-[11px] text-white/55">
              Excel (.xlsx), CSV, or JSON. One row per recipe.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="glass-pill inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-white/85 hover:bg-white/[0.14] hover:text-white"
              data-testid="bulk-download-template"
            >
              <Download className="h-3 w-3" /> Excel/CSV template
            </button>
            <button
              type="button"
              onClick={loadSample}
              className="glass-pill px-2.5 py-1 text-[11px] text-white/75 hover:bg-white/[0.14] hover:text-white"
              data-testid="bulk-load-sample"
            >
              Load JSON sample
            </button>
            <button
              type="button"
              onClick={pickFile}
              className="glass-pill inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-white/85 hover:bg-white/[0.14] hover:text-white"
              data-testid="bulk-pick-file"
            >
              <Upload className="h-3 w-3" /> Pick file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
                e.target.value = "";
              }}
            />
            {(text.length > 0 || pickedFileName) && (
              <button
                type="button"
                onClick={clear}
                className="rounded-md px-2 py-1 text-[11px] text-white/55 hover:bg-white/[0.06] hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {pickedFileName && !pickedFileError && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-emerald-200">
            <FileSpreadsheet className="h-3 w-3" /> Loaded {pickedFileName}.
            Review the parsed rows below before inserting.
          </p>
        )}
        {pickedFileError && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-amber-200">
            <AlertTriangle className="h-3 w-3" /> {pickedFileError}
          </p>
        )}

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setInsertResult(null);
          }}
          rows={10}
          spellCheck={false}
          placeholder='[{ "title": "...", "mealType": "lunch", ... }]   — or pick a .xlsx / .csv file'
          className="glass-input mt-3 min-h-[200px] w-full font-mono text-[12px] leading-relaxed"
          data-testid="bulk-textarea"
        />
      </div>

      {/* ---------- Preview ---------------------------------------- */}
      {report && <PreviewPanel report={report} />}

      {/* ---------- Action footer --------------------------------- */}
      {report && report.validRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-white/60">
            Insert <b className="text-white">{report.validRows.length}</b>{" "}
            valid row{report.validRows.length === 1 ? "" : "s"} as drafts.
            Recipes are slugged automatically; collisions get a random
            suffix so re-uploading is safe.
          </p>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={pending}
            onClick={insertAll}
            leftIcon={<Upload className="h-3 w-3" />}
            data-testid="bulk-insert-button"
          >
            {pending ? "Inserting…" : `Insert ${report.validRows.length} drafts`}
          </Button>
        </div>
      )}

      {/* ---------- Insert result --------------------------------- */}
      {pending && (
        <p className="inline-flex items-center gap-2 text-xs text-white/65">
          <Loader2 className="h-3 w-3 animate-spin" /> Inserting…
        </p>
      )}
      {insertResult && (
        <ResultPanel result={insertResult} />
      )}
    </div>
  );
}

/** Pretty-print a JSON-array string so the textarea preview is readable. */
function prettyPrint(jsonStr: string): string {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2);
  } catch {
    return jsonStr;
  }
}

function PreviewPanel({ report }: { report: BulkParseReport }) {
  const hasAnyValid = report.validRows.length > 0;
  const hasAnyInvalid = report.invalidRows.length > 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-white">Preview</p>
        <Badge tone="outline">{report.total} parsed</Badge>
        {hasAnyValid && (
          <Badge tone="green">{report.validRows.length} valid</Badge>
        )}
        {hasAnyInvalid && (
          <Badge tone="gold">{report.invalidRows.length} invalid</Badge>
        )}
      </div>

      {report.fileErrors.length > 0 && (
        <ul className="mt-3 space-y-1 text-[12px] text-amber-200">
          {report.fileErrors.map((e, i) => (
            <li key={i} className="inline-flex items-start gap-1.5">
              <AlertTriangle className="mt-0.5 h-3 w-3 flex-shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      )}

      {hasAnyValid && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wider text-white/45">
            Valid rows
          </p>
          <ul className="mt-1 space-y-1 text-[12px]">
            {report.validRows.slice(0, 50).map((r) => (
              <li
                key={r.index}
                className="inline-flex items-center gap-2 text-white/85"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span className="text-white/45">[{r.index}]</span>
                <span className="font-medium">{r.recipe.title}</span>
                <Badge tone="outline">{r.recipe.mealType}</Badge>
                <span className="text-white/55">{r.recipe.calories} kcal</span>
              </li>
            ))}
            {report.validRows.length > 50 && (
              <li className="text-[11px] text-white/55">
                … and {report.validRows.length - 50} more.
              </li>
            )}
          </ul>
        </div>
      )}

      {hasAnyInvalid && (
        <div className="mt-3">
          <p className="text-[11px] uppercase tracking-wider text-white/45">
            Invalid rows
          </p>
          <ul className="mt-1 space-y-1 text-[12px]">
            {report.invalidRows.slice(0, 20).map((r) => (
              <li
                key={r.index}
                className="inline-flex items-start gap-2 text-amber-200/90"
              >
                <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                <span className="text-white/45">[{r.index}]</span>
                <span>{r.error}</span>
              </li>
            ))}
            {report.invalidRows.length > 20 && (
              <li className="text-[11px] text-white/55">
                … and {report.invalidRows.length - 20} more.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  result,
}: {
  result: {
    total: number;
    inserted: number;
    failed: { index: number; error: string }[];
    fileErrors: string[];
  };
}) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
      data-testid="bulk-result"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-white">Insert result</p>
        <Badge tone="green">
          <Check className="h-3 w-3" /> Inserted {result.inserted}
        </Badge>
        {result.failed.length > 0 && (
          <Badge tone="gold">{result.failed.length} failed</Badge>
        )}
      </div>
      {result.fileErrors.length > 0 && (
        <ul className="mt-3 space-y-1 text-[12px] text-amber-200">
          {result.fileErrors.map((e, i) => (
            <li key={i}>⚠ {e}</li>
          ))}
        </ul>
      )}
      {result.failed.length > 0 && (
        <ul className="mt-3 space-y-1 text-[12px] text-amber-200/90">
          {result.failed.map((f, i) => (
            <li key={i} className="inline-flex items-start gap-2">
              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
              <span className="text-white/45">[{f.index}]</span>
              <span>{f.error}</span>
            </li>
          ))}
        </ul>
      )}
      {result.inserted > 0 && result.failed.length === 0 && (
        <p className="mt-2 text-[11px] text-white/65">
          Drafts are visible on{" "}
          <Link href="/recipes" className="text-accent-blue hover:underline">
            the recipes list
          </Link>
          . Open each one to review and publish.
        </p>
      )}
    </div>
  );
}
