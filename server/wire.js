// Translates the instruments' question format into TypeSafe's wire format.
//
// The instruments speak a convenient shape — {type, instruction, levels|options}
// — and this is the only place that knows what the API actually wants:
//
//   instruction  -> instructions          (plural)
//   score.levels -> criteria: []          (ordered array, min 2)
//   choice.options -> criteria: {}        (map of option -> description)
//   noul         -> criteria optional
//
// Keeping the translation here means all 16 instruments stayed untouched when
// the real shape turned out to differ from the published examples.

const human = (s) => String(s).replace(/_/g, ' ');

export function toWire(questions) {
  const out = {};
  for (const [name, q] of Object.entries(questions)) {
    const instructions = q.instructions ?? q.instruction ?? '';

    if (q.type === 'score') {
      const levels = q.criteria ?? q.levels ?? [];
      if (levels.length < 2) continue;              // API requires two or more
      out[name] = { type: 'score', instructions, criteria: levels.map(human) };
    } else if (q.type === 'choice') {
      const opts = Array.isArray(q.criteria) ? q.criteria : (q.options ?? []);
      if (!opts.length) continue;
      out[name] = {
        type: 'choice',
        instructions,
        criteria: Object.fromEntries(opts.map((o) => [o, human(o)])),
      };
    } else {
      out[name] = { type: 'noul', instructions };
    }
  }
  return out;
}

// Level names as the instruments know them, so answers can be mapped back from
// the humanised strings the API echoes in its legend.
export function levelIndex(questions) {
  const map = {};
  for (const [name, q] of Object.entries(questions)) {
    if (q.type === 'score') map[name] = q.levels ?? q.criteria ?? [];
    if (q.type === 'choice') map[name] = q.options ?? q.criteria ?? [];
  }
  return map;
}
