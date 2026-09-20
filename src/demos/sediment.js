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

    const layout = () => {
      if (!last) return;
      const { w, h } = pile.size();
      const pad = 40;
      // Spread horizontally within each stratum so items do not stack up.
      const byBand = new Map();
      LIST.forEach((_, i) => {
        const v = val(last, `i${i}`, 0.5);
        const band = Math.round(v * 8);
        const arr = byBand.get(band) ?? [];
        arr.push(i);
        byBand.set(band, arr);
      });
      for (const [, arr] of byBand) {
        arr.forEach((i, k) => {
          const v = val(last, `i${i}`, 0.5);
          const x = pad + ((k + 0.5) / arr.length) * (w - pad * 2);
          const y = h - pad - v * (h - pad * 2);
          pile.place(i, x, y, { scale: 0.85 + v * 0.55, opacity: 0.55 + v * 0.45 });
          pile.label(i, `${LIST[i].name} — ${label(last, `i${i}`)} (${(v * 100) | 0}%)`);
        });
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
