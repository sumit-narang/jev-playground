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

    // Hover card: the item's name, then its band and score.
    const tip = document.createElement('div');
    tip.className = 'sed-tip';
    tip.hidden = true;
    tip.innerHTML = '<span class="sed-tip-name"></span><span class="sed-tip-score"></span>';
    const tipName = tip.querySelector('.sed-tip-name');
    const tipScore = tip.querySelector('.sed-tip-score');
    stage.append(tip);

    const info = [];
    // The card replaces the native tooltip; leaving `title` set would show
    // both, one of them stale.
    pile.nodes.forEach((n, i) => { n.dataset.idx = String(i); n.removeAttribute('title'); });

    const show = (el) => {
      const d = info[+el.dataset.idx];
      if (!d) return;
      tipName.textContent = d.name;
      tipScore.textContent = `${d.band} (${d.pct}%)`;
      tip.hidden = false;

      const r = el.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      let x = r.left - sr.left + r.width / 2 - t.width / 2;
      // Above the item, or below it when there is no room above.
      let y = r.top - sr.top - t.height - 8;
      if (y < 4) y = r.bottom - sr.top + 8;
      x = Math.max(4, Math.min(x, sr.width - t.width - 4));
      tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    };

    const hide = () => { tip.hidden = true; };

    stage.addEventListener('pointerover', (e) => {
      const el = e.target.closest?.('.pile-item');
      if (el) show(el);
    });
    stage.addEventListener('pointerout', (e) => {
      if (!e.relatedTarget?.closest?.('.pile-item')) hide();
    });
    // pointerout does not fire when the pointer exits the window or is
    // captured elsewhere, so close on the stage boundary too.
    stage.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);

    // Left column reserved for the row labels, so nothing can land on them.
    const GUTTER = 104;
    const PAD_X = 18;
    const BAND_PAD = 10;

    const layout = () => {
      if (!last) return;
      // Items are about to move; nothing will fire pointerout if the cursor is
      // holding still, so retire the card before they do.
      hide();
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

      const m = pile.metrics();
      const placed = [];   // {i, x, y, w, h} — collected to fade collisions after

      for (const [b, arr] of byBand) {
        // Band 0 is "not at all" and sits at the bottom.
        const top = (LEVELS.length - 1 - b) * bandH;
        const inner = bandH - BAND_PAD * 2;

        // Jev returns a probability-weighted index, so two items sharing a
        // label are still ordered — 0.0050 and 0.0150 are both "not at all",
        // but not equally so. That fraction is the height within the band.
        const frac = (i) => {
          const idx = val(last, `i${i}`, 0.5) * (LEVELS.length - 1);
          return Math.max(0, Math.min(1, idx - b + 0.5));
        };

        // Items keep their natural size and full name. Where that means they
        // collide, they collide — the fade below keeps it readable.
        const perRow = Math.max(1, Math.floor(availW / (m.w * 0.7)));
        const rows = Math.ceil(arr.length / perRow);
        const scale = m.text ? 1 : Math.min(1, (availW / perRow) / m.w);

        // The score always drives height — a wrapped band is not a grid. It
        // gets most of the band; the row index only nudges, to pull apart
        // items whose scores are so close they would sit exactly on top of
        // each other. Anything genuinely flat here is Jev agreeing, not the
        // layout flattening it.
        const scoreSpan = inner * (rows > 1 ? 0.72 : 1);
        const rowNudge = rows > 1 ? (inner - scoreSpan) / (rows - 1) : 0;

        const sorted = arr.slice().sort((x, y2) => frac(y2) - frac(x));

        sorted.forEach((k, idx) => {
          const col = idx % perRow;
          const row = Math.floor(idx / perRow);
          const cols = Math.min(perRow, sorted.length);
          const x = GUTTER + PAD_X + (col + 0.5) * (availW / cols);
          const y = top + BAND_PAD + (1 - frac(k)) * scoreSpan + row * rowNudge;
          pile.place(k, x, y, { scale });
          const box = pile.boxOf(k);
          placed.push({ i: k, x, y, w: box.w * scale, h: box.h * scale });
          const lv = label(last, `i${k}`).replace(/_/g, ' ');
          info[k] = {
            name: LIST[k].name,
            band: lv.charAt(0).toUpperCase() + lv.slice(1),
            pct: (val(last, `i${k}`, 0.5) * 100) | 0,
          };
        });
      }

      // Anything whose box touches another's is faded, so overlapping labels
      // stay readable through each other. Hover lifts one back to full.
      const hit = new Set();
      for (let a = 0; a < placed.length; a++) {
        for (let c = a + 1; c < placed.length; c++) {
          const p1 = placed[a], p2 = placed[c];
          if (Math.abs(p1.x - p2.x) * 2 < p1.w + p2.w &&
              Math.abs(p1.y - p2.y) * 2 < p1.h + p2.h) {
            hit.add(p1.i); hit.add(p2.i);
          }
        }
      }
      for (const { i } of placed) pile.setOpacity(i, hit.has(i) ? 0.8 : 1);
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
      destroy() {
        window.removeEventListener('blur', hide);
        ro.disconnect(); pile.destroy(); stage.remove();
      },
    };
  },
};
