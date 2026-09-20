import { val, label, clamp, lerp, rng } from '../lib/util.js';

const S = (instruction, levels) => ({ type: 'score', instruction, levels });

const SEASONS = {
  bare:        { leaf: null,      note: 'winter' },
  blossom:     { leaf: '#f6d2de', note: 'blossom' },
  fresh_green: { leaf: '#8fc04f', note: 'spring' },
  deep_green:  { leaf: '#4a7a35', note: 'summer' },
  autumn:      { leaf: '#c8802c', note: 'autumn' },
};

export default {
  id: 'tree',
  short: 'Tree',
  title: 'Description → a tree',
  tagline: 'Eight axes grow the whole thing. Every branch, split and leaf is computed.',
  placeholder: 'an ancient oak alone in a field',
  examples: [
    'an ancient oak alone in a field',
    'a young silver birch',
    'a windswept pine on a cliff',
    'a cherry tree in full blossom',
    'a dead tree in midwinter',
    'a hawthorn in a hedgerow, bent by the wind',
  ],

  questions: () => ({
    height:   S('How tall is this tree?', ['squat', 'low', 'average', 'tall', 'towering']),
    spread:   S('How wide does it spread?', ['columnar', 'narrow', 'average', 'broad', 'sprawling']),
    density:  S('How dense is the canopy?', ['skeletal', 'sparse', 'average', 'full', 'impenetrable']),
    gnarl:    S('How twisted are the branches?', ['ruler_straight', 'straight', 'natural', 'crooked', 'contorted']),
    trunk:    S('How thick is the trunk?', ['sapling', 'slender', 'average', 'stout', 'massive']),
    exposure: S('How exposed to wind is it?', ['sheltered', 'calm', 'open', 'breezy', 'battered']),
    conifer:  { type: 'noul', instruction: 'Is this a conifer — needles rather than broad leaves?' },
    season:   { type: 'choice', instruction: 'What state is its foliage in?',
                options: ['bare', 'blossom', 'fresh_green', 'deep_green', 'autumn'] },
  }),

  mount(root) {
    const canvas = document.createElement('canvas');
    canvas.className = 'tree-canvas';
    root.append(canvas);
    const ctx = canvas.getContext('2d');
    let p = null, seedStr = 'tree';

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      canvas.width = Math.max(1, Math.round(r.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(r.height * devicePixelRatio));
      if (p) draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    function draw() {
      const { width: w, height: h } = canvas;
      // Fixed drawing scale: the tree stays the same size whatever the canvas
      // does, anchored to a ground line a fixed distance from the bottom.
      const U = devicePixelRatio;
      const DRAW_H = 400 * U;
      const rand = rng(seedStr);
      ctx.clearRect(0, 0, w, h);

      const groundY = h - 54 * U;
      const season = SEASONS[p.season] ?? SEASONS.deep_green;
      const leafColour = season.leaf;

      // Bark darkens and greys with exposure; a battered tree is not a healthy one.
      const bark = `rgba(${Math.round(lerp(86, 120, p.exposure))},
                         ${Math.round(lerp(66, 106, p.exposure))},
                         ${Math.round(lerp(50, 88, p.exposure))},`;

      // Prevailing wind: leans the whole tree and biases every branch downwind.
      const lean = (p.exposure - 0.45) * 0.42;

      const shrink = lerp(0.66, 0.78, p.height);
      const depth = Math.round(lerp(6, 9, p.density));
      // A branch chain totals len/(1-shrink), so the trunk has to be derived
      // from the space available — pick it directly and the tree grows off the
      // top of the canvas at any generous height score.
      const canopyH = DRAW_H;
      const trunkLen = canopyH * (1 - shrink) * lerp(0.82, 1.05, p.height);
      const trunkW = U * lerp(4, 22, p.trunk);
      const splitAngle = lerp(0.16, 0.62, p.spread);

      const leaves = [];

      function branch(x, y, ang, len, width, d) {
        if (d <= 0 || len < 1.5 * U) {
          if (leafColour) leaves.push([x, y, len]);
          return;
        }
        // Gnarl wobbles each segment; exposure pushes it downwind.
        // Wind bias must not compound: applied per segment it accumulates down
        // the recursion and lays the whole tree on its side. Scale it by
        // remaining depth so the tips bend and the trunk stays put.
        const wob = (rand() - 0.5) * p.gnarl * 0.7;
        const a = ang + wob + lean * 0.05 * (d / depth);
        const x2 = x + Math.cos(a) * len;
        const y2 = y + Math.sin(a) * len;

        ctx.beginPath();
        ctx.moveTo(x, y);
        // A slight curve per segment reads as growth; straight sticks do not.
        ctx.quadraticCurveTo(
          (x + x2) / 2 + Math.cos(a + Math.PI / 2) * len * p.gnarl * 0.22,
          (y + y2) / 2 + Math.sin(a + Math.PI / 2) * len * p.gnarl * 0.22,
          x2, y2);
        ctx.strokeStyle = `${bark}${clamp(0.45 + d * 0.06, 0, 1).toFixed(2)})`;
        ctx.lineWidth = Math.max(0.6, width);
        ctx.lineCap = 'round';
        ctx.stroke();

        // Two splits usually, three when the canopy is dense — that single
        // choice is most of what separates a scrubby tree from a full one.
        // Three-way splits fill a canopy but cube the branch count; keep them
        // rare and only in the outer half of the tree.
        const n = p.density > 0.66 && d < depth - 2 && rand() > 0.72 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const off = (i - (n - 1) / 2) * splitAngle * (1 + (rand() - 0.5) * 0.5);
          branch(x2, y2, a + off + lean * 0.04,
            len * shrink * (0.86 + rand() * 0.28),
            width * lerp(0.62, 0.76, p.trunk), d - 1);
        }
      }

      // trunk
      const rootX = w / 2 - lean * w * 0.06;
      branch(rootX, groundY, -Math.PI / 2 + lean * 0.35, trunkLen, trunkW, depth);

      // Foliage last so it sits over the branches.
      if (leafColour) {
        const conifer = p.conifer > 0.5;
        const size = U * lerp(3, 11, p.density) * (conifer ? 0.7 : 1);
        for (const [lx, ly] of leaves) {
          const clump = conifer ? 5 : Math.round(lerp(2, 7, p.density));
          for (let i = 0; i < clump; i++) {
            const dx = (rand() - 0.5) * size * 2.6;
            const dy = (rand() - 0.5) * size * 2.6;
            ctx.beginPath();
            if (conifer) {
              // needles: short strokes fanning down and out
              ctx.moveTo(lx + dx, ly + dy);
              ctx.lineTo(lx + dx + (rand() - 0.5) * size, ly + dy + size * 1.1);
              ctx.strokeStyle = `${leafColour}${Math.round(lerp(120, 230, rand())).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = 1.1 * devicePixelRatio;
              ctx.stroke();
            } else {
              ctx.ellipse(lx + dx, ly + dy, size * (0.5 + rand() * 0.6),
                size * (0.35 + rand() * 0.45), rand() * 3, 0, 7);
              ctx.fillStyle = `${leafColour}${Math.round(lerp(90, 235, rand())).toString(16).padStart(2, '0')}`;
              ctx.fill();
            }
          }
        }
      }

      // ground line and a soft shadow, so the tree is standing on something
      const shadowW = trunkLen * lerp(0.5, 1.5, p.spread);
      const g = ctx.createRadialGradient(rootX, groundY, 0, rootX, groundY, shadowW);
      g.addColorStop(0, 'rgba(15,23,42,0.16)');
      g.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = g;
      ctx.save();
      ctx.translate(rootX, groundY);
      ctx.scale(1, 0.16);
      ctx.beginPath(); ctx.arc(0, 0, shadowW, 0, 7); ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(Math.max(w * 0.06, w / 2 - 340 * U), groundY);
      ctx.lineTo(Math.min(w * 0.94, w / 2 + 340 * U), groundY);
      ctx.strokeStyle = 'rgba(15,23,42,0.18)';
      ctx.lineWidth = 1.2 * devicePixelRatio;
      ctx.stroke();
    }

    return {
      update(answers, input) {
        seedStr = input;
        p = {
          height: val(answers, 'height'), spread: val(answers, 'spread'),
          density: val(answers, 'density'), gnarl: val(answers, 'gnarl'),
          trunk: val(answers, 'trunk'), exposure: val(answers, 'exposure'),
          conifer: val(answers, 'conifer', 0),
          season: label(answers, 'season') || 'deep_green',
        };
        draw();
        return [
          ['height', label(answers, 'height')], ['spread', label(answers, 'spread')],
          ['canopy', label(answers, 'density')], ['branches', label(answers, 'gnarl')],
          ['trunk', label(answers, 'trunk')], ['exposure', label(answers, 'exposure')],
          ['conifer', `${Math.round(p.conifer * 100)}%`],
          ['foliage', (SEASONS[p.season] ?? {}).note ?? p.season],
        ];
      },
      destroy() { ro.disconnect(); canvas.remove(); },
    };
  },
};
