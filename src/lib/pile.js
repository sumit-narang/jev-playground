import { CORPORA, DEFAULT_CORPUS, getCorpus } from '../../shared/corpora/index.js';

export { CORPORA, getCorpus };

// Reading localStorage throws outright in a private window with site data
// blocked — and this runs at import time, so an unguarded read takes the whole
// app down rather than just losing the preference.
function storedCorpus() {
  try { return localStorage.getItem('jev-corpus') ?? DEFAULT_CORPUS; }
  catch { return DEFAULT_CORPUS; }
}
let activeId = storedCorpus();

export const activeCorpus = () => getCorpus(activeId);
export const items = () => activeCorpus().items;
export function setCorpus(id) {
  activeId = id;
  try { localStorage.setItem('jev-corpus', id); } catch { /* private window */ }
}

// One question per item, all against a single state. This is the whole trick:
// 90 questions cost barely more than one because the state is charged once.
export const itemQuestions = (ask, list = items(), type = 'noul', levels) =>
  Object.fromEntries(
    list.map((it, i) => [
      `i${i}`,
      {
        type,
        instruction: `Item "${it.name}"${it.sub ? ` (${it.sub})` : ''} — ${ask}`,
        ...(levels ? { levels } : {}),
      },
    ]),
  );

// The state is the corpus, not the predicate: each question has to be
// self-contained so two different predicates can share one call.
export const corpusState = (list = items()) => ({
  items: list.map((i) => [i.name, i.sub].filter(Boolean).join(' — ')),
});

// Absolutely-positioned tiles that animate to wherever you put them.
export function makePile(root, list = items()) {
  const layer = document.createElement('div');
  layer.className = 'pile-layer';
  root.append(layer);

  const nodes = list.map((it) => {
    // Four render modes, decided once here. Everything downstream positions
    // them identically, so no instrument knows the difference.
    const n = document.createElement(it.thumb ? 'img' : 'span');
    if (it.thumb) {
      // Routed through the server: several image hosts refuse the browser
      // directly. See /api/img.
      n.className = 'pile-item pile-img';
      n.src = `${import.meta.env.BASE_URL}api/img?u=${encodeURIComponent(it.thumb)}`;
      n.loading = 'lazy';
      n.decoding = 'async';
      n.alt = it.alt || it.name;
      n.draggable = false;
    } else if (it.font) {
      n.className = 'pile-item pile-face';
      n.textContent = it.name;
      n.style.fontFamily = `'${it.font}', serif`;
    } else if (it.glyph) {
      n.className = 'pile-item';
      n.textContent = it.glyph;
    } else {
      // Full name; CSS ellipsis trims it to whatever column width it is given.
      n.className = 'pile-item pile-chip';
      n.textContent = it.name;
    }
    n.title = [it.name, it.sub].filter(Boolean).join(' — ');
    layer.append(n);
    return n;
  });

  const isText = !list[0]?.thumb && !list[0]?.glyph;

  return {
    layer,
    nodes,
    items: list,
    isText,
    // Natural (unscaled) footprint of the widest/tallest item, so a layout can
    // size its columns from what the items actually are rather than assuming.
    metrics() {
      let w = 0, h = 0;
      for (const n of nodes) {
        const prev = n.style.maxWidth;
        n.style.maxWidth = 'none';
        w = Math.max(w, n.offsetWidth);
        h = Math.max(h, n.offsetHeight);
        n.style.maxWidth = prev;
      }
      return { w: w || 46, h: h || 46, text: isText };
    },
    size: () => ({ w: layer.clientWidth, h: layer.clientHeight }),
    place(i, x, y, { scale = 1, opacity = 1, rot = 0, instant = false, maxWidth } = {}) {
      const n = nodes[i];
      if (!n) return;
      if (maxWidth) n.style.maxWidth = `${Math.round(maxWidth)}px`;
      n.style.transition = instant ? 'none' : '';
      n.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rot}deg) scale(${scale})`;
      n.style.opacity = String(opacity);
    },
    label(i, text) { if (nodes[i]) nodes[i].title = text; },
    // Natural box of one item, for collision work after placing.
    boxOf(i) {
      const n = nodes[i];
      return n ? { w: n.offsetWidth, h: n.offsetHeight } : { w: 46, h: 46 };
    },
    setOpacity(i, v) { if (nodes[i]) nodes[i].style.opacity = String(v); },
    destroy() { layer.remove(); },
  };
}

// A short badge for the readout: the glyph, or a truncated title.
export const badge = (it) => it.glyph ?? (it.name.length > 16 ? `${it.name.slice(0, 15)}…` : it.name);
export const badges = (list) => list.map(badge).join(list[0]?.glyph ? '' : ' · ') || '—';

// Heap along the bottom edge — the resting state most of these start from.
export function heapPosition(i, n, w, h) {
  const cols = Math.ceil(Math.sqrt(n * 3.2));
  const col = i % cols;
  const row = Math.floor(i / cols);
  const jitter = ((i * 2654435761) % 1000) / 1000;
  return {
    x: w * 0.08 + (col / Math.max(cols - 1, 1)) * w * 0.84 + (jitter - 0.5) * 14,
    y: h - 34 - row * 26 - jitter * 10,
    rot: (jitter - 0.5) * 50,
  };
}
