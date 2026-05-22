import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[24px] bg-white/[0.10] border border-white/[0.20] backdrop-blur-[30px] p-[18px] shadow-[0_12px_32px_rgba(0,0,0,0.18)]",
      className
    )}
    {...props}
  />
));
GlassCard.displayName = "GlassCard";

export const PrimaryButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }>(
  ({ className, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "h-[52px] rounded-[16px] bg-gradient-to-r from-[#4F8CFF] to-[#8F5CFF] text-white font-semibold flex items-center justify-center w-full shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryGlassButton = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "h-[48px] rounded-[16px] bg-white/[0.10] border border-white/[0.20] text-white font-medium flex items-center justify-center w-full transition-colors hover:bg-white/[0.15] active:bg-white/[0.05]",
        className
      )}
      {...props}
    />
  )
);
SecondaryGlassButton.displayName = "SecondaryGlassButton";

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div className={cn("flex w-full bg-white/[0.08] p-1 rounded-[16px] border border-white/10", className)}>
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "flex-1 py-2 text-sm font-medium rounded-[12px] transition-all duration-200",
            value === option
              ? "bg-white/20 text-white shadow-sm backdrop-blur-md"
              : "text-white/60 hover:text-white/80"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

let _ringId = 0;
export function MetricRing({ value, max, size = 100, strokeWidth = 10, label, sublabel }: { value: number, max: number, size?: number, strokeWidth?: number, label: string, sublabel?: string }) {
  const [gradId] = React.useState(() => `ring-grad-${++_ringId}`);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4F8CFF" />
            <stop offset="100%" stopColor="#8F5CFF" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s ease-in-out'
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold text-white leading-none">{label}</span>
        {sublabel && <span className="text-[10px] text-white/60 mt-1">{sublabel}</span>}
      </div>
    </div>
  );
}
