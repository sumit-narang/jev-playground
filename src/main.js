import './style.css';
import { ask, debounce } from './lib/jev.js';
import { CORPORA, activeCorpus, setCorpus } from './lib/pile.js';

import stroke from './demos/stroke.js';
import tree from './demos/tree.js';
import sediment from './demos/sediment.js';

// The rest are parked in src/demos/_parked — unregistered, not deleted.
// The three phrase-driven instruments are tabs in their own right. Sediment is
// not: it is reached through the corpus tabs, since picking "Flags" means
// "sediment, over flags".
const DEMOS = [stroke, tree];

const app = document.querySelector('#app');
app.innerHTML = `
  <header>
    <h1>Jev playground</h1>
    <p class="sub">Eight views built on typed judgment. The probability distribution is the output, not a detail of it.</p>
    <nav id="nav"></nav>
  </header>
  <main>
    <section class="control">
      <div id="input-slot" class="search"></div>
      <div id="examples" class="examples"></div>
      <p id="warn" class="warn" hidden></p>
    </section>
    <section class="stage-wrap"><div id="stage" class="stage"></div></section>
    <section class="readout-col">
      <div class="readout"><h2 id="demo-title"></h2><p id="demo-tag"></p><dl id="readout"></dl></div>
      <p id="status" class="status"></p>
    </section>
  </main>`;

const nav = document.querySelector('#nav');
const stage = document.querySelector('#stage');
const inputSlot = document.querySelector('#input-slot');
const examplesEl = document.querySelector('#examples');
const warnEl = document.querySelector('#warn');
const statusEl = document.querySelector('#status');
const readoutEl = document.querySelector('#readout');

let current = null;
let instance = null;
let inputEl = null;

function run(text) {
  const value = text.trim();
  if (!value) { statusEl.textContent = ''; return; }
  const questions = current.questions(value, instance);
  if (!Object.keys(questions).length) return;
  // Some instruments send more than the text box (a second predicate, a pasted
  // list). stateFor lets them build the payload; the rest just send the phrase.
  const state = current.stateFor ? current.stateFor(value, instance) : value;

  statusEl.textContent = 'Asking…';
  const t0 = performance.now();

  ask(state, questions, { supersede: true })
    .then((res) => {
      const rows = instance.update(res.answers, value) ?? [];
      readoutEl.replaceChildren();
      // Level names arrive as tokens ("middle_aged", "bare_rock"). Capitalising
      // without unpicking the underscore gives "Middle_aged", so do both.
      const pretty = (t) => {
        const x = String(t).replace(/_/g, ' ');
        return x.charAt(0).toUpperCase() + x.slice(1);
      };
      for (const [k, v] of rows) {
        const dt = document.createElement('dt'); dt.textContent = pretty(k);
        const dd = document.createElement('dd'); dd.textContent = pretty(v);
        readoutEl.append(dt, dd);
      }
      const ms = Math.round(performance.now() - t0);
      statusEl.textContent =
        `${Object.keys(questions).length} questions · ${ms}ms · ${res.source === 'stub' ? 'lexicon stub' : res.model}` +
        (res.degraded ? ` · API error, fell back (${res.degraded.status ?? res.degraded.detail})` : '');

      // The offline stub only knows the words in its lexicon. Saying so beats
      // silently rendering the same neutral output for every unknown phrase.
      const blind = res.source === 'stub' && !res.recognised;
      warnEl.hidden = !blind;
      if (blind) {
        warnEl.innerHTML = 'The offline stub does not know any of these words, so every answer '
          + 'below is a shrug — you will get the same result for any unfamiliar phrase. '
          + 'Add <code>TYPESAFE_API_KEY</code> to <code>.env</code> and restart for real answers, '
          + 'or try one of the examples above.';
      }
    })
    .catch((e) => {
      if (e.name !== 'AbortError') statusEl.textContent = `failed: ${e.message}`;
    });
}

const runDebounced = debounce(run, 260);

function select(demo) {
  if (instance) { instance.destroy(); instance = null; }
  stage.replaceChildren();
  current = demo;

  document.querySelector('#demo-title').textContent = demo.short ?? demo.title;
  document.querySelector('#demo-tag').textContent = demo.tagline;
  readoutEl.replaceChildren();
  warnEl.hidden = true;
  // A corpus tab is current when Sediment is showing AND that corpus is active.
  const corpusId = activeCorpus().id;
  for (const b of nav.querySelectorAll('button')) {
    const on = b.dataset.corpus
      ? demo.id === CORPUS_DEMO.id && b.dataset.corpus === corpusId
      : b.dataset.id === demo.id;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', String(on));
  }

  inputSlot.replaceChildren();
  inputEl = document.createElement(demo.multiline ? 'textarea' : 'input');
  inputEl.className = 'phrase';
  inputEl.placeholder = 'Type something...';
  if (demo.multiline) inputEl.rows = 3;
  const suggestions = (demo.usesCorpus && activeCorpus().examples) || demo.examples;
  inputEl.value = suggestions[0];
  inputEl.addEventListener('input', () => runDebounced(inputEl.value));
  inputSlot.append(inputEl);

  examplesEl.replaceChildren();
  for (const ex of suggestions) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    // The search is filled with exactly what the hint shows, so the two agree.
    const shown = ex.charAt(0).toUpperCase() + ex.slice(1);
    b.textContent = shown;
    b.addEventListener('click', () => { inputEl.value = shown; run(shown); });
    examplesEl.append(b);
  }

  // A corpus can ship its own webfonts (typefaces). Load once, on demand —
  // 44 font families is not something to pull in for every other corpus.
  if (demo.usesCorpus) {
    const { fontsUrl, id } = activeCorpus();
    if (fontsUrl && !document.getElementById(`fonts-${id}`)) {
      const link = document.createElement('link');
      link.id = `fonts-${id}`;
      link.rel = 'stylesheet';
      link.href = fontsUrl;
      document.head.append(link);
    }
  }

  instance = demo.mount(stage, { rerun: () => run(inputEl.value) });
  run(inputEl.value);
}

const CORPUS_DEMO = sediment;

const tab = (label, wire) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.role = 'tab';
  b.textContent = label;
  wire(b);
  nav.append(b);
  return b;
};

for (const d of DEMOS) {
  tab(d.short ?? d.title, (b) => {
    b.dataset.id = d.id;
    b.addEventListener('click', () => { location.hash = d.id; });
  });
}
// Corpus tabs: each one means "Sediment, over this corpus".
for (const c of CORPORA) {
  const label = `${c.name.charAt(0).toUpperCase()}${c.name.slice(1)} (${c.items.length})`;
  tab(label, (btn) => {
    btn.dataset.corpus = c.id;
    btn.addEventListener('click', () => {
      setCorpus(c.id);
      if (location.hash.slice(1) === c.id) select(CORPUS_DEMO);
      else location.hash = c.id;
    });
  });
}

function fromHash() {
  const id = location.hash.slice(1);
  const demo = DEMOS.find((d) => d.id === id);
  if (demo) return demo;
  const corpus = CORPORA.find((c) => c.id === id);
  if (corpus) { setCorpus(corpus.id); return CORPUS_DEMO; }
  return DEMOS[0];
}

window.addEventListener('hashchange', () => select(fromHash()));
select(fromHash());
