import { val, label, lerp, clamp, rng } from '../lib/util.js';

const S = (instruction, levels) => ({ type: 'score', instruction, levels });

export default {
  id: 'stroke',
  short: 'Stroke',
  title: 'Description → stroke',
  tagline: 'Describe a line, then draw with it. Brush parameters, not pixels.',
  placeholder: 'a nervous line',
  examples: ['a nervous line', 'a confident sweep', 'hesitant', 'a heavy slow drag',
             'quick sharp jabs', 'a soft light touch'],

  questions: () => ({
    jitter:     S('How shaky is this line?', ['dead_steady', 'steady', 'slight_tremor', 'shaky', 'convulsive']),
    pressure:   S('How much pressure does it carry?', ['feather', 'light', 'medium', 'firm', 'bearing_down']),
    speed:      S('How fast is it drawn?', ['crawling', 'slow', 'moderate', 'quick', 'whipped']),
    wobble:     S('How much does it wander off course?', ['ruler_true', 'slight_drift', 'loose', 'wandering', 'lost']),
    angularity: S('Is it curved or angular?', ['flowing', 'curved', 'mixed', 'angular', 'jagged']),
    weight:     S('How heavy does the mark sit?', ['ghost', 'light', 'medium', 'bold', 'crushing']),
  }),

  mount(root) {
    const canvas = document.createElement('canvas');
    canvas.className = 'stroke-canvas';
    root.append(canvas);
    const bar = document.createElement('div');
    bar.className = 'stroke-bar';
    bar.innerHTML = `<span class="hint">drag on the canvas to draw with this brush</span>
      <button class="clear" type="button">clear</button>`;
    root.append(bar);

    const ctx = canvas.getContext('2d');
    let p = { jitter: 0.3, pressure: 0.5, speed: 0.5, wobble: 0.3, angular: 0.4, weight: 0.5 };
    let drawing = false, lastPt = null, drift = 0, rand = rng('stroke');

    const resize = () => {
      // Measure the canvas itself — CSS owns its box, so there is no feedback.
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const img = ctx.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
      canvas.width = Math.max(1, Math.round(r.width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(r.height * devicePixelRatio));
      ctx.putImageData(img, 0, 0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const pos = (ev) => {
      const r = canvas.getBoundingClientRect();
      return { x: (ev.clientX - r.left) * devicePixelRatio, y: (ev.clientY - r.top) * devicePixelRatio };
    };

    function segment(from, to) {
      // Jitter is per-sample noise; wobble is a slow random walk. Together they
      // separate "shaky hand" from "wandering line" — different failures.
      drift += (rand() - 0.5) * p.wobble * 6;
      drift *= 0.94;
      const jx = (rand() - 0.5) * p.jitter * 22 * devicePixelRatio;
      const jy = (rand() - 0.5) * p.jitter * 22 * devicePixelRatio;

      ctx.strokeStyle = `rgba(15,23,42,${lerp(0.14, 0.95, p.pressure).toFixed(3)})`;
      ctx.lineWidth = lerp(0.8, 16, p.weight) * devicePixelRatio;
      ctx.lineCap = p.angular > 0.6 ? 'butt' : 'round';
      ctx.lineJoin = p.angular > 0.6 ? 'miter' : 'round';

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      const ex = to.x + jx, ey = to.y + jy + drift;
      if (p.angular > 0.5) {
        ctx.lineTo(ex, ey);
      } else {
        const mx = (from.x + ex) / 2 + (rand() - 0.5) * (1 - p.angular) * 26 * devicePixelRatio;
        const my = (from.y + ey) / 2 + (rand() - 0.5) * (1 - p.angular) * 26 * devicePixelRatio;
        ctx.quadraticCurveTo(mx, my, ex, ey);
      }
      ctx.stroke();
      return { x: ex, y: ey };
    }

    canvas.addEventListener('pointerdown', (e) => {
      drawing = true; drift = 0; lastPt = pos(e); canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const now = pos(e);
      // Slow brushes lay down more samples per unit distance, so they bite harder.
      const steps = Math.max(1, Math.round(lerp(4, 1, p.speed)));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        lastPt = segment(lastPt, { x: lerp(lastPt.x, now.x, t), y: lerp(lastPt.y, now.y, t) });
      }
    });
    const stop = () => { drawing = false; lastPt = null; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointerleave', stop);
    bar.querySelector('.clear').addEventListener('click', () => ctx.clearRect(0, 0, canvas.width, canvas.height));

    function preview() {
      // Auto-draw one specimen stroke so the brush is legible without dragging.
      const w = canvas.width, h = canvas.height;
      let pt = { x: w * 0.1, y: h * 0.5 };
      drift = 0;
      for (let i = 1; i <= 90; i++) {
        const t = i / 90;
        pt = segment(pt, { x: w * (0.1 + t * 0.8), y: h * (0.5 + Math.sin(t * Math.PI * 1.4) * 0.22) });
      }
    }

    return {
      update(answers, input) {
        p = {
          jitter: val(answers, 'jitter'), pressure: val(answers, 'pressure'),
          speed: val(answers, 'speed'), wobble: val(answers, 'wobble'),
          angular: val(answers, 'angularity'), weight: val(answers, 'weight'),
        };
        rand = rng(input || 'stroke');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        preview();
        return ['jitter', 'pressure', 'speed', 'wobble', 'angularity', 'weight']
          .map((k) => [k, label(answers, k)]);
      },
      destroy() { ro.disconnect(); canvas.remove(); bar.remove(); },
    };
  },
};
