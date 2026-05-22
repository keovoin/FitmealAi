import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Optional Tailwind width helper, e.g. "w-24" */
  width?: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyState,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyState?: ReactNode;
}) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-white/50",
                    col.width,
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/[0.04]"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-white/90",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center",
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
