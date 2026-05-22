import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Mirrors iOS AppTheme.Colors so admin and app feel the same
        gradient: {
          start: "#0F172A", // slate-950 leaning
          mid: "#1E3A8A",
          end: "#7C3AED",
        },
        accent: {
          blue: "#4F8CFF",
          purple: "#8F5CFF",
        },
        success: {
          DEFAULT: "#34D399",
          deep: "#059669",
        },
        danger: "#EF4444",
        gold: {
          start: "#FFD666",
          end: "#F39E33",
        },
        glass: {
          stroke: "rgba(255,255,255,0.20)",
          fill: "rgba(255,255,255,0.06)",
          shadow: "rgba(0,0,0,0.18)",
        },
      },
      borderRadius: {
        card: "24px",
        chip: "14px",
      },
      boxShadow: {
        glass: "0 12px 32px rgba(0,0,0,0.18)",
        glow: "0 0 40px rgba(143,92,255,0.35)",
        "glow-gold": "0 0 40px rgba(243,158,51,0.35)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg,#0F172A 0%,#1E3A8A 50%,#7C3AED 100%)",
        "primary-gradient": "linear-gradient(90deg,#4F8CFF 0%,#8F5CFF 100%)",
        "success-gradient": "linear-gradient(90deg,#34D399 0%,#059669 100%)",
        "gold-gradient": "linear-gradient(135deg,#FFD666 0%,#F39E33 100%)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
