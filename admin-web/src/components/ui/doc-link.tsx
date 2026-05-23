import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Tiny "go to docs / dashboard" link, rendered next to a setting or
 * placeholder so admins can jump straight to the upstream provider's
 * console to grab the value.
 *
 * Two variants:
 *   - default: pill-shaped, used inline below a card title.
 *   - inline:  bare underline link, used inside running prose or
 *              chip rows where the pill would look heavy.
 */
export function DocLink({
  href,
  label,
  inline = false,
  className,
}: {
  href: string;
  label: string;
  inline?: boolean;
  className?: string;
}) {
  if (inline) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(
          "inline-flex items-center gap-0.5 text-[11px] text-accent-blue hover:underline",
          className,
        )}
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        "glass-pill inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-white/80 hover:bg-white/[0.14] hover:text-white",
        className,
      )}
    >
      <ExternalLink className="h-3 w-3" />
      {label}
    </a>
  );
}
