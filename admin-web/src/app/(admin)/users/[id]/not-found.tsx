import Link from "next/link";

export default function UserNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-white/50">404</p>
        <h1 className="mt-1 text-xl font-semibold text-white">User not found</h1>
        <p className="mt-2 text-sm text-white/60">
          The user you are looking for does not exist or was removed.
        </p>
        <Link
          href="/users"
          className="mt-4 inline-block text-sm text-accent-blue hover:underline"
        >
          Back to users
        </Link>
      </div>
    </div>
  );
}
