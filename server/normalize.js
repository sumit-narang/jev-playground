// The one place that knows TypeSafe's response shape.
//
// Verified against the live API. Three things differ from what the published
// examples implied, and each one silently breaks a renderer if missed:
//
//   noul   -> value lives in `noul`, and there is no confidence field
//   score  -> `score` is an INDEX (0 .. n-1), not a 0..1 scalar
//   score  -> `probabilities` and `legend` are keyed by index STRING
//
// Everything downstream consumes the normalised shape below:
//   { type, value: 0..1 | null, label, options: [{label, p}], confidence }

const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));

export function normalizeAnswer(raw, levels = []) {
  const type = raw.type ?? (raw.noul !== undefined ? 'noul' : raw.choice !== undefined ? 'choice' : 'score');

  if (type === 'noul') {
    const yes = clamp01(raw.noul ?? raw.value ?? raw.probability ?? 0);
    return {
      type: 'noul',
      value: yes,
      label: yes >= 0.5 ? 'yes' : 'no',
      options: [{ label: 'yes', p: yes }, { label: 'no', p: 1 - yes }],
      // A noul carries no confidence of its own; distance from a coin flip is
      // the honest stand-in.
      confidence: Math.abs(yes - 0.5) * 2,
    };
  }

  if (type === 'score') {
    const legend = raw.legend ?? {};
    const keys = Object.keys(legend).length
      ? Object.keys(legend).sort((a, b) => Number(a) - Number(b))
      : Object.keys(raw.probabilities ?? {}).sort((a, b) => Number(a) - Number(b));
    const n = keys.length || levels.length || 1;

    // Prefer the caller's own level names over the humanised ones echoed back.
    const nameAt = (i) => levels[i] ?? legend[String(i)] ?? String(i);

    const options = keys.length
      ? keys.map((k) => ({ label: nameAt(Number(k)), p: Number(raw.probabilities?.[k] ?? 0) }))
      : levels.map((l, i) => ({ label: l, p: Number(raw.probabilities?.[String(i)] ?? 0) }));

    const idx = Number(raw.score ?? raw.value ?? 0);
    return {
      type: 'score',
      value: n > 1 ? clamp01(idx / (n - 1)) : 0.5,
      label: nameAt(Math.round(idx)),
      options,
      confidence: clamp01(raw.confidence ?? 0),
    };
  }

  const probs = raw.probabilities ?? {};
  const options = Object.entries(probs).map(([label, p]) => ({ label, p: Number(p) }));
  const top = options.slice().sort((a, b) => b.p - a.p)[0];
  return {
    type: 'choice',
    value: null,
    label: String(raw.choice ?? raw.value ?? top?.label ?? ''),
    options,
    confidence: clamp01(raw.confidence ?? top?.p ?? 0),
  };
}

export function normalizeResponse(body, levelMap = {}) {
  const answers = {};
  for (const [name, raw] of Object.entries(body.answers ?? {})) {
    answers[name] = normalizeAnswer(raw, levelMap[name] ?? []);
  }
  return { source: 'jev', model: body.model, usage: body.usage, answers };
}
