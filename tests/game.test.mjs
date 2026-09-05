import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ANIMAL_IDS,
  ROUTINES,
  ACTIVITY_COUNTS,
  DEFAULT_PREFERENCES,
  freshGame,
  reduceGame,
  restoreSaved,
  serializeGame,
  acceptsDrop,
  dragOffset,
  allAsleep,
  actionReady,
} from '../lib/game.ts';
const open = (room) => reduceGame(freshGame(), { type: 'open', room });
const hit = (s, token = '0', step = s.progress[s.room]) =>
  reduceGame(s, { type: 'interact', room: s.room, step, token });
const finishStep = (s) => {
  const step = s.progress[s.room];
  for (let i = 0; i < ACTIVITY_COUNTS[ROUTINES[s.room][step]]; i++)
    s = hit(s, String(i), step);
  return s;
};
const finishRoom = (s) => {
  while (s.progress[s.room] < 6) s = finishStep(s);
  return s;
};
await test('all 36 activities need their distinct interactions and reach the ending', () => {
  let s = open('bunny'),
    total = 0;
  for (const id of ANIMAL_IDS) {
    assert.equal(s.room, id);
    assert.equal(ROUTINES[id].length, 6);
    for (let step = 0; step < 6; step++) {
      const count = ACTIVITY_COUNTS[ROUTINES[id][step]];
      for (let i = 0; i < count; i++) {
        s = hit(s, String(i), step);
        total++;
        assert.equal(s.progress[id], step + (i === count - 1 ? 1 : 0));
      }
      assert.deepEqual(s.collected[id], []);
    }
    assert.equal(s.view, 'room');
    s = reduceGame(s, { type: 'next' });
  }
  assert.equal(total, 93);
  assert.equal(s.view, 'ending');
  assert.ok(allAsleep(s.progress));
});
for (const id of ANIMAL_IDS)
  await test(
    id +
      ' supports every activity without skipping after duplicate or stale events',
    () => {
      let s = open(id);
      for (let step = 0; step < 6; step++) {
        const count = ACTIVITY_COUNTS[ROUTINES[id][step]];
        for (let i = count - 1; i >= 0; i--) {
          const event = { type: 'interact', room: id, step, token: String(i) };
          s = reduceGame(s, event);
          assert.equal(reduceGame(s, event), s);
        }
      }
      assert.equal(s.progress[id], 6);
      assert.equal(hit(s), s);
    },
  );
await test('six friends can be completed in any order', () => {
  let s = freshGame();
  for (const id of [...ANIMAL_IDS].reverse())
    s = finishRoom(reduceGame(s, { type: 'open', room: id }));
  assert.equal(reduceGame(s, { type: 'next' }).view, 'ending');
});
await test('next wraps and cannot leave an unfinished room', () => {
  let s = open('panda');
  assert.equal(reduceGame(s, { type: 'next' }), s);
  s = finishRoom(s);
  assert.equal(reduceGame(s, { type: 'next' }).room, 'bunny');
});
await test('late, offscreen and invalid interactions are ignored', () => {
  const s = open('kitten');
  for (const event of [
    { room: 'bunny', step: 0, token: '0' },
    { room: 'kitten', step: 9, token: '0' },
    { room: 'kitten', step: 0, token: '-1' },
    { room: 'kitten', step: 0, token: '99' },
    { room: 'kitten', step: 0, token: '0.0' },
  ])
    assert.equal(reduceGame(s, { type: 'interact', ...event }), s);
  const home = freshGame();
  assert.equal(hit(home), home);
  assert.equal(reduceGame(s, { type: 'open', room: 'dragon' }), s);
});
await test('partial micro progress and bilingual voice preferences survive reload', () => {
  let s = open('bunny');
  s = hit(s, '2');
  const prefs = {
    sound: true,
    voice: true,
    motion: false,
    language: 'en',
    voiceSpeed: 'normal',
  };
  const restored = restoreSaved(serializeGame(s, prefs));
  assert.deepEqual(restored.game.collected.bunny, ['2']);
  assert.deepEqual(restored.game.progress, s.progress);
  assert.equal(restored.game.view, 'home');
  assert.deepEqual(restored.preferences, prefs);
});
await test('version one saves preserve sleeping friends and introduce three new rooms', () => {
  const { game, preferences } = restoreSaved(
    JSON.stringify({
      version: 1,
      progress: { bunny: 2, kitten: 1, bear: 0 },
      preferences: { sound: false, voice: false, motion: false },
    }),
  );
  assert.deepEqual(game.progress, {
    bunny: 6,
    kitten: 4,
    bear: 0,
    puppy: 0,
    fox: 0,
    panda: 0,
  });
  assert.equal(preferences.language, 'es');
  assert.equal(preferences.sound, false);
});
await test('malformed saved data cannot corrupt the routines', () => {
  for (const raw of [null, '', 'not json', 'null', '{}', '{"version":3}'])
    assert.deepEqual(restoreSaved(raw).game, freshGame());
  const restored = restoreSaved(
    JSON.stringify({
      version: 2,
      progress: { bunny: 99, kitten: '2', bear: -1 },
      collected: { bunny: ['0', '0', '-1', 2, '2', '1', '8'] },
      preferences: {
        sound: 'false',
        voice: false,
        language: 'de',
        voiceSpeed: 'fast',
      },
    }),
  );
  assert.deepEqual(restored.game.progress, freshGame().progress);
  assert.deepEqual(restored.game.collected.bunny, ['0', '2']);
  assert.deepEqual(restored.preferences, {
    ...DEFAULT_PREFERENCES,
    voice: false,
  });
});
await test('replaying one room keeps the other five and full reset is independent', () => {
  let s = finishRoom(open('bunny'));
  s = finishRoom(reduceGame(s, { type: 'open', room: 'fox' }));
  const replay = reduceGame(s, { type: 'replay', room: 'bunny' });
  assert.equal(replay.progress.bunny, 0);
  assert.equal(replay.progress.fox, 6);
  assert.equal(s.progress.bunny, 6);
  assert.deepEqual(reduceGame(s, { type: 'reset' }), freshGame());
});
await test('tap and forgiving drops work, distant drops do not', () => {
  const target = { left: 100, top: 100, width: 150, height: 150 };
  assert.ok(acceptsDrop({ x: 100, y: 400 }, { x: 105, y: 401 }, target));
  assert.ok(acceptsDrop({ x: 100, y: 400 }, { x: 170, y: 180 }, target));
  assert.ok(acceptsDrop({ x: 100, y: 400 }, { x: 90, y: 180 }, target));
  assert.equal(
    acceptsDrop({ x: 100, y: 400 }, { x: 350, y: 480 }, target),
    false,
  );
});
await test('dragging stays within viewport and repeated clicks respect cooldown', () => {
  assert.deepEqual(
    dragOffset(
      { x: 50, y: 50 },
      { x: -200, y: 800 },
      { left: 0, top: 0, width: 390, height: 700 },
    ),
    { x: -50, y: 650 },
  );
  assert.equal(actionReady(1000, 1100), false);
  assert.ok(actionReady(1000, 1180));
  assert.ok(actionReady(-Infinity, 0));
});
