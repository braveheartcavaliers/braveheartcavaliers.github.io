// Builds the public website into _site/ and shrinks photos so pages load fast.
// Runs automatically on GitHub (see .github/workflows/deploy.yml).
// The original photos stay untouched in the repository.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const OUT = '_site';
const PUBLIC = ['index.html', 'favicon.svg', 'data', 'images'];
const MAX_SIDE = 1600;

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const item of PUBLIC) {
  try { await cp(item, path.join(OUT, item), { recursive: true }); }
  catch (err) { if (err.code !== 'ENOENT') throw err; }
}
await writeFile(path.join(OUT, '.nojekyll'), '');

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else yield full;
  }
}

let saved = 0;
for await (const file of files(path.join(OUT, 'images'))) {
  const ext = path.extname(file).toLowerCase();
  if (['.heic', '.heif'].includes(ext)) {
    console.warn(`::warning::${file} is an iPhone HEIC photo, which most browsers cannot show. Please upload a JPG instead.`);
    continue;
  }
  if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;
  try {
    const before = (await stat(file)).size;
    let img = sharp(await readFile(file), { failOn: 'none' })
      .rotate() // apply the phone's orientation so photos are never sideways
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true });
    if (ext === '.png') img = img.png({ compressionLevel: 9 });
    else if (ext === '.webp') img = img.webp({ quality: 80 });
    else img = img.jpeg({ quality: 80, mozjpeg: true });
    const out = await img.toBuffer();
    if (out.length < before) {
      await writeFile(file, out);
      saved += before - out.length;
      console.log(`${file}: ${(before / 1024).toFixed(0)} KB -> ${(out.length / 1024).toFixed(0)} KB`);
    }
  } catch (err) {
    console.warn(`::warning::Could not process ${file}: ${err.message}`);
  }
}
console.log(`Done. Photos are ${(saved / 1048576).toFixed(1)} MB smaller.`);
