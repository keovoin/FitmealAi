"use client";

import { Button } from "@/components/ui/button";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Login failed");
      }
      router.replace(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form data-testid="login-form" onSubmit={onSubmit} className="flex flex-col gap-3">
      <label data-testid="login-password-label" className="flex flex-col gap-1.5 text-xs font-medium text-white/70">
        Admin password
        <div className="relative">
          <input
            data-testid="login-password-input"
            type={showPassword ? "text" : "password"}
            autoFocus
            autoComplete="current-password"
            className="glass-input pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <button
            data-testid="login-password-toggle-button"
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 hover:text-white"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {error && (
        <p data-testid="login-error-message" className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <Button
        data-testid="login-submit-button"
        type="submit"
        size="lg"
        loading={loading}
        leftIcon={<KeyRound className="h-4 w-4" />}
      >
        Sign in
      </Button>
    </form>
  );
}
