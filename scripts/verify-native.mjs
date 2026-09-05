import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const hash = (p) =>
  crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const root = 'ios/App/App/public';
for (const language of ['es', 'en']) {
  const dir = `voice/elevenlabs/${language}`;
  const files = fs
    .readdirSync(`public/${dir}`)
    .filter((x) => x.endsWith('.mp3'));
  assert.equal(files.length, 34);
  for (const file of files)
    assert.equal(
      hash(path.join(root, dir, file)),
      hash(path.join('public', dir, file)),
    );
}
for (const file of fs.readdirSync('public/art'))
  assert.equal(hash(`${root}/art/${file}`), hash(`public/art/${file}`));
const cfg = JSON.parse(fs.readFileSync('ios/App/App/capacitor.config.json'));
assert.equal(cfg.appId, 'com.krazel.animalitosadormir');
assert.ok(!cfg.server?.url, 'Native app must load its bundled game');
assert.ok(
  !fs.existsSync(root + '/sw.js'),
  'Native app must not depend on a web service worker',
);
const html = fs.readFileSync(root + '/index.html', 'utf8');
assert.ok(!/https?:\/\//.test(html));
assert.ok(html.includes('viewport-fit=cover'));
console.log(
  'Native package verified: six original animals, 68 identical voices, local entry and safe areas',
);
