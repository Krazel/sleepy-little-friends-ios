import type { Language, Preferences } from './game';
export class BedtimeAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private nodes = new Set<OscillatorNode>();
  private voiceNode: AudioBufferSourceNode | null = null;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private revision = 0;
  private prefs: Preferences = {
    sound: true,
    voice: true,
    motion: true,
    language: 'es',
    voiceSpeed: 'calm',
    spanishVoice: 'spain',
  };
  private speechTimer: ReturnType<typeof setTimeout> | null = null;
  configure(prefs: Preferences) {
    const languageChanged = this.prefs.language !== prefs.language;
    const voiceChanged = this.prefs.spanishVoice !== prefs.spanishVoice;
    this.prefs = { ...this.prefs, ...prefs };
    if (!prefs.sound) this.stop();
    else if (!prefs.voice || languageChanged || voiceChanged)
      this.cancelSpeech();
  }
  async unlock() {
    if (!this.prefs.sound) return;
    try {
      const AudioConstructor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioConstructor) return;
      if (!this.context) {
        this.context = new AudioConstructor();
        this.master = this.context.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.context.destination);
        this.voiceGain = this.context.createGain();
        this.voiceGain.gain.value = 0.8;
        this.voiceGain.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      /* Visual controls do not depend on audio. */
    }
  }
  private tone(
    frequency: number,
    offset: number,
    duration: number,
    volume = 0.3,
  ) {
    const context = this.context;
    if (
      !context ||
      !this.master ||
      !this.prefs.sound ||
      context.state !== 'running'
    )
      return;
    const oscillator = context.createOscillator(),
      gain = context.createGain(),
      t = context.currentTime + offset;
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.05);
    this.nodes.add(oscillator);
    oscillator.onended = () => {
      this.nodes.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    };
  }
  chime() {
    this.tone(523.25, 0, 0.4);
    this.tone(659.25, 0.15, 0.55);
    this.tone(783.99, 0.3, 0.7, 0.18);
  }
  touch() {
    this.tone(392, 0, 0.23, 0.2);
  }
  pop(index = 0) {
    this.tone(480 + index * 90, 0, 0.14, 0.35);
  }
  note(index: number) {
    this.tone([392, 440, 523.25, 587.33][index % 4], 0, 0.65, 0.32);
  }
  purr() {
    for (let i = 0; i < 5; i++) this.tone(100 + i * 4, i * 0.09, 0.17, 0.11);
  }
  sparkle() {
    this.tone(784, 0, 0.3, 0.22);
    this.tone(1046, 0.12, 0.5, 0.17);
  }
  lullaby() {
    let offset = 0;
    [
      392, 392, 440, 392, 523.25, 493.88, 392, 392, 440, 392, 587.33, 523.25,
    ].forEach((note, i) => {
      const d = i % 6 === 5 ? 1.35 : 0.62;
      this.tone(note, offset, d, 0.2);
      offset += d * 0.82;
    });
  }
  private load(key: string, language: Language): Promise<AudioBuffer> {
    const folder =
      language === 'es' && this.prefs.spanishVoice === 'spain'
        ? 'es-ES-valeria'
        : language;
    const id = folder + '/' + key;
    let promise = this.buffers.get(id);
    if (!promise) {
      promise = (async () => {
        const response = await fetch('/voice/elevenlabs/' + id + '.mp3');
        if (!response.ok) throw new Error('Voice unavailable');
        const bytes = await response.arrayBuffer();
        if (!this.context) throw new Error('Audio not ready');
        return this.context.decodeAudioData(bytes);
      })();
      this.buffers.set(id, promise);
      promise.catch(() => this.buffers.delete(id));
    }
    return promise;
  }
  preload(keys: string[], language: Language) {
    if (!this.context) return;
    for (const key of keys) void this.load(key, language).catch(() => {});
  }
  speak(
    text: string,
    key: string,
    language: Language = this.prefs.language,
    delay = 100,
  ) {
    this.cancelSpeech();
    if (!this.prefs.sound || !this.prefs.voice) return;
    const revision = this.revision;
    this.speechTimer = setTimeout(() => {
      void (async () => {
        if (document.hidden || revision !== this.revision) return;
        try {
          const buffer = await this.load(key, language);
          if (
            revision !== this.revision ||
            document.hidden ||
            !this.context ||
            !this.voiceGain ||
            this.context.state !== 'running'
          )
            return;
          const source = this.context.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value =
            this.prefs.voiceSpeed === 'normal' ? 1.08 : 1;
          source.connect(this.voiceGain);
          this.voiceNode = source;
          if (this.master) this.master.gain.value = 0.07;
          source.onended = () => {
            source.disconnect();
            if (this.voiceNode === source) {
              this.voiceNode = null;
              if (this.master) this.master.gain.value = 0.16;
            }
          };
          source.start();
        } catch {
          if (revision === this.revision)
            this.fallback(text, language, revision);
        }
      })();
    }, delay);
  }
  private fallback(text: string, language: Language, revision: number) {
    if (
      !('speechSynthesis' in window) ||
      !this.prefs.sound ||
      !this.prefs.voice ||
      document.hidden
    )
      return;
    try {
      const utterance = new SpeechSynthesisUtterance(text),
        voices = window.speechSynthesis.getVoices();
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = this.prefs.voiceSpeed === 'calm' ? 0.92 : 1;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.voice =
        voices
          .filter((v) =>
            language === 'es' && this.prefs.spanishVoice === 'spain'
              ? v.lang.toLowerCase().replace('_', '-') === 'es-es'
              : v.lang.startsWith(language),
          )
          .sort(
            (a, b) =>
              Number(/natural|neural|premium|enhanced/i.test(b.name)) -
              Number(/natural|neural|premium|enhanced/i.test(a.name)),
          )[0] || null;
      // Do not substitute a different Spanish accent when Spain was selected.
      if (
        language === 'es' &&
        this.prefs.spanishVoice === 'spain' &&
        !utterance.voice
      )
        return;
      if (revision === this.revision) window.speechSynthesis.speak(utterance);
    } catch {
      /* Optional fallback only. */
    }
  }
  cancelSpeech() {
    this.revision++;
    if (this.speechTimer) clearTimeout(this.speechTimer);
    this.speechTimer = null;
    if (this.voiceNode) {
      try {
        this.voiceNode.stop();
      } catch {}
      this.voiceNode = null;
    }
    if (this.master) this.master.gain.value = 0.16;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window)
      window.speechSynthesis.cancel();
  }
  stop() {
    this.cancelSpeech();
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {}
    }
    this.nodes.clear();
    void this.context?.suspend().catch(() => {});
  }
  dispose() {
    this.stop();
    void this.context?.close().catch(() => {});
    this.context = null;
    this.buffers.clear();
  }
}
