# Jev Instruments

Sixteen interfaces built on typed judgment, sharing one client.

The premise: a Jev answer is a **probability distribution**, not a value. Taking
`argmax` throws away most of what came back. Every instrument here renders the
distribution itself — as a colour band, a surface, a sound, a type size, a
coordinate, or visible grain.

The second premise: ~100ms means judgment can sit **inside** an interface rather
than behind a submit button. Everything updates as you type.

## Deploying

Hosted at **sumitnarang.com/jev** on a Node server. One process serves both the
built app and the API, so the TypeSafe key stays server-side — this app cannot
be a static site the way `gym-cancel` is, because every answer is a live call.

```bash
./deploy/deploy.sh          # build, rsync, restart, health-check
```

First run, on the server:

```bash
sudo mkdir -p /srv/jev && sudo chown deploy:deploy /srv/jev
sudo cp deploy/jev.service /etc/systemd/system/ && sudo systemctl daemon-reload
printf 'TYPESAFE_API_KEY=%s\n' 'sk-...' | sudo tee /srv/jev/.env >/dev/null
sudo chmod 600 /srv/jev/.env && sudo chown deploy:deploy /srv/jev/.env
sudo systemctl enable --now jev
```

Then add `deploy/nginx.conf` inside the existing `server {}` block for the site
and reload nginx. The Node process binds to `127.0.0.1` only, so nginx is the
sole way in.

`base` is `/jev/` in `vite.config.js`, and the client builds its API URL from
`import.meta.env.BASE_URL` — change the base in one place and both the assets
and the endpoint follow.

## Run it

```bash
npm install
cp .env.example .env    # optional — leave TYPESAFE_API_KEY blank to use the stub
npm run dev             # http://localhost:5180
```

Two processes start together: an Express proxy on `:8787` that holds the API key,
and Vite on `:5180`. The key never reaches the browser.

**Without a key** everything still runs against a keyword lexicon in
`server/stub.js`, tagged `source: "stub"` and labelled "offline stub" in the UI.
It exists so the interfaces are buildable before you have access — it is not a
model and its answers are not meaningful.

**The stub only knows the words in its lexicon**, which is a few hundred, mostly
chosen to make the example phrases work. Type anything else and every axis comes
back dead centre: "an angry pirate" and "a shy librarian" produce an identical
face. When the lexicon recognises nothing, the UI now says so above the stage
rather than rendering a confident-looking shrug. Add a key for real answers.

## The instruments

| | What it does | Jev's part |
|---|---|---|
| **material** | Phrase → Three.js physical shader | 5 score axes + metallic `noul` + hue `choice` |
| **sound** | Phrase → Web Audio synth | 5 timbre axes → filter, FM ratio, ADSR, noise bed |
| **typography** | Passage sets its own hierarchy | one score per word, **all in a single call** |
| **semantic space** | Words placed in 3D on named axes | 3 scores per term → x, y, z |
| **entropy** | Generative texture | normalised Shannon entropy per answer → dither density |
| **palette** | Sentence → weighted palette | hue `choice`; band widths **are** the probabilities |
| **stroke** | Description → a brush you draw with | 6 axes → jitter, pressure, speed, wobble, angularity, weight |
| **handwriting** | Describe whose hand it is → rendered text | 6 axes → slant, per-glyph jitter, baseline drift, pressure |
| **a tree** | Describe a tree → it grows one | 8 axes → branch angle, split count, taper, lean, foliage |
| **venn** | Two predicates → a 2D map of 90 items | 180 nouls in one call; position is (p₁, p₂) |
| **the unsure** | Surfaces the 0.4–0.6 band, not the matches | 90 nouls; rank by distance from 0.5 |
| **sediment** | Items settle to a height matching a score | 90 scores; strata instead of a threshold |
| **magnet** | Cursor is a force field | 90 nouls → attraction sign and strength |
| **guess the rule** | It hides a rule, you name it | two rounds of 90 nouls, scored by set overlap |
| **your own stuff** | Same filter over your list or bookmarks | one noul per line you paste |
| **a face** | Describe a person → a drawn face | 10 axes → every line; head follows the cursor |

Three of these are worth a closer look:

**typography** batches one question per word against a single state, so a 30-word
passage costs roughly what one word would. That is the property that makes
per-token interface work affordable at all.

**entropy** is the only one where the *distribution* rather than the answer is
the entire output: colour comes from the top option, grain comes from how
uncertain the model was. A confident band is flat; an unsure one dissolves.

**handwriting** emits the same five values — `slant`, `strokeWidth`,
`baselineWobble`, `flourishScale`, `color`, in the same units and ranges — that
`signature/src/analyzeSignature.js` extracts from a signature image. That project
measures a hand from pixels; this one invents one from a description. The output
is drop-in for `SignatureCanvas`.

## Wiring it to the real API

Put a key in `.env` and restart. One thing to check first:

`server/wire.js` and `server/normalize.js` are the **only** files that know the
wire format — one for requests, one for responses. All 16 instruments speak a
convenient internal shape and never changed when the real format turned out to
differ from the published examples.

**Verified against the live API** (`POST https://api.typesafe.ai/v1/systemone`,
Bearer auth, text only, 64k context / 32k state, errors 401/422/429/529).
Five things differ from what the docs' examples implied, and each one either
422s or silently breaks a renderer:

| | Expected | Actual |
|---|---|---|
| field name | `instruction` | **`instructions`** |
| score levels | `levels: []` | **`criteria: []`** (ordered, min 2) |
| choice options | `options: []` | **`criteria: {}`** (option → description) |
| noul answer | `value` | **`noul`**, and no confidence field |
| score answer | 0–1 scalar | **an index 0…n-1**, with `legend` and `probabilities` keyed by index string |

The score one is the nastiest: an index reads as a valid 0–1 value for the first
two levels and then silently saturates every renderer. `normalizeAnswer` divides
by `n-1` and maps the index back through the caller's own level names.

The stub emits this same shape rather than a convenient one, so the offline path
exercises exactly the same parsing as the live model.

## Corpora

The five predicate instruments read a **pluggable corpus**, picked above the
stage and remembered per browser. Adding one is a file in `shared/corpora/` and
a line in its `index.js`; every instrument picks it up for free.

| Corpus | Items | Renders as | Source |
|---|---|---|---|
| **Dublin restaurants** | 44 | text chips | your own `dublin_food.db` |
| **counties of Ireland** | 32 | text chips | the set is complete by definition |
| **flags** | 48 | images | flagcdn.com (free, no key) |
| **typefaces** | 44 | each name in its own face | Google Fonts |
| **artworks** | 96 | images | Art Institute of Chicago, public domain |
| **spanning set** | 45 | emoji | chosen for coverage — see below |
| **emoji** | 90 | emoji | the original, kept for comparison |

### Small and spanning beats large and categorical

Measured against the live model with a battery of 12 probe predicates:

```
emoji     90 items, chosen by category  → spread 0.371, 82 near-duplicate pairs
spanning  45 items, chosen to differ    → spread 0.387,  7 near-duplicate pairs
```

Half the items, more information. The 90-set wastes slots — 📎≈🖇️ sit 0.022
apart, 🔑≈🗝️ 0.029, 🍎≈🍋 0.041 — those pairs answer every predicate the same
way. Two rules when building one:

1. **Every item must differ from every other on some axis a predicate could
   probe.** Five fruits are one item of information.
2. **Prefer boundary cases to typical members.** 💀 was alive, 🤖 moves but is
   not, 🧊 will cease to exist, 🥚 might become alive, 🌈 has no substance.
   These split predicates; a sixth fruit does not.

`/tmp/coverage.mjs` in the session history measures this; it is worth re-running
on any corpus you add. The artworks set was built from 20 search queries and is
categorical — it would likely trim well.

`scripts/build-artworks.mjs` regenerates the artworks set (no API key needed).
It writes a `.js` module rather than JSON, because Node needs import attributes
for JSON and Vite does not — a plain module is the one form both import the same
way. Each corpus also supplies its own `examples` and `pairWith`, since
"could be eaten" is a poor question to ask a painting.

**Images route through `/api/img`.** Several image hosts, including artic.edu's
IIIF endpoint, refuse a direct browser request regardless of referrer policy but
serve a normal-looking client happily. The proxy adds the right headers, holds a
small in-memory cache, and enforces a host allowlist. Add a host there before
adding a corpus that uses it.

**Jev never sees the pictures** — it reads the title, artist, date and medium.
That rules out "which of these are red" and allows "which was made before 1800".
The gap between what you see and what it reads is the interesting part.

## The predicate instruments

Five of these share a corpus and one call shape:
**the state is the corpus, and each question names one item and carries its own
predicate.** That is what lets `venn` ask two different predicates of ninety
items in a single 180-question call.

Getting that the wrong way round — predicate in the state, item in the question —
looks like it works and silently scores both predicates against the same text.
If you add a sixth, copy `stateFor`/`questions` from `unsure.js`.

Two are worth calling out. **the unsure** ranks by distance from 0.5 rather than
by score, so it surfaces what the model genuinely cannot decide — the part every
other interface throws away. **guess the rule** scores your guess by *behaviour*,
not wording: it compares which items your rule lifts against which the hidden
rule lifted, so "is made of metal" and "a magnet would attract it" count as the
same answer.

## The tree

Recursive branching, seeded from the phrase so the same description always grows
the same tree — click to regrow a variant. Eight axes set trunk thickness and
taper, branch angle, how far each generation shortens, recursion depth, how much
each segment wanders, and the foliage.

Three things took a second pass, and all three are the kind of bug you only see
once it draws:

- **Trunk length must be derived, not chosen.** A branch chain totals
  `len / (1 - shrink)`, so picking a trunk length directly grew the tree off the
  top of the canvas at any generous height score. It is now computed backwards
  from the space available.
- **Wind must not compound.** Applied per segment, a small lean accumulates down
  the recursion and lays the whole tree flat. It is now scaled by remaining
  depth, so the tips bend and the trunk stays planted.
- **Three-way splits cube the branch count.** Left unrestricted, a dense canopy
  at depth 9 is ~20,000 branches. They are now rare and confined to the outer
  half of the tree.

## The face

Every line is computed — there is no artwork in the repo. Ten axes (age, warmth,
energy, formality, confidence, hair, roundness, plus glasses/beard/worry as
yes/no) set the head geometry, brow angle, eye openness, mouth curve and jaw
width.

It is lit by a fixed upper-left key light, and every shadow is a radial
gradient clipped inside the silhouette. **Value, not line, is what makes a
portrait read as solid** — the earlier pure-line version looked like a diagram
no matter how many outlines it had.

What makes it work, in rough order of impact:

- **Form shadow under a single light.** Brow ridge over the sockets, one side
  of the nose bridge, the hollow under each cheekbone, the temples, under the
  lower lip. The most valuable one by far is the jaw's cast shadow down the
  throat: without it the head floats rather than sits on the neck.
- **Asymmetry.** Eye height and size, brow tilt, mouth corners and nose lean
  each differ by a few percent per face, seeded from the phrase. A perfectly
  mirrored face reads as a mask.
- **Eye anatomy.** Warm-grey sclera (never white), a radial iris with a dark
  limbal ring, pupil, two specular highlights placed to match the key light,
  the upper lid's shadow cast across the eyeball, a lash line heavy at the
  outer third, a crease, and a tear duct.
- **Lips with a cupid's bow**, separate upper and lower masses, a highlight on
  the lower lip, and — when the mouth opens — an opening bounded by the bottom
  of the upper lip and the top of the lower, with teeth catching the light.
- **Hair as a lit mass**, not a silhouette: a sheen band where the light grazes
  the skull, dark roots, and 30–50 strands following the curve.

And, still carrying the line work:

- **Catmull-Rom through landmarks.** The skull is eleven control points
  mirrored and splined, so the jaw tapers into the chin. Straight segments
  between raw points gave it flat polygon sides.
- **Tapered strokes.** Line width eases along each path and every stroke has a
  start/end weight, so a brow is heavy at the inner end and fine at the outer.
- **Layered eyes.** Upper and lower lids as separate curves, clipped iris,
  pupil and a specular highlight. The upper lid is drawn heavier — that
  asymmetry is most of what makes an eye look like an eye.
- **Hatching for shadow**, not outline detail: under the jaw, beside the nose,
  under the lower lip.
- **A real hairline** with a widow's peak and temple recession, filled as one
  mass behind and over the skull, rather than a ring of circles.
- **Paper fills** behind the head and torso, so hair and body never show
  through the face.

The head yaws toward the cursor, features parallax across it, and the pupils
track independently — which is the part that actually sells it, because eye
direction is the thing people read first. Click to spin.

Faces are the most legible output in the collection: a 10% shift in one axis is
invisible on a shader and obvious on a face.

## Honest limits

- **The stub is a keyword lexicon.** It cannot judge a word against its sentence,
  so offline typography only shows the *shape* of the idea — real per-word
  emphasis needs the model. Phrases with no lexicon hits come back flat and
  maximally uncertain, which is why an unfamiliar phrase makes every entropy
  band look like static.
- **Jev is text-only**, so there is no image input here and no way to add one
  without a vision model in front.
- **The stub cannot really evaluate a predicate.** Offline it scores tag overlap
  between your words and hand-written tags on each item, with partial credit for
  neighbouring tags — a similarity trick standing in for a judgment. It is good
  enough that "is a vegetable" puts tomato and mushroom in the honest middle,
  and not good enough to trust for anything.
- **The artworks corpus needs a real key to be interesting.** The stub's tag
  trick works on emoji because the tags were written to match common predicates.
  It does not generalise: offline, only date predicates ("made before 1800")
  genuinely work on artworks, and everything else lands near 0.5 with low
  confidence — which is at least the honest answer for "no information".
- **`your own stuff` is stub-blind.** Your pasted lines are not in the corpus, so
  offline it returns noise. That one needs a key to mean anything.
- **The axis mappings are opinions.** Whether "wet" should drive clearcoat rather
  than roughness is a design choice, not a fact. They live at the bottom of each
  demo file and are meant to be argued with.

## Design

The UI borrows its language from `sumit-projects/mountains`, so the two read as
one family:

| | |
|---|---|
| ground | `#f8fafc` (slate-50) |
| ink | `#0f172a`, muted `#5b6a7e` |
| accent | `#2563eb` (blue-600) |
| panels | `rgba(255,255,255,0.75)` + `backdrop-blur(20px)` + `1px solid rgba(255,255,255,0.6)` |
| shadow | `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)` |
| radii | 14 / 20 / 28 |
| type | system sans, `letter-spacing: -0.2px` — no display face, as in mountains |
| scrollbars | 4px, `rgba(148,163,184,0.35)` |

Every token lives at the top of `src/style.css`. The canvas and Three.js
instruments were relit to match: terrain fog and water, the semantic-space
wireframe, the face and stroke canvases, and the material scene's ambient all
changed with the ground, since each had a dark background baked in.

## Layout

```
server/
  index.js       express proxy, holds the key, falls back to stub on API error
  normalize.js   the one place that knows the wire shape
  stub.js        offline keyword lexicon
src/
  lib/jev.js     fetch + cache + debounce, aborts superseded calls
  lib/util.js    entropy, weighted position, hue→hex, seeded rng
  demos/*.js     one file per instrument: questions() + mount()
```

Each demo exports `{ id, short, title, tagline, examples, questions(input), mount(el) }`
and `mount` returns `{ update(answers, input), destroy() }`. Adding an eighth is
one file plus one import in `src/main.js`.
