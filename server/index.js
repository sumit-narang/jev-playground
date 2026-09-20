import express from 'express';
import 'dotenv/config';
import { stubAsk } from './stub.js';
import { normalizeResponse } from './normalize.js';
import { toWire, levelIndex } from './wire.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

const KEY = process.env.TYPESAFE_API_KEY?.trim();
const ASK_URL = process.env.TYPESAFE_URL || 'https://api.typesafe.ai/v1/systemone';
const MODEL = process.env.TYPESAFE_MODEL || 'jev-latest';
const PORT = Number(process.env.PORT || 8787);

// Same response shape whether it came from Jev or the lexicon stub, so the
// instruments never branch on which one answered.
app.post('/api/ask', async (req, res) => {
  const { state, questions } = req.body ?? {};
  if (!state || !questions) {
    return res.status(400).json({ error: 'state and questions are required' });
  }

  const levels = levelIndex(questions);

  if (!KEY) {
    const stubbed = stubAsk(state, questions);
    return res.json({ ...normalizeResponse(stubbed, levels), source: 'stub', recognised: stubbed.recognised });
  }

  try {
    const upstream = await fetch(ASK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ state, model: MODEL, questions: toWire(questions) }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error(`[jev] ${upstream.status} ${detail.slice(0, 300)}`);
      // Keep the instruments playable when the API is unhappy, but say so.
      return res.json({
        ...normalizeResponse(stubAsk(state, questions), levels),
        source: 'stub',
        degraded: { status: upstream.status, detail: detail.slice(0, 300) },
      });
    }

    res.json(normalizeResponse(await upstream.json(), levels));
  } catch (err) {
    console.error('[jev] request failed:', err.message);
    res.json({
      ...normalizeResponse(stubAsk(state, questions), levels),
      source: 'stub',
      degraded: { detail: err.message },
    });
  }
});

// Image proxy. Some museum/art hosts refuse direct browser requests for their
// IIIF derivatives regardless of referrer policy, but serve them happily to a
// normal-looking client. Proxying also means one place to cache and one place
// to add a host.
const IMAGE_HOSTS = new Set([
  'www.artic.edu', 'flagcdn.com',
  'coverartarchive.org', 'ia801504.us.archive.org',
  'image.tmdb.org', 'covers.openlibrary.org', 'api.deezer.com',
  'e-cdns-images.dzcdn.net', 'cdn-images.dzcdn.net',
]);
const BROWSERISH = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
  + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const imgCache = new Map(); // url -> {type, buf}
const IMG_CACHE_MAX = 400;

app.get('/api/img', async (req, res) => {
  const raw = req.query.u;
  if (typeof raw !== 'string') return res.status(400).end('missing u');
  let url;
  try { url = new URL(raw); } catch { return res.status(400).end('bad url'); }
  if (url.protocol !== 'https:' || !IMAGE_HOSTS.has(url.hostname)) {
    return res.status(403).end('host not allowed');
  }

  const hit = imgCache.get(url.href);
  if (hit) {
    res.set('content-type', hit.type).set('cache-control', 'public, max-age=86400');
    return res.end(hit.buf);
  }

  try {
    const up = await fetch(url, {
      headers: {
        'User-Agent': BROWSERISH,
        'Referer': `${url.origin}/`,
        'Accept': 'image/avif,image/webp,image/jpeg,image/png,*/*',
      },
    });
    if (!up.ok) return res.status(502).end(`upstream ${up.status}`);
    const type = up.headers.get('content-type') ?? 'image/jpeg';
    const buf = Buffer.from(await up.arrayBuffer());
    if (imgCache.size >= IMG_CACHE_MAX) imgCache.delete(imgCache.keys().next().value);
    imgCache.set(url.href, { type, buf });
    res.set('content-type', type).set('cache-control', 'public, max-age=86400').end(buf);
  } catch (err) {
    res.status(502).end(err.message);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, mode: KEY ? 'jev' : 'stub', model: KEY ? MODEL : 'stub-lexicon' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[server] http://127.0.0.1:${PORT}  mode=${KEY ? 'jev' : 'stub (no TYPESAFE_API_KEY)'}`);
});
