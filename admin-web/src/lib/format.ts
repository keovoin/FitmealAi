/**
 * Lightweight, locale-friendly formatters used across the admin pages.
 */

export function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function relativeFromNow(iso: string, now: Date = new Date()): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const diffSec = Math.round((now.getTime() - d.getTime()) / 1000);
  const minutes = Math.round(diffSec / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(diffSec) < 45) return "just now";
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  if (Math.abs(days) < 7) return `${days}d ago`;
  return formatDate(iso);
}
