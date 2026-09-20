// Browser-side client. The key never reaches here — server/index.js holds it.

const cache = new Map();
let inflight = null;

// `supersede` is for the typing path: a new keystroke should cancel the request
// the previous one started. Calls an instrument makes on its own behalf must not
// cancel that, or the two races kill each other.
export async function ask(state, questions, { supersede = false } = {}) {
  const key = JSON.stringify([state, questions]);
  if (cache.has(key)) return cache.get(key);

  const controller = new AbortController();
  if (supersede) {
    inflight?.abort();
    inflight = controller;
  }

  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ state, questions }),
    signal: controller.signal,
  });
  if (!res.ok) throw new Error(`ask failed: ${res.status}`);

  const data = await res.json();
  cache.set(key, data);
  return data;
}

// Trailing-edge debounce that swallows the AbortError from a superseded call.
export function debounce(fn, ms = 220) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => {
      Promise.resolve(fn(...args)).catch((e) => {
        if (e.name !== 'AbortError') console.error(e);
      });
    }, ms);
  };
}

export async function health() {
  try {
    return await (await fetch('/api/health')).json();
  } catch {
    return { ok: false, mode: 'offline' };
  }
}
