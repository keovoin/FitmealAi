"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/user/auth-context";

interface PaymentOptions {
  aba_enabled: boolean;
}

const plans = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      { text: "3 meal plans per week", included: true },
      { text: "Basic recipes", included: true },
      { text: "Calorie tracking", included: true },
      { text: "Custom macros", included: false },
      { text: "Unlimited generations", included: false },
      { text: "Priority AI responses", included: false },
    ],
  },
  {
    id: "silver",
    name: "Silver",
    price: "$4.99",
    period: "/month",
    features: [
      { text: "10 meal plans per week", included: true },
      { text: "Detailed recipes", included: true },
      { text: "Calorie tracking", included: true },
      { text: "Custom macros", included: true },
      { text: "Unlimited generations", included: false },
      { text: "Priority AI responses", included: false },
    ],
  },
  {
    id: "gold",
    name: "Gold",
    price: "$9.99",
    period: "/month",
    highlighted: true,
    features: [
      { text: "Unlimited meal plans", included: true },
      { text: "Chef-quality recipes", included: true },
      { text: "Calorie tracking", included: true },
      { text: "Custom macros", included: true },
      { text: "Unlimited generations", included: true },
      { text: "Priority AI responses", included: true },
    ],
  },
];

export default function PaywallPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState("gold");
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptions | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentOptions();
  }, []);

  async function fetchPaymentOptions() {
    try {
      const res = await fetch("/api/payments/options");
      if (res.ok) {
        const data = await res.json();
        setPaymentOptions(data);
      }
    } catch (err) {
      console.error("Failed to fetch payment options:", err);
    }
  }

  async function handleSubscribe() {
    if (selected === "free") {
      router.push("/home");
      return;
    }
    setProcessing(true);
    // In production, this would redirect to Stripe/payment flow
    // For now, we simulate the subscription
    setTimeout(() => {
      setProcessing(false);
      router.push("/home");
    }, 2000);
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-[26px] font-bold text-white">Choose your plan</h1>
        <p className="mt-1 text-sm text-white/55">
          Unlock your full nutrition potential
        </p>
      </div>

      {/* Plan Cards */}
      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`relative w-full rounded-card border p-5 text-left transition-all ${
              selected === plan.id
                ? plan.highlighted
                  ? "border-gold-start/60 bg-gold-start/5 shadow-glow-gold"
                  : "border-accent-purple/60 bg-accent-purple/5 shadow-glow"
                : "border-glass-stroke bg-white/[0.06]"
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-gold-gradient px-3 py-0.5 text-[10px] font-bold text-slate-900">
                POPULAR
              </span>
            )}

            <div className="mb-3 flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">{plan.price}</span>
              <span className="text-sm text-white/55">{plan.period}</span>
            </div>
            <h3 className="mb-3 text-[15px] font-semibold text-white">
              {plan.name}
            </h3>

            <ul className="flex flex-col gap-2">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  {feature.included ? (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-white/20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span
                    className={`text-sm ${feature.included ? "text-white/80" : "text-white/30"}`}
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Selection indicator */}
            {selected === plan.id && (
              <div className="absolute right-4 top-5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-purple">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Subscribe Button */}
      <button
        onClick={handleSubscribe}
        disabled={processing}
        className="w-full rounded-xl bg-primary-gradient py-3.5 font-semibold text-white shadow-glow transition-opacity disabled:opacity-40"
      >
        {processing
          ? "Processing..."
          : selected === "free"
            ? "Continue with Free"
            : "Subscribe"}
      </button>

      {/* ABA Payment Option */}
      {paymentOptions?.aba_enabled && selected !== "free" && (
        <button className="glass-pill w-full py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.12]">
          Pay with ABA (manual)
        </button>
      )}

      {/* Footer */}
      <p className="text-center text-[11px] text-white/40">
        Cancel anytime. Subscription renews monthly.
        <br />
        Payment processed securely.
      </p>
    </div>
  );
}
