// Offline stand-in for Jev, so every instrument runs before you have a key.
//
// It is a keyword lexicon, not a model: it nudges each named axis toward a
// target and spreads a soft distribution around it. Confidence falls out of how
// much lexical evidence a phrase actually gave us — few hits, flat curve. That
// mirrors the real thing closely enough to build interfaces against, and not at
// all closely enough to trust. Every response is tagged source:"stub".

import { ALL_BY_NAME } from '../shared/corpora/index.js';
import { PREDICATE_TAGS } from '../shared/predicate-tags.js';

const clamp01 = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));

// Predicate instruments ask "does <item> satisfy <free text>?". A lexicon cannot
// actually answer that, so offline we score tag overlap between the predicate
// and the item. It is a similarity trick standing in for a judgment.
const ERA_YEAR = {
  medieval: 1400, renaissance: 1600, baroque: 1750,
  nineteenth_century: 1860, early_modern: 1920, contemporary: 1990,
};

function predicateScore(predicate, itemName) {
  const item = ALL_BY_NAME[itemName];
  if (!item) return null;

  // "made before 1800" / "after 1900" is arithmetic, and the corpus carries an
  // era tag, so this one the stub can answer honestly.
  const dateMatch = String(predicate).match(/\b(before|after|older than|newer than)\b[^0-9]*(\d{3,4})/i);
  if (dateMatch) {
    const era = Object.keys(ERA_YEAR).find((e) => item.tags.includes(e));
    if (era) {
      const year = ERA_YEAR[era];
      const want = Number(dateMatch[2]);
      const before = /before|older/i.test(dateMatch[1]);
      const diff = before ? want - year : year - want;
      return clamp01(0.5 + Math.max(-1, Math.min(1, diff / 160)) * 0.44);
    }
  }
  const words = String(predicate).toLowerCase().match(/[a-z]+/g) ?? [];
  const wanted = new Set();
  // Crude stemming: the lexicon holds "eat", people type "eaten"/"edible".
  const forms = (w) => [w, w.replace(/(en|ed|ing|s)$/, ''), w.replace(/ies$/, 'y'), `${w}e`];
  for (const w of words) {
    for (const f of forms(w)) {
      for (const t of PREDICATE_TAGS[f] ?? []) wanted.add(t);
      if (item.tags.includes(f)) wanted.add(f);
    }
  }
  if (!wanted.size) return null;

  // Exact matches are strong evidence; neighbouring tags are partial. Without
  // this the stub is purely bimodal (0.1 or 0.9) and instruments that look for
  // genuine ambiguity have no middle to find.
  let score = 0;
  for (const t of wanted) {
    if (item.tags.includes(t)) score += 1;
    else if ((ADJACENT[t] ?? []).some((n) => item.tags.includes(n))) score += 0.45;
  }
  return clamp01(0.16 + (score / wanted.size) * 0.7);
}

// Tags that make an item "sort of" satisfy a predicate.
const ADJACENT = {
  vegetable: ['food', 'plant', 'natural', 'edible', 'fruit'],
  fruit: ['food', 'vegetable', 'sweet', 'natural', 'edible'],
  edible: ['food', 'liquid', 'plant'],
  food: ['edible', 'liquid', 'plant'],
  metal: ['hard', 'manmade', 'tool', 'electronic'],
  alive: ['animal', 'plant', 'natural'],
  animal: ['alive', 'natural', 'soft'],
  plant: ['natural', 'alive', 'food'],
  natural: ['plant', 'animal', 'alive'],
  sharp: ['hard', 'tool', 'dangerous'],
  dangerous: ['sharp', 'hot', 'hard'],
  heavy: ['hard', 'metal'],
  light: ['small', 'soft'],
  fragile: ['light', 'round'],
  soft: ['light', 'clothing'],
  hard: ['metal', 'heavy'],
  electronic: ['metal', 'manmade'],
  tool: ['metal', 'manmade', 'hard'],
  toy: ['light', 'round', 'manmade'],
  music: ['manmade', 'hard'],
  clothing: ['soft', 'light'],
  vehicle: ['metal', 'heavy'],
  writing: ['manmade', 'light'],
  valuable: ['metal', 'small', 'electronic'],
  small: ['light'],
  round: ['toy'],
  liquid: ['cold', 'food'],
  hot: ['dangerous'],
  cold: ['liquid'],
  manmade: ['tool', 'electronic'],
};

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

// word -> axis nudges (-1..1), plus optional hue vote
const LEXICON = {
  moss:      { roughness: 0.30, wetness: 0.35, hardness: -0.30, gloss: -0.20, concrete: 0.25, hue: 'green' },
  stone:     { roughness: 0.25, hardness: 0.40, warmth: -0.20, gloss: -0.20, concrete: 0.35, hue: 'grey' },
  rock:      { roughness: 0.30, hardness: 0.42, warmth: -0.18, concrete: 0.35, hue: 'grey' },
  wall:      { hardness: 0.25, roughness: 0.15, concrete: 0.30, hue: 'grey' },
  rust:      { roughness: 0.35, metallic: 0.45, gloss: -0.30, grain: 0.40, hue: 'orange' },
  rusty:     { roughness: 0.35, metallic: 0.45, gloss: -0.30, grain: 0.40, hue: 'orange' },
  hinge:     { metallic: 0.40, hardness: 0.35, attack: 0.30, concrete: 0.30, hue: 'grey' },
  metal:     { metallic: 0.60, hardness: 0.45, warmth: -0.25, gloss: 0.25, hue: 'grey' },
  steel:     { metallic: 0.65, hardness: 0.50, warmth: -0.30, gloss: 0.35, hue: 'blue' },
  chrome:    { metallic: 0.70, gloss: 0.55, roughness: -0.45, hue: 'grey' },
  glass:     { gloss: 0.55, roughness: -0.50, hardness: 0.35, warmth: -0.15, hue: 'blue' },
  mirror:    { gloss: 0.60, roughness: -0.55, metallic: 0.40 },
  silk:      { roughness: -0.40, gloss: 0.30, hardness: -0.45, warmth: 0.15, hue: 'pink' },
  velvet:    { roughness: 0.15, gloss: -0.40, hardness: -0.45, warmth: 0.30, hue: 'purple' },
  wool:      { roughness: 0.25, gloss: -0.40, hardness: -0.40, warmth: 0.40, hue: 'brown' },
  fur:       { roughness: 0.20, hardness: -0.50, warmth: 0.45, gloss: -0.30, hue: 'brown' },
  skin:      { roughness: -0.10, hardness: -0.30, warmth: 0.40, wetness: 0.10, hue: 'pink' },
  bark:      { roughness: 0.45, hardness: 0.30, gloss: -0.35, warmth: 0.15, hue: 'brown' },
  wood:      { roughness: 0.20, hardness: 0.30, warmth: 0.35, gloss: -0.10, hue: 'brown' },
  sand:      { roughness: 0.40, hardness: -0.10, warmth: 0.35, gloss: -0.40, grain: 0.45, hue: 'yellow' },
  ice:       { gloss: 0.45, roughness: -0.35, hardness: 0.40, warmth: -0.70, wetness: 0.40, hue: 'blue' },
  snow:      { roughness: 0.10, hardness: -0.30, warmth: -0.60, gloss: -0.20, hue: 'white' },
  water:     { wetness: 0.70, gloss: 0.45, hardness: -0.60, hue: 'blue' },
  wet:       { wetness: 0.60, gloss: 0.35 },
  damp:      { wetness: 0.40, gloss: 0.15, warmth: -0.15 },
  rain:      { wetness: 0.55, gloss: 0.30, warmth: -0.25, hue: 'grey' },
  dry:       { wetness: -0.55, gloss: -0.20 },
  dust:      { roughness: 0.30, gloss: -0.45, wetness: -0.40, grain: 0.35, hue: 'brown' },
  ash:       { roughness: 0.25, gloss: -0.45, warmth: -0.10, hue: 'grey' },
  ember:     { warmth: 0.75, gloss: 0.20, brightness: 0.40, hue: 'orange' },
  fire:      { warmth: 0.85, brightness: 0.55, energy: 0.60, hue: 'orange' },
  sun:       { warmth: 0.65, brightness: 0.60, energy: 0.40, hue: 'yellow' },
  summer:    { warmth: 0.55, brightness: 0.45, energy: 0.35, hue: 'yellow' },
  winter:    { warmth: -0.60, brightness: -0.25, energy: -0.25, hue: 'blue' },
  night:     { brightness: -0.60, warmth: -0.25, energy: -0.30, hue: 'navy' },
  dawn:      { brightness: 0.25, warmth: 0.20, energy: -0.10, hue: 'pink' },
  dublin:    { wetness: 0.25, warmth: -0.15, hue: 'grey' },
  tuesday:   { energy: -0.25, brightness: -0.10 },
  velour:    { roughness: 0.10, gloss: -0.35, hardness: -0.40 },
  tomato:    { wetness: 0.35, gloss: 0.35, hardness: -0.20, hue: 'red' },
  vine:      { roughness: 0.20, hardness: -0.20, hue: 'green' },
  leaf:      { hardness: -0.35, roughness: -0.05, hue: 'green' },
  grass:     { roughness: 0.15, hardness: -0.35, wetness: 0.15, hue: 'green' },
  blood:     { wetness: 0.55, gloss: 0.30, hue: 'red' },
  gold:      { metallic: 0.70, gloss: 0.50, warmth: 0.40, hue: 'yellow' },
  copper:    { metallic: 0.65, gloss: 0.30, warmth: 0.40, hue: 'orange' },
  concrete:  { roughness: 0.35, hardness: 0.50, warmth: -0.20, gloss: -0.30, hue: 'grey' },
  plastic:   { gloss: 0.30, roughness: -0.20, hardness: 0.10, hue: 'white' },
  paper:     { roughness: 0.10, gloss: -0.35, hardness: -0.25, hue: 'white' },
  // sound-leaning
  bell:      { brightness: 0.55, metallic: 0.55, decay: -0.45, attack: 0.50 },
  scream:    { brightness: 0.60, grain: 0.50, energy: 0.70, register: 0.55, emphasis: 0.60 },
  whisper:   { brightness: -0.30, grain: 0.25, energy: -0.55, emphasis: -0.55 },
  hum:       { brightness: -0.35, grain: -0.25, decay: 0.40, register: -0.30 },
  thunder:   { brightness: -0.45, grain: 0.55, register: -0.60, energy: 0.65, hue: 'navy' },
  creak:     { grain: 0.55, brightness: -0.10, attack: 0.20 },
  squeal:    { brightness: 0.65, register: 0.65, grain: 0.35 },
  // motion / stroke
  nervous:   { jitter: 0.65, speed: 0.35, wobble: 0.55, pressure: -0.25, energy: 0.40 },
  confident: { jitter: -0.60, speed: 0.40, wobble: -0.55, pressure: 0.45, weight: 0.40 },
  hesitant:  { jitter: 0.40, speed: -0.55, wobble: 0.35, pressure: -0.40 },
  sweep:     { speed: 0.55, jitter: -0.35, weight: 0.25 },
  sharp:     { angularity: 0.60, jitter: -0.20, attack: 0.55, brightness: 0.35 },
  soft:      { hardness: -0.55, roughness: -0.35, angularity: -0.45, brightness: -0.20 },
  heavy:     { weight: 0.60, hardness: 0.35, speed: -0.30, register: -0.40 },
  light:     { weight: -0.50, brightness: 0.35, speed: 0.25 },
  slow:      { speed: -0.60, attack: -0.45, energy: -0.35 },
  fast:      { speed: 0.65, attack: 0.50, energy: 0.45 },
  quiet:     { energy: -0.50, brightness: -0.25, emphasis: -0.45 },
  loud:      { energy: 0.60, brightness: 0.30, emphasis: 0.55 },
  // abstractness
  idea:      { concrete: -0.60 }, freedom: { concrete: -0.70 }, justice: { concrete: -0.70 },
  hope:      { concrete: -0.55, warmth: 0.30 }, grief: { concrete: -0.45, warmth: -0.30, energy: -0.40 },
  // handwriting
  doctor:     { speed: 0.42, consistency: 0.40, slant: 0.25, flourish: -0.30, wobble: 0.25 },
  hurried:    { speed: 0.45, consistency: 0.35, wobble: 0.28 },
  careful:    { speed: -0.45, consistency: -0.40, wobble: -0.35, pressure: 0.15 },
  schoolchild:{ speed: -0.35, consistency: -0.20, slant: -0.25, pressure: 0.25, flourish: -0.15 },
  copperplate:{ flourish: 0.50, consistency: -0.42, slant: 0.35, speed: -0.35 },
  wedding:    { flourish: 0.35, consistency: -0.25 },
  ransom:     { consistency: 0.50, wobble: 0.35, pressure: 0.30, flourish: -0.35 },
  fortieth:   { speed: 0.40, consistency: 0.35, flourish: -0.35, pressure: -0.25 },
  form:       { speed: 0.20, flourish: -0.25 },
  signing:    { flourish: 0.25, speed: 0.20 },
  cold:       { wobble: 0.30, consistency: 0.25, warmth: -0.55 },
  ballpoint:  { pressure: 0.25, flourish: -0.15 },
  scrawl:     { speed: 0.55, consistency: 0.45, wobble: 0.40, flourish: -0.30 },
  // terrain
  moor:       { ruggedness: -0.20, relief: -0.20, vegetation: 0.30, water: 0.30, erosion: -0.15, detail: -0.25 },
  windswept:  { vegetation: -0.15, erosion: 0.05, detail: -0.20, relief: -0.10 },
  burren:     { ruggedness: 0.35, vegetation: -0.45, erosion: 0.40, relief: -0.10, detail: 0.35 },
  badlands:   { ruggedness: 0.45, erosion: 0.55, vegetation: -0.50, relief: 0.20, detail: 0.30 },
  eroded:     { erosion: 0.55, ruggedness: 0.25 },
  gullied:    { erosion: 0.50, detail: 0.30 },
  farmland:   { ruggedness: -0.40, relief: -0.35, vegetation: 0.45, erosion: -0.35, detail: -0.30 },
  rolling:    { ruggedness: -0.35, relief: -0.20, erosion: -0.30 },
  alpine:     { ruggedness: 0.45, relief: 0.55, erosion: 0.35, vegetation: -0.30, warmth: -0.45 },
  ridge:      { ruggedness: 0.35, relief: 0.40, erosion: 0.35 },
  estuary:    { water: 0.55, relief: -0.40, ruggedness: -0.30, vegetation: 0.15 },
  drowned:    { water: 0.50, relief: -0.25 },
  bog:        { water: 0.45, relief: -0.35, vegetation: 0.25, ruggedness: -0.30 },
  desert:     { vegetation: -0.60, water: -0.55, erosion: 0.25, warmth: 0.45 },
  valley:     { erosion: 0.35, relief: 0.20 },
  cliff:      { relief: 0.50, ruggedness: 0.45, vegetation: -0.30 },
  plain:      { ruggedness: -0.50, relief: -0.45, detail: -0.35 },
  // faces
  professor:  { age: 0.30, glasses: 0.45, formality: 0.15, confidence: 0.15, hair: -0.15 },
  tired:      { energy: -0.45, worry: 0.15, formality: -0.20 },
  exhausted:  { energy: -0.55, worry: 0.20 },
  child:      { age: -0.55, energy: 0.35, roundness: 0.35, warmth: 0.25, hair: 0.10 },
  delighted:  { warmth: 0.50, energy: 0.40, confidence: 0.20 },
  birthday:   { warmth: 0.35, energy: 0.35 },
  grandmother:{ age: 0.45, warmth: 0.35, roundness: 0.20, glasses: 0.30 },
  kindly:     { warmth: 0.45, confidence: 0.10 },
  eighty:     { age: 0.50 },
  bank:       { formality: 0.40, warmth: -0.30, confidence: 0.30 },
  manager:    { formality: 0.35, confidence: 0.30 },
  refusing:   { warmth: -0.40, confidence: 0.25 },
  nervous:    { worry: 0.50, confidence: -0.45, energy: 0.25 },
  speech:     { worry: 0.25, formality: 0.30 },
  awful:      { worry: 0.55, warmth: -0.35, energy: 0.20 },
  sharp:      { energy: 0.30, confidence: 0.30, angularity: 0.60, attack: 0.55, brightness: 0.35 },
  beard:      { beard: 0.55 },
  bald:       { hair: -0.60 },
  brick:     { concrete: 0.60, hardness: 0.45, roughness: 0.30, hue: 'red' },
  // Emphasis-bearing words. A lexicon cannot weigh a word against its sentence,
  // so offline typography is a hint at the shape, not the real instrument.
  not:       { emphasis: 0.35 }, never: { emphasis: 0.45 }, must: { emphasis: 0.40 },
  warning:   { emphasis: 0.50 }, danger: { emphasis: 0.50 }, urgent: { emphasis: 0.45 },
  nobody:    { emphasis: 0.40 }, now:  { emphasis: 0.35 }, pushed: { emphasis: 0.40 },
  unsuccessful: { emphasis: 0.35 }, regret: { emphasis: 0.30 }, do: { emphasis: 0.25 },
  the:  { emphasis: -0.34 }, a: { emphasis: -0.34 }, an: { emphasis: -0.32 },
  of:   { emphasis: -0.30 }, to: { emphasis: -0.28 }, it: { emphasis: -0.24 },
  was:  { emphasis: -0.22 }, is: { emphasis: -0.22 }, that: { emphasis: -0.26 },
  did:  { emphasis: -0.18 }, we: { emphasis: -0.16 }, you: { emphasis: -0.12 },
  your: { emphasis: -0.22 }, in: { emphasis: -0.30 }, on: { emphasis: -0.28 },
  hammer:    { concrete: 0.60, hardness: 0.55, metallic: 0.40, weight: 0.45 },
};

const HUES = ['red','orange','yellow','green','teal','blue','navy','purple','pink','brown','grey','white','black'];

// Function words live in the lexicon because the typography instrument scores
// them (articles are unstressed). They carry no meaning for anything else, so
// they must not count as "the stub understood this phrase".
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'it', 'was', 'is', 'that',
  'did', 'we', 'you', 'your', 'in', 'on', 'do',
]);

function evidence(phrase) {
  const words = String(phrase).toLowerCase().match(/[a-z]+/g) ?? [];
  const axes = {};
  const hues = {};
  let hits = 0;
  for (const w of words) {
    const entry = LEXICON[w] ?? LEXICON[w.replace(/s$/, '')];
    if (!entry) continue;
    if (!FUNCTION_WORDS.has(w)) hits++;
    for (const [k, v] of Object.entries(entry)) {
      if (k === 'hue') hues[v] = (hues[v] ?? 0) + 1;
      else axes[k] = (axes[k] ?? 0) + v;
    }
  }
  return { axes, hues, hits, words };
}

// The API returns a score as an INDEX with an index-keyed legend and
// probabilities. The stub mirrors that exactly, so one normaliser serves both
// and the stub actually exercises the same parsing path as the live model.
function scoreAnswer(levels, ps) {
  const top = ps.indexOf(Math.max(...ps));
  const mean = ps.reduce((sum, pv, i) => sum + pv * i, 0);
  return {
    type: 'score',
    score: mean,
    legend: Object.fromEntries(levels.map((l, i) => [String(i), l])),
    probabilities: Object.fromEntries(ps.map((pv, i) => [String(i), pv])),
    confidence: ps[top],
  };
}

// Soft distribution over n ordered levels, peaked at target (0..1).
function spread(n, target, sharpness) {
  const peak = target * (n - 1);
  // Floor the spread hard: a real model keeps mass on neighbouring levels, and
  // the entropy instrument is only interesting if the stub does too.
  const sigma = Math.max(0.78, (1 - sharpness) * (n / 1.7));
  const raw = Array.from({ length: n }, (_, i) =>
    Math.exp(-((i - peak) ** 2) / (2 * sigma * sigma)));
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((r) => r / sum);
}

function axisKey(id, instruction) {
  const hay = `${id} ${instruction ?? ''}`.toLowerCase();
  const known = ['age','confidence','formality','roundness','glasses','beard','worry','hair',
    'roughness','gloss','hardness','warmth','wetness','metallic','brightness',
    'grain','attack','decay','register','density','energy','emphasis','concrete','speed',
    'jitter','pressure','wobble','angularity','weight','saturation','lightness',
    'slant','flourish','consistency','ruggedness','relief','erosion','vegetation','detail','water'];
  return known.find((k) => hay.includes(k)) ?? id;
}

export function stubAsk(state, questions) {
  const phrase = typeof state === 'string' ? state : JSON.stringify(state);
  const { axes, hues, hits } = evidence(phrase);
  const answers = {};
  // How many words the lexicon actually recognised. Zero means every answer
  // below is a shrug, and the UI needs to say so rather than draw a confident
  // face from nothing.
  let recognised = hits;

  for (const [name, q] of Object.entries(questions)) {
    const key = axisKey(name, q.instruction);

    // Item questions quote the item name; the predicate is the state.
    const itemName = q.instruction?.match(/item "([^"]+)"/i)?.[1];
    if (itemName) {
      // Each question is self-contained: "Item "key" (K) - <predicate>?"
      const predicate = q.instruction.split('—').slice(1).join('—') || phrase;
      const ps = predicateScore(predicate, itemName);
      // No tag overlap means the lexicon has nothing to say. The honest
      // stand-in is "around 0.5, low confidence" — scattered near the middle —
      // not a confident no, which is what a low fallback would fake.
      const v = ps === null
        ? clamp01(0.5 + (hash(predicate + itemName) - 0.5) * 0.7)
        : clamp01(ps + (hash(predicate + itemName) - 0.5) * 0.12);
      if (q.type === 'score') {
        const levels = q.levels ?? ['very_low', 'low', 'mid', 'high', 'very_high'];
        const psp = spread(levels.length, v, 0.45);
        answers[name] = scoreAnswer(levels, psp);
      } else {
        answers[name] = { type: 'noul', noul: v };
      }
      continue;
    }

    // Questions that quote a specific term ("...word 3 (\"pushed\")...") must be
    // scored against THAT term, not the whole phrase - otherwise every word in a
    // sentence inherits one sentence-level value and the type comes out flat.
    const quoted = q.instruction?.match(/"([^"]+)"/)?.[1];
    const local = quoted ? evidence(quoted) : null;
    if (local?.hits) recognised = Math.max(recognised, local.hits);
    const nudge = (local ? local.axes[key] : axes[key]) ?? 0;

    const jitter = (hash((quoted ?? phrase) + name) - 0.5) * 0.12;
    const target = clamp01(0.5 + nudge + jitter);
    const localHits = local ? local.hits : hits;
    const sharpness = clamp01(0.2 + Math.min(localHits, 4) * 0.11 + Math.abs(nudge) * 0.35, 0, 0.8);

    if (q.type === 'noul') {
      // With no lexical evidence a yes/no should sit low, not at a coin flip:
      // most things are not metallic. Evidence pulls it up from there.
      const base = clamp01(0.3 + nudge * 1.15 + jitter);
      answers[name] = { type: 'noul', noul: base };
    } else if (q.type === 'choice') {
      const opts = q.options ?? [];
      const isHue = opts.some((o) => HUES.includes(o));
      const weights = opts.map((o, i) => {
        if (isHue) return (hues[o] ?? 0) * 3 + 0.35 + hash(phrase + o) * 0.5;
        return 0.4 + hash(phrase + name + o) * 1.2 + (phrase.toLowerCase().includes(o) ? 2.5 : 0);
      });
      const sum = weights.reduce((a, b) => a + b, 0);
      const probabilities = Object.fromEntries(opts.map((o, i) => [o, weights[i] / sum]));
      const choice = opts[weights.indexOf(Math.max(...weights))];
      const top = Math.max(...weights) / sum;
      answers[name] = { type: 'choice', choice, probabilities, confidence: top };
    } else {
      const levels = q.levels ?? ['very_low', 'low', 'mid', 'high', 'very_high'];
      const ps = spread(levels.length, target, sharpness);
      answers[name] = scoreAnswer(levels, ps);
    }
  }
  return {
    model: 'stub-lexicon',
    answers,
    recognised,
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}
