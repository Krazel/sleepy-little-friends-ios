import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deviceLanguage,
  restoreSaved,
  serializeGame,
  freshGame,
  DEFAULT_PREFERENCES,
} from '../lib/game.ts';

await test('first launch follows the first supported device language', () => {
  for (const [locales, expected] of [
    [['es-MX', 'en-US'], 'es'],
    [['en-GB', 'es-ES'], 'en'],
    [['fr-FR', 'es-ES'], 'es'],
    [['ES_es'], 'es'],
    [['ja-JP'], 'en'],
    [[], 'en'],
  ]) {
    assert.equal(
      restoreSaved(null, deviceLanguage(locales)).preferences.language,
      expected,
    );
  }
});
await test('manual choice and progress survive relaunch in a different device language', () => {
  const game = freshGame();
  game.progress.bunny = 4;
  const raw = serializeGame(game, { ...DEFAULT_PREFERENCES, language: 'es' });
  const saved = restoreSaved(raw, 'en');
  assert.equal(saved.preferences.language, 'es');
  assert.equal(saved.game.progress.bunny, 4);
});
await test('corrupt or missing language uses device fallback without dropping valid progress', () => {
  assert.equal(restoreSaved('{bad', 'en').preferences.language, 'en');
  const raw = JSON.stringify({
    version: 2,
    progress: { bunny: 3 },
    preferences: { language: 'fr' },
  });
  const saved = restoreSaved(raw, 'es');
  assert.equal(saved.preferences.language, 'es');
  assert.equal(saved.game.progress.bunny, 3);
});

await test('Spanish voice choice persists independently of language and progress', () => {
  const game = freshGame();
  game.progress.bunny = 3;
  const saved = serializeGame(game, {
    ...DEFAULT_PREFERENCES,
    language: 'en',
    spanishVoice: 'original',
  });
  const restored = restoreSaved(saved, 'es');
  assert.equal(restored.preferences.spanishVoice, 'original');
  assert.equal(restored.preferences.language, 'en');
  assert.equal(restored.game.progress.bunny, 3);
});
await test('older saves and invalid voice choices use Spain without losing progress', () => {
  for (const spanishVoice of [undefined, 'invalid']) {
    const old = JSON.stringify({
      version: 2,
      progress: { kitten: 2 },
      preferences: { language: 'es', spanishVoice },
    });
    const restored = restoreSaved(old);
    assert.equal(restored.preferences.spanishVoice, 'spain');
    assert.equal(restored.game.progress.kitten, 2);
  }
});
