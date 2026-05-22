import Link from "next/link";

export default function PaymentNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-8 text-center">
        <p className="text-xs uppercase tracking-wider text-white/50">404</p>
        <h1 className="mt-1 text-xl font-semibold text-white">Payment not found</h1>
        <p className="mt-2 text-sm text-white/60">
          That payment ID does not exist in the queue.
        </p>
        <Link
          href="/payments"
          className="mt-4 inline-block text-sm text-accent-blue hover:underline"
        >
          Back to payments
        </Link>
      </div>
    </div>
  );
}
