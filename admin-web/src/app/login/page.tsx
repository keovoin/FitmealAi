import { LoginForm } from "@/app/login/login-form";
import { isAuthenticated } from "@/lib/auth";
import { Leaf } from "lucide-react";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  if (await isAuthenticated()) {
    redirect("/");
  }
  const params = await searchParams;
  const from = params?.from ?? "/";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      {/* Soft brand glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-80 w-80 rounded-full bg-accent-purple/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-80 w-80 rounded-full bg-accent-blue/25 blur-3xl" />

      <div className="glass-card w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-gradient shadow-glow">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white">FitMeal Admin</h1>
          <p className="text-sm text-white/60">
            Internal CMS for users, payments, and subscriptions.
          </p>
        </div>

        <div className="mt-6">
          <LoginForm redirectTo={from} />
        </div>

        <p className="mt-6 text-center text-[11px] text-white/40">
          Phase-3 single-password gate. Real SSO comes later.
        </p>
      </div>
    </main>
  );
}
