"use client";

import { cn } from "@/lib/cn";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-gradient text-white shadow-[0_8px_24px_rgba(143,92,255,0.35)] hover:brightness-110",
  success:
    "bg-success-gradient text-white shadow-[0_8px_24px_rgba(52,211,153,0.30)] hover:brightness-110",
  secondary:
    "glass-pill text-white hover:bg-white/[0.14]",
  ghost:
    "text-white/80 hover:text-white hover:bg-white/[0.08] rounded-full",
  danger:
    "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25 rounded-full",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm font-semibold",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
}
