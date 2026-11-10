// Token/cost estimate from a JSONL agent log. The log format of each tool differs and is not guaranteed,
// so this scans every JSON object for usage-like fields instead of relying on one schema.
const IN_KEYS = ['input_tokens', 'prompt_tokens', 'inputtokens', 'prompttokens'];
const OUT_KEYS = ['output_tokens', 'completion_tokens', 'outputtokens', 'completiontokens'];

function walk(value, acc) {
  if (Array.isArray(value)) return value.forEach((v) => walk(v, acc));
  if (!value || typeof value !== 'object') return;
  let counted = false;
  for (const [k, v] of Object.entries(value)) {
    const key = k.toLowerCase();
    if (typeof v === 'number') {
      if (IN_KEYS.includes(key)) { acc.input += v; counted = true; }
      else if (OUT_KEYS.includes(key)) { acc.output += v; counted = true; }
    }
  }
  if (counted) acc.requests += 1;
  // A usage object is counted once; its parent is not descended again for the same numbers.
  if (!counted) Object.values(value).forEach((v) => walk(v, acc));
}

export function sumUsage(jsonl) {
  const acc = { input: 0, output: 0, requests: 0, skipped: 0 };
  for (const line of jsonl.split('\n').filter(Boolean)) {
    try {
      walk(JSON.parse(line), acc);
    } catch {
      acc.skipped += 1;
    }
  }
  return acc;
}

export function estimateCost(usage, pricing = {}) {
  const p = pricing.default ?? { inputPerMTok: 0, outputPerMTok: 0 };
  return Number(((usage.input * p.inputPerMTok + usage.output * p.outputPerMTok) / 1_000_000).toFixed(4));
}
