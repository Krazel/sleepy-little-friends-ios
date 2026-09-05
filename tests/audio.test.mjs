import test from 'node:test';
import assert from 'node:assert/strict';
import { BedtimeAudio } from '../lib/audio.ts';
import { DEFAULT_PREFERENCES } from '../lib/game.ts';
const wait = () => new Promise((r) => setTimeout(r, 15));
function environment() {
  const stats = {
    sources: [],
    oscillators: [],
    spoken: [],
    fetched: [],
    gains: [],
  };
  class Context {
    state = 'suspended';
    currentTime = 0;
    destination = {};
    createGain() {
      const node = {
        gain: {
          value: 0,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
      stats.gains.push(node);
      return node;
    }
    createOscillator() {
      const node = {
        frequency: { value: 0 },
        connect() {},
        disconnect() {},
        start() {},
        stop() {
          this.stopped = true;
        },
      };
      stats.oscillators.push(node);
      return node;
    }
    createBufferSource() {
      const node = {
        playbackRate: { value: 0 },
        connect() {},
        disconnect() {},
        start() {
          this.started = true;
        },
        stop() {
          this.stopped = true;
        },
      };
      stats.sources.push(node);
      return node;
    }
    async decodeAudioData() {
      return { duration: 2 };
    }
    async resume() {
      this.state = 'running';
    }
    async suspend() {
      this.state = 'suspended';
    }
    async close() {
      this.state = 'closed';
    }
  }
  globalThis.window = {
    AudioContext: Context,
    speechSynthesis: {
      cancel() {},
      getVoices() {
        return [
          { lang: 'es-ES', name: 'Natural Spanish' },
          { lang: 'en-US', name: 'Natural English' },
        ];
      },
      speak(v) {
        stats.spoken.push(v);
      },
    },
  };
  globalThis.document = { hidden: false };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (path) => {
    stats.fetched.push(path);
    return { ok: true, arrayBuffer: async () => new ArrayBuffer(32) };
  };
  return {
    stats,
    cleanup: () => {
      globalThis.fetch = originalFetch;
      delete globalThis.window;
      delete globalThis.document;
      delete globalThis.SpeechSynthesisUtterance;
    },
  };
}
await test('prepared voice plays, music ducks, cached clips are reused and pace changes', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    assert.equal(stats.sources.length, 1);
    assert.ok(stats.sources[0].started);
    assert.equal(stats.sources[0].playbackRate.value, 1);
    assert.equal(stats.gains[0].gain.value, 0.07);
    stats.sources[0].onended();
    assert.equal(stats.gains[0].gain.value, 0.16);
    audio.configure({ ...DEFAULT_PREFERENCES, voiceSpeed: 'normal' });
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    assert.equal(stats.sources[1].playbackRate.value, 1.08);
    assert.deepEqual(stats.fetched, [
      '/voice/elevenlabs/es-ES-valeria/welcome.mp3',
    ]);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('language change cancels stale voice, and uses English clips', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    audio.speak('Hola', 'welcome', 'es', 30);
    audio.configure({ ...DEFAULT_PREFERENCES, language: 'en' });
    audio.speak('Hello', 'welcome', 'en', 0);
    await wait();
    assert.deepEqual(stats.fetched, ['/voice/elevenlabs/en/welcome.mp3']);
    assert.equal(stats.sources.length, 1);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('muting while a clip loads prevents late playback and stops music', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  let release;
  try {
    await audio.unlock();
    globalThis.fetch = () =>
      new Promise((resolve) => {
        release = resolve;
      });
    audio.lullaby();
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    audio.configure({ ...DEFAULT_PREFERENCES, sound: false });
    release({ ok: true, arrayBuffer: async () => new ArrayBuffer(32) });
    await wait();
    assert.equal(stats.sources.length, 0);
    assert.ok(stats.oscillators.every((n) => n.stopped));
    audio.chime();
    assert.equal(stats.oscillators.length, 12);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('hidden document and stopped narration cannot start delayed speech', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    document.hidden = true;
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    assert.equal(stats.sources.length, 0);
    document.hidden = false;
    audio.speak('Hola', 'welcome', 'es', 0);
    audio.stop();
    await wait();
    assert.equal(stats.sources.length, 0);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('missing clip falls back to matching natural English system voice', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    globalThis.fetch = async () => ({ ok: false });
    audio.configure({ ...DEFAULT_PREFERENCES, language: 'en' });
    audio.speak('Good night', 'missing', 'en', 0);
    await wait();
    assert.equal(stats.spoken[0].lang, 'en-US');
    assert.equal(stats.spoken[0].voice.name, 'Natural English');
    assert.equal(stats.spoken[0].pitch, 1);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('sound can resume after leaving a room and missing audio APIs are harmless', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    audio.touch();
    audio.stop();
    await audio.unlock();
    audio.note(2);
    assert.equal(stats.oscillators.length, 2);
  } finally {
    audio.dispose();
    cleanup();
  }
  globalThis.window = {};
  globalThis.document = { hidden: false };
  const silent = new BedtimeAudio();
  await silent.unlock();
  silent.chime();
  silent.speak('Hola', 'welcome', 'es', 0);
  silent.dispose();
  delete globalThis.window;
  delete globalThis.document;
});

await test('switching Spanish narrator cancels stale speech and keeps distinct cached clips', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    audio.configure({ ...DEFAULT_PREFERENCES, spanishVoice: 'original' });
    assert.equal(stats.sources[0].stopped, true);
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    audio.configure(DEFAULT_PREFERENCES);
    audio.speak('Hola', 'welcome', 'es', 0);
    await wait();
    assert.deepEqual(stats.fetched, [
      '/voice/elevenlabs/es-ES-valeria/welcome.mp3',
      '/voice/elevenlabs/es/welcome.mp3',
    ]);
    assert.equal(stats.sources.length, 3);
  } finally {
    audio.dispose();
    cleanup();
  }
});
await test('Spain fallback never silently substitutes a Latin American voice', async () => {
  const { stats, cleanup } = environment(),
    audio = new BedtimeAudio();
  try {
    await audio.unlock();
    globalThis.fetch = async () => ({ ok: false });
    window.speechSynthesis.getVoices = () => [
      { lang: 'es-MX', name: 'Natural Spanish' },
    ];
    audio.speak('Hola', 'missing', 'es', 0);
    await wait();
    assert.equal(stats.spoken.length, 0);
    window.speechSynthesis.getVoices = () => [
      { lang: 'es-MX', name: 'Natural Spanish' },
      { lang: 'es-ES', name: 'Spanish Spain' },
    ];
    audio.speak('Hola', 'missing', 'es', 0);
    await wait();
    assert.equal(stats.spoken[0].voice.lang, 'es-ES');
  } finally {
    audio.dispose();
    cleanup();
  }
});
