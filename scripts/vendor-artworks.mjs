// Downloads the artwork thumbnails into public/art/ once, from a machine the
// Art Institute will serve.
//
// Their IIIF endpoint returns 403 to datacenter IPs, so the live image proxy
// cannot fetch them from the server — the files have to ship with the build.
// Run from a normal connection when the corpus changes:
//
//   node scripts/vendor-artworks.mjs
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'art');
await mkdir(outDir, { recursive: true });

const mod = await import(join(root, 'shared/corpora/artworks.js'));
const items = mod.default.items;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
  + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let ok = 0, failed = [];
for (const it of items) {
  const remote = it.remote ?? it.thumb;
  if (!/^https?:/.test(remote)) { ok++; continue; }        // already vendored
  const name = `${it.id}.jpg`;
  try {
    const r = await fetch(remote, { headers: { 'User-Agent': UA, Referer: 'https://www.artic.edu/' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    await writeFile(join(outDir, name), Buffer.from(await r.arrayBuffer()));
    ok++;
  } catch (e) {
    failed.push(`${it.id}: ${e.message}`);
  }
  process.stdout.write(`\r  ${ok}/${items.length}`);
}
console.log(`\n✓ ${ok} saved to public/art/${failed.length ? `, ${failed.length} failed` : ''}`);
failed.slice(0, 5).forEach((f) => console.log('   ', f));
