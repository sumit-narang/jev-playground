export const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const lerp = (a, b, t) => a + (b - a) * t;

// Scalar 0..1 for a score/noul answer; choice answers have no position.
export const val = (answers, name, fallback = 0.5) =>
  answers?.[name]?.value ?? fallback;

export const label = (answers, name) => answers?.[name]?.label ?? '';

// Shannon entropy of a distribution, normalised to 0..1 against a flat one.
// This is the number that drives the texture instrument: how unsure Jev was.
export function entropy(options) {
  if (!options?.length) return 0;
  const total = options.reduce((s, o) => s + o.p, 0) || 1;
  const h = -options.reduce((s, o) => {
    const p = o.p / total;
    return s + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  const max = Math.log2(options.length);
  return max > 0 ? clamp(h / max) : 0;
}

export const meanEntropy = (answers) => {
  const vals = Object.values(answers ?? {}).map((a) => entropy(a.options));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
};

export const HUES = ['red','orange','yellow','green','teal','blue','navy','purple','pink','brown','grey','white','black'];

const HUE_DEG = {
  red: 8, orange: 28, yellow: 50, green: 135, teal: 175, blue: 215,
  navy: 232, purple: 280, pink: 335, brown: 25, grey: 220, white: 210, black: 220,
};
const HUE_SAT = {
  brown: 0.42, grey: 0.06, white: 0.05, black: 0.08, navy: 0.62,
};
const HUE_LIT = {
  brown: 0.32, white: 0.9, black: 0.1, navy: 0.22, grey: 0.4, yellow: 0.56,
  green: 0.38, red: 0.44, blue: 0.44, teal: 0.42, purple: 0.4, orange: 0.5, pink: 0.62,
};

// Named hue + lightness/saturation scalars -> hex.
export function hueToHex(name, lightness = 0.5, saturation = 0.6) {
  const h = HUE_DEG[name] ?? 220;
  const s = clamp((HUE_SAT[name] ?? 0.62) * (0.45 + saturation), 0.02, 0.95);
  const l = clamp((HUE_LIT[name] ?? 0.5) * (0.55 + lightness * 0.9), 0.05, 0.96);
  return hslToHex(h, s, l);
}

export function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Deterministic 0..1 noise, so generative output is reproducible per phrase.
export function rng(seed) {
  let s = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    s ^= seed.charCodeAt(i);
    s = Math.imul(s, 16777619);
  }
  return () => {
    s = Math.imul(s ^ (s >>> 15), 2246822507);
    s = Math.imul(s ^ (s >>> 13), 3266489909);
    return ((s ^= s >>> 16) >>> 0) / 4294967295;
  };
}

export function el(tag, props = {}, ...kids) {
  const node = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) node.append(k);
  return node;
}
