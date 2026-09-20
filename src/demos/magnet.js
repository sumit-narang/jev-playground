import { items, itemQuestions, makePile, corpusState, badges } from '../lib/pile.js';
import { val, clamp } from '../lib/util.js';

export default {
  id: 'magnet',
  usesCorpus: true,
  short: 'Magnet',
  title: 'The magnet',
  tagline: 'Your cursor is the force field. Matching items follow it; the rest are repelled.',
  placeholder: 'a magnet would attract it',
  examples: ['a magnet would attract it', 'is edible', 'is alive', 'is made of metal',
             'would float', 'costs more than €100'],

  stateFor: () => corpusState(),
  questions: (input) => itemQuestions(`is it true that it ${input}?`),

  mount(root) {
    const LIST = items();
    const stage = document.createElement('div');
    stage.className = 'pile-stage magnet';
    root.append(stage);
    const hint = document.createElement('p');
    hint.className = 'magnet-hint';
    hint.textContent = 'Move the pointer across the field';
    stage.append(hint);

    const pile = makePile(stage, LIST);
    const P = LIST.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, p: 0.5 }));
    let mouse = { x: -999, y: -999 }, raf, stopped = false, seeded = false;

    const seed = () => {
      const { w, h } = pile.size();
      if (!w || !h) return;
      P.forEach((s, i) => {
        s.x = w * (0.1 + 0.8 * (((i * 2654435761) % 997) / 997));
        s.y = h * (0.1 + 0.8 * (((i * 40503) % 991) / 991));
      });
      seeded = true;
    };
    const ro = new ResizeObserver(() => { if (!seeded) seed(); });
    ro.observe(stage);
    seed();

    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    stage.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });

    const tick = () => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);
      const { w, h } = pile.size();
      if (!w) return;
      if (!seeded) seed();

      P.forEach((s, i) => {
        const dx = mouse.x - s.x, dy = mouse.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        // p above .5 attracts, below repels; the further from .5 the stronger.
        // An item the model is unsure about barely moves — which is correct.
        const pull = (s.p - 0.5) * 2;
        const force = (pull * 2600) / (d * d + 900);
        s.vx += (dx / d) * force;
        s.vy += (dy / d) * force;
        s.vx += (w / 2 - s.x) * 0.0012;   // gentle drift back to centre
        s.vy += (h / 2 - s.y) * 0.0012;
        s.vx *= 0.9; s.vy *= 0.9;
        s.x = clamp(s.x + s.vx, 18, w - 18);
        s.y = clamp(s.y + s.vy, 18, h - 18);
        pile.place(i, s.x, s.y, {
          scale: 0.75 + Math.abs(pull) * 0.7,
          opacity: 0.35 + Math.abs(pull) * 0.6,
          instant: true,
        });
      });
    };
    tick();

    return {
      update(answers) {
        LIST.forEach((it, i) => {
          P[i].p = val(answers, `i${i}`, 0.5);
          pile.label(i, `${it.name} — ${(P[i].p * 100) | 0}%`);
        });
        const attracted = LIST.filter((_, i) => P[i].p > 0.65);
        const inert = LIST.filter((_, i) => Math.abs(P[i].p - 0.5) < 0.1);
        return [
          ['attracted', badges(attracted.slice(0, 14))],
          ['barely moves (unsure)', badges(inert.slice(0, 14))],
        ];
      },
      destroy() {
        stopped = true;
        cancelAnimationFrame(raf);
        ro.disconnect();
        pile.destroy();
        stage.remove();
      },
    };
  },
};
