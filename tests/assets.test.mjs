import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { ANIMALS } from '../lib/animals.ts';
import { ANIMAL_IDS, ROUTINES } from '../lib/game.ts';
const json = async (file) =>
  JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
const content = await json('lib/content.json');
for (const id of ANIMAL_IDS)
  await test(id + ' has valid room, face and clean prop crops', async () => {
    const animal = ANIMALS[id],
      data = await readFile('public/art/' + id + '.png');
    assert.equal(data.subarray(1, 4).toString(), 'PNG');
    assert.equal(data.readUInt32BE(16), 1024);
    assert.equal(data.readUInt32BE(20), 1536);
    assert.ok(data.length > 100000);
    assert.ok(
      data[25] === 6 || animal.propClip,
      'Opaque prop sheets require a clip mask',
    );
    for (const crop of [animal.room, animal.prop]) {
      assert.ok(crop.x >= 0 && crop.y >= 0);
      assert.ok(crop.x + crop.width <= 1024);
      assert.ok(crop.y + crop.height <= 1536);
    }
    assert.ok(animal.placed.y > animal.face.y + 0.15, 'Props keep faces clear');
    for (const lang of ['es', 'en'])
      assert.ok(animal.name[lang] && animal.kind[lang]);
  });
await test('all instructions, stories and names have prepared MP3 voices in both languages', async () => {
  const script = await json('docs/voice-script.json');
  assert.deepEqual(script, content.lines);
  assert.deepEqual(
    Object.keys(content.ui.es).sort(),
    Object.keys(content.ui.en).sort(),
  );
  for (const language of ['es', 'en']) {
    for (const text of Object.values(content.ui[language]))
      assert.ok(text.trim().length > 0);
    const files = await readdir('public/voice/' + language);
    assert.equal(files.length, 34);
    for (const [key, line] of Object.entries(content.lines)) {
      assert.ok(line[language].length > 0);
      const bytes = await readFile(
        'public/voice/' + language + '/' + key + '.mp3',
      );
      assert.ok(bytes.length > 1000);
      assert.ok(
        bytes[0] === 0xff || bytes.subarray(0, 3).toString() === 'ID3',
        'MP3 ' + key,
      );
    }
    for (const id of ANIMAL_IDS) {
      assert.ok(content.lines['goodnight_' + id][language]);
      for (const kind of ROUTINES[id]) {
        assert.ok(content.activities[kind][language]);
        assert.ok(
          content.lines[kind === 'prop' ? 'prop_' + id : 'activity_' + kind][
            language
          ],
        );
      }
    }
  }
});
await test('install manifest is self-contained', async () => {
  const m = await json('public/manifest.webmanifest');
  assert.equal(m.start_url, '/');
  assert.equal(m.display, 'standalone');
  for (const icon of m.icons) await readFile('public' + icon.src);
});

await test('all shipped narration belongs to the same ElevenLabs generation', async () => {
  const manifest = await json('docs/voice-manifest.json');
  assert.equal(manifest.provider, 'ElevenLabs API');
  assert.equal(manifest.clips, 68);
  assert.equal(manifest.files.length, 68);
  const { createHash } = await import('node:crypto');
  for (const entry of manifest.files) {
    const bytes = await readFile(
      'public/voice/' + entry.language + '/' + entry.key + '.mp3',
    );
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      entry.sha256,
    );
  }
  assert.deepEqual(manifest.lines, content.lines);
});
