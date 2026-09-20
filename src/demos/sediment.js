import { items, itemQuestions, makePile, corpusState, badges } from '../lib/pile.js';
import { val, label } from '../lib/util.js';

const LEVELS = ['not_at_all', 'slightly', 'moderately', 'very', 'extremely'];

export default {
  id: 'sediment',
  usesCorpus: true,
  short: 'Sediment',
  title: 'Sedimentation',
  tagline: 'A score, not a yes/no. Items settle to a height — you get strata, not a threshold.',
  placeholder: 'would hurt to step on',
  examples: ['would hurt to step on', 'is expensive', 'is heavy', 'would survive a fire',
             'is embarrassing to be seen with', 'smells strongly'],

  stateFor: () => corpusState(),
  questions: (input) => itemQuestions(`how much does this apply — it ${input}?`, items(), 'score', LEVELS),

  mount(root) {
    const LIST = items();
    const stage = document.createElement('div');
    stage.className = 'pile-stage sediment';
    root.append(stage);

    const rules = document.createElement('div');
    rules.className = 'strata';
    rules.innerHTML = LEVELS
      .map((l) => l.replace(/_/g, ' '))
      .map((l) => `<span>${l.charAt(0).toUpperCase()}${l.slice(1)}</span>`)
      .reverse().join('');
    stage.append(rules);

    const pile = makePile(stage, LIST);
    let last = null;

    // Left column reserved for the row labels, so nothing can land on them.
    const GUTTER = 104;
    const PAD_X = 18;
    const BAND_PAD = 10;

    const layout = () => {
      if (!last) return;
      const { w, h } = pile.size();
      const bandH = h / LEVELS.length;
      const availW = Math.max(80, w - GUTTER - PAD_X * 2);

      // Group by the level the model actually chose, not by a re-rounded
      // scalar — the label is what the strata are drawn from.
      const byBand = new Map();
      LIST.forEach((_, i) => {
        const lbl = label(last, `i${i}`);
        let b = LEVELS.indexOf(lbl);
        if (b < 0) b = Math.round(val(last, `i${i}`, 0.5) * (LEVELS.length - 1));
        if (!byBand.has(b)) byBand.set(b, []);
        byBand.get(b).push(i);
      });

      for (const [b, arr] of byBand) {
        // Band 0 is "not at all" and sits at the bottom.
        const top = (LEVELS.length - 1 - b) * bandH;
        const inner = bandH - BAND_PAD * 2;

        // Jev returns a probability-weighted index, so two items sharing a
        // label are still ordered — 0.0050 and 0.0150 are both "not at all",
        // but not equally so. That fraction drives the height WITHIN the band,
        // which is the whole point of a sediment view: keeping it is the
        // difference between showing five buckets and showing a gradient.
        const frac = (i) => {
          const idx = val(last, `i${i}`, 0.5) * (LEVELS.length - 1);
          return Math.max(0, Math.min(1, idx - b + 0.5));
        };

        const BASE = 46;
        const perRow = Math.max(1, Math.floor(availW / 30));

        if (arr.length <= perRow) {
          // Sparse band: spread across the full width and let every item sit at
          // its true height.
          const scale = Math.min(1, (availW / arr.length) / BASE);
          arr.forEach((i, k) => {
            const v = val(last, `i${i}`, 0.5);
            const x = GUTTER + PAD_X + (k + 0.5) * (availW / arr.length);
            const y = top + BAND_PAD + (1 - frac(i)) * inner;
            pile.place(i, x, y, { scale });
            pile.label(i, `${LIST[i].name} — ${label(last, `i${i}`)} (${(v * 100) | 0}%)`);
          });
        } else {
          // Dense band: rows to avoid collision, ordered by score, with the
          // remaining slack inside each row still carrying the fraction.
          const sorted = arr.slice().sort((x, y2) => frac(y2) - frac(x));
          let cols = Math.max(1, Math.round(Math.sqrt(sorted.length * (availW / inner))));
          cols = Math.min(cols, sorted.length, perRow);
          const rows = Math.ceil(sorted.length / cols);
          const cellW = availW / cols;
          const cellH = inner / rows;
          const scale = Math.min(1, Math.min(cellW, cellH) / BASE);
          const slack = Math.max(0, cellH - BASE * scale) * 0.8;

          sorted.forEach((i, k) => {
            const col = k % cols;
            const row = Math.floor(k / cols);
            const v = val(last, `i${i}`, 0.5);
            // Position within this row's slice of the band, then nudge by the
            // item's own fraction so ordering survives inside the row too.
            const rowTop = top + BAND_PAD + row * cellH;
            const y = rowTop + cellH / 2 + (0.5 - frac(i)) * slack;
            const x = GUTTER + PAD_X + (col + 0.5) * cellW;
            pile.place(i, x, y, { scale });
            pile.label(i, `${LIST[i].name} — ${label(last, `i${i}`)} (${(v * 100) | 0}%)`);
          });
        }
      }
    };
    const ro = new ResizeObserver(layout);
    ro.observe(stage);

    return {
      update(answers) {
        last = answers;
        layout();
        const ranked = LIST.map((it, i) => ({ it, v: val(answers, `i${i}`, 0.5) }))
          .sort((a, b) => b.v - a.v);
        return [
          ['top of the water', badges(ranked.slice(0, 8).map((r) => r.it))],
          ['on the bottom', badges(ranked.slice(-8).map((r) => r.it))],
          ['spread', `${(ranked.at(-1).v * 100) | 0}% → ${(ranked[0].v * 100) | 0}%`],
        ];
      },
      destroy() { ro.disconnect(); pile.destroy(); stage.remove(); },
    };
  },
};
