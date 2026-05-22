import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * `clsx` + `tailwind-merge` in one. Use for conditional class composition.
 *
 *   cn("p-2", isActive && "bg-white/10", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
