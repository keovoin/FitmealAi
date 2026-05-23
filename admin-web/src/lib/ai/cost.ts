/**
 * Rough per-1M-token pricing as of 2026 for the cheap-tier defaults.
 * Override via env var if you switch models. Values are micro-dollars
 * per token (1 = $0.000001) for easier integer math in `cost_usd_micro`.
 */

interface ModelCost {
  inputMicroPerToken: number;
  outputMicroPerToken: number;
}

const MODEL_COSTS: Record<string, ModelCost> = {
  // ---- gpt-4.1 family (current default) ---------------------------------
  // gpt-4.1: $2.00 / 1M input, $8.00 / 1M output
  "gpt-4.1": {
    inputMicroPerToken: 2.0,
    outputMicroPerToken: 8.0,
  },
  // gpt-4.1-mini: $0.40 / 1M input, $1.60 / 1M output
  "gpt-4.1-mini": {
    inputMicroPerToken: 0.4,
    outputMicroPerToken: 1.6,
  },
  // gpt-4.1-nano: $0.10 / 1M input, $0.40 / 1M output
  "gpt-4.1-nano": {
    inputMicroPerToken: 0.1,
    outputMicroPerToken: 0.4,
  },

  // ---- gpt-4o family (kept for legacy / fallback users) ---------------
  // gpt-4o-mini text: $0.15 / 1M input, $0.60 / 1M output
  "gpt-4o-mini": {
    inputMicroPerToken: 0.15,
    outputMicroPerToken: 0.6,
  },
  // gpt-4o text: $2.50 / 1M input, $10 / 1M output (just so unknown
  // bumps don't silently undercount)
  "gpt-4o": {
    inputMicroPerToken: 2.5,
    outputMicroPerToken: 10,
  },
};

// gpt-image-1 standard 1024x1024 ~ $0.040 per image. Round to integer
// micros: 40,000 micro = $0.04
const IMAGE_COST_MICRO_PER_IMAGE: Record<string, number> = {
  "gpt-image-1": 40_000,
  "dall-e-3": 40_000,
  "dall-e-2": 20_000,
};

export function textCallCostMicro(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const c = MODEL_COSTS[model];
  if (!c) return 0;
  return Math.round(
    inputTokens * c.inputMicroPerToken + outputTokens * c.outputMicroPerToken,
  );
}

export function imageCallCostMicro(model: string): number {
  return IMAGE_COST_MICRO_PER_IMAGE[model] ?? 40_000;
}

export function microUsdToFloat(micro: number): number {
  return micro / 1_000_000;
}
