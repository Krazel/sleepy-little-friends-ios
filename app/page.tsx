'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Heart,
  House,
  Moon,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Download,
} from 'lucide-react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PreferenceSelect } from '@/components/game/preference-select';
import {
  ANIMAL_IDS,
  ACTIVITY_COUNTS,
  ROUTINES,
  DEFAULT_PREFERENCES,
  STORAGE_KEY,
  actionReady,
  allAsleep,
  isAsleep,
  freshGame,
  reduceGame,
  restoreSaved,
  deviceLanguage,
  serializeGame,
  type AnimalId,
  type GameAction,
  type GameState,
  type Preferences,
  type Language,
} from '@/lib/game';
import { ANIMALS } from '@/lib/animals';
import { BedtimeAudio } from '@/lib/audio';
import { ui, lineText, narrationKey } from '@/lib/i18n';
import { Sprite, Portrait } from '@/components/game/art';
import { Room } from '@/components/game/room';
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export default function Home() {
  const [game, setGame] = useState<GameState>(freshGame),
    gameRef = useRef(game);
  const [preferences, setPreferences] =
      useState<Preferences>(DEFAULT_PREFERENCES),
    preferencesRef = useRef(preferences);
  const [hydrated, setHydrated] = useState(false),
    [parents, setParents] = useState(false);
  const [assetStatus, setAssetStatus] = useState<'loading' | 'ready' | 'error'>(
      'loading',
    ),
    [loadAttempt, setLoadAttempt] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
      null,
    ),
    [offlineReady, setOfflineReady] = useState(false),
    [storageIssue, setStorageIssue] = useState(false),
    [systemReduced, setSystemReduced] = useState(false);
  const audio = useRef<BedtimeAudio | null>(null),
    lastActionAt = useRef(-Infinity),
    transitionUntil = useRef(0);
  const language = preferences.language,
    t = ui(language),
    motion = preferences.motion && !systemReduced;
  const send = (action: GameAction) => {
    const next = reduceGame(gameRef.current, action);
    gameRef.current = next;
    setGame(next);
    return next;
  };
  const activate = () => {
    void audio.current?.unlock();
  };
  const say = (key: string, delay = 100) => {
    const lang = preferencesRef.current.language;
    audio.current?.speak(lineText(key, lang), key, lang, delay);
  };
  const hintKey = (state = gameRef.current) => {
    if (state.view === 'home') return 'welcome';
    if (state.view === 'ending') return 'ending';
    const kind = ROUTINES[state.room][state.progress[state.room]];
    return !kind
      ? 'goodnight_' + state.room
      : kind === 'story'
        ? 'story' + state.collected[state.room].length
        : narrationKey(kind, state.room);
  };
  const hint = () => {
    activate();
    say(hintKey(), 0);
  };
  const changePreference = <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => {
    const next = { ...preferencesRef.current, [key]: value };
    preferencesRef.current = next;
    audio.current?.configure(next);
    setPreferences(next);
    if (
      key === 'language' ||
      (key === 'spanishVoice' && next.language === 'es')
    ) {
      activate();
      say(hintKey(), 150);
    }
  };
  useEffect(() => {
    audio.current = new BedtimeAudio();
    const initialLanguage = deviceLanguage(
      navigator.languages?.length ? navigator.languages : [navigator.language],
    );
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      // oxlint-disable-next-line react/react-compiler -- Browser storage is only available after mount.
      setStorageIssue(true);
    }
    {
      const saved = restoreSaved(raw, initialLanguage);
      gameRef.current = saved.game;
      preferencesRef.current = saved.preferences;
      // oxlint-disable-next-line react/react-compiler -- Restore browser-only state after hydration.
      setGame(saved.game);
      setPreferences(saved.preferences);
      audio.current.configure(saved.preferences);
    }
    if (Capacitor.isNativePlatform()) setOfflineReady(true);
    setHydrated(true);
    const media = window.matchMedia('(prefers-reduced-motion: reduce)'),
      change = () => setSystemReduced(media.matches);
    change();
    media.addEventListener('change', change);
    const visibility = () => {
      if (document.hidden) audio.current?.stop();
    };
    document.addEventListener('visibilitychange', visibility);
    const install = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as InstallPrompt);
      },
      installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', install);
    window.addEventListener('appinstalled', installed);
    let cancelled = false;
    if (
      !Capacitor.isNativePlatform() &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    )
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then(async (registration) => {
          await registration.update();
          const worker =
            registration.installing ||
            registration.waiting ||
            registration.active;
          if (!worker) return;
          const report = () => {
            if (!cancelled && worker.state === 'activated')
              setOfflineReady(true);
          };
          report();
          worker.addEventListener('statechange', report);
        })
        .catch(() => {});
    return () => {
      cancelled = true;
      audio.current?.dispose();
      media.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('beforeinstallprompt', install);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all(
      ANIMAL_IDS.map(
        (id) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image(),
              timeout = setTimeout(
                () => reject(new Error('Image timeout')),
                25000,
              );
            img.onload = () => {
              clearTimeout(timeout);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Image unavailable'));
            };
            img.src = '/art/' + id + '.png';
          }),
      ),
    )
      .then(() => {
        if (active) setAssetStatus('ready');
      })
      .catch(() => {
        if (active) setAssetStatus('error');
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, serializeGame(game, preferences));
      } catch {
        // oxlint-disable-next-line react/react-compiler -- Surface a browser storage failure.
        setStorageIssue(true);
      }
    }
  }, [game, preferences, hydrated]);
  useEffect(() => {
    document.documentElement.lang = language;
    document.title =
      language === 'es'
        ? 'Animalitos a dormir · elevenlabs.io'
        : 'Sleepy little friends · elevenlabs.io';
  }, [language]);
  const open = (id: AnimalId) => {
    lastActionAt.current = -Infinity;
    transitionUntil.current = 0;
    activate();
    const next = send({ type: 'open', room: id });
    say(hintKey(next), 300);
    audio.current?.preload(
      ROUTINES[id].map((kind) => narrationKey(kind, id)),
      preferencesRef.current.language,
    );
  };
  const interact = (room: AnimalId, step: number, token: string) => {
    const current = gameRef.current,
      now = Date.now();
    if (
      !actionReady(lastActionAt.current, now) ||
      now < transitionUntil.current
    )
      return false;
    const next = reduceGame(current, { type: 'interact', room, step, token });
    if (next === current) return false;
    lastActionAt.current = now;
    activate();
    gameRef.current = next;
    setGame(next);
    const kind = ROUTINES[room][step];
    if (kind === 'song') audio.current?.note(Number(token));
    else if (kind === 'bubbles' || kind === 'ball')
      audio.current?.pop(Number(token));
    else if (kind === 'pet' || kind === 'brush') audio.current?.purr();
    else audio.current?.sparkle();
    if (next.progress[room] !== step) {
      transitionUntil.current = now + 700;
      if (isAsleep(next.progress, room)) {
        audio.current?.lullaby();
        say('goodnight_' + room, 550);
      } else {
        audio.current?.chime();
        say(hintKey(next), 650);
      }
    } else if (kind === 'story') say(hintKey(next), 100);
    return true;
  };
  const goHome = () => {
    audio.current?.stop();
    send({ type: 'home' });
  };
  const nextRoom = () => {
    audio.current?.stop();
    lastActionAt.current = -Infinity;
    transitionUntil.current = 0;
    activate();
    const next = send({ type: 'next' });
    if (next.view === 'ending') audio.current?.lullaby();
    say(hintKey(next), 350);
  };
  const reset = () => {
    audio.current?.stop();
    send({ type: 'reset' });
    setParents(false);
  };
  const replay = () => {
    audio.current?.stop();
    lastActionAt.current = -Infinity;
    transitionUntil.current = 0;
    const next = send({ type: 'replay', room: gameRef.current.room });
    setParents(false);
    activate();
    say(hintKey(next), 350);
  };
  const explore = (key: string) => {
    activate();
    if (key === 'tickle') audio.current?.purr();
    else audio.current?.sparkle();
    say(key, 100);
  };
  useEffect(() => {
    const context = (document as unknown as { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController(),
      schema = { type: 'object', properties: {}, additionalProperties: false };
    const empty = (input: unknown) => {
      if (
        !input ||
        typeof input !== 'object' ||
        Array.isArray(input) ||
        Object.keys(input).length
      )
        throw new Error('Expected an empty object.');
    };
    const snapshot = () => ({
      view: gameRef.current.view,
      room: gameRef.current.room,
      progress: { ...gameRef.current.progress },
      collected: { ...gameRef.current.collected },
      language: preferencesRef.current.language,
    });
    const entries = [
      {
        name: 'read_bedtime_progress',
        description: 'Read progress through six animal bedtime routines.',
        inputSchema: schema,
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: (input: unknown) => {
          empty(input);
          return snapshot();
        },
      },
      {
        name: 'open_animal_room',
        description: 'Open one animal room without completing its activities.',
        inputSchema: {
          type: 'object',
          properties: { animal: { type: 'string', enum: ANIMAL_IDS } },
          required: ['animal'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          if (
            !input ||
            typeof input !== 'object' ||
            Array.isArray(input) ||
            Object.keys(input).length !== 1 ||
            !ANIMAL_IDS.includes((input as { animal: AnimalId }).animal)
          )
            throw new Error('Choose one of the six animal IDs.');
          open((input as { animal: AnimalId }).animal);
          return snapshot();
        },
      },
      {
        name: 'complete_current_bedtime_action',
        description:
          'Perform one small interaction in the visible activity, such as popping one bubble. Never completes the entire routine at once.',
        inputSchema: schema,
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: (input: unknown) => {
          empty(input);
          const s = gameRef.current,
            step = s.progress[s.room],
            kind = ROUTINES[s.room][step];
          if (s.view !== 'room' || !kind)
            throw new Error('Open an unfinished room.');
          const token = Array.from({ length: ACTIVITY_COUNTS[kind] }, (_, i) =>
            String(i),
          ).find((x) => !s.collected[s.room].includes(x))!;
          interact(s.room, step, token);
          return snapshot();
        },
      },
    ];
    for (const entry of entries) {
      try {
        void Promise.resolve(
          context.registerTool(entry, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    }
    return () => lifecycle.abort();
    // Registered handlers access current state through refs.
  }, []);
  const finished = allAsleep(game.progress),
    animal = ANIMALS[game.room],
    step = game.progress[game.room],
    playable = hydrated && assetStatus === 'ready';
  return (
    <main
      className={
        'game-shell ' +
        (game.view === 'room' ? 'playing ' : '') +
        (game.view === 'ending' ? 'ending-shell ' : '') +
        (!motion ? 'reduce-motion' : '')
      }
    >
      <header className="topbar">
        {game.view === 'home' ? (
          <span className="brand">
            <Moon size={20} />
            {t.brand}
          </span>
        ) : (
          <button className="icon-button" onClick={goHome} aria-label={t.home}>
            <House size={22} />
          </button>
        )}
        {game.view === 'room' && (
          <span className="topbar-name">
            {animal.name[language]}
            <small>{animal.kind[language]}</small>
          </span>
        )}
        {game.view === 'ending' && (
          <span className="topbar-name">{t.untilTomorrow}</span>
        )}
        <div className="topbar-controls">
          <PreferenceSelect
            className="language-select"
            aria-label={t.language}
            value={language}
            onValueChange={(value) =>
              changePreference('language', value as Language)
            }
            options={[
              { value: 'es', label: 'ES' },
              { value: 'en', label: 'EN' },
            ]}
          />
          <button
            className="icon-button sound-button"
            aria-label={preferences.sound ? t.soundOff : t.soundOn}
            aria-pressed={preferences.sound}
            onClick={() => {
              const sound = !preferences.sound;
              changePreference('sound', sound);
              if (sound) {
                activate();
                audio.current?.touch();
              }
            }}
          >
            {preferences.sound ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
        </div>
      </header>
      {game.view === 'home' && (
        <section className="welcome">
          <span className="little-moon" aria-hidden="true">
            <Moon size={32} fill="currentColor" />
            <Sparkles size={17} />
          </span>
          <h1>
            {t.titleTop}
            <br />
            <em>{t.titleBottom}</em>
          </h1>
          <p className="welcome-line">{finished ? t.allDreaming : t.welcome}</p>
          <div className="animal-cards">
            {ANIMAL_IDS.map((id, i) => (
              <button
                key={id}
                className={'animal-card card-' + id}
                disabled={!playable}
                onClick={() => open(id)}
                aria-label={
                  t.visit +
                  ' ' +
                  ANIMALS[id].name[language] +
                  (isAsleep(game.progress, id) ? ', ' + t.sleeping : '')
                }
                style={
                  {
                    '--card-color': ANIMALS[id].color,
                    '--order': i,
                  } as CSSProperties
                }
              >
                <div className="card-room">
                  <Sprite id={id} crop={ANIMALS[id].room} />
                  <div className="card-gradient" />
                </div>
                <div className="card-caption">
                  <span>{ANIMALS[id].name[language]}</span>
                  <small>{ANIMALS[id].kind[language]}</small>
                </div>
                <span
                  className={
                    'card-state ' + (isAsleep(game.progress, id) ? 'done' : '')
                  }
                >
                  {isAsleep(game.progress, id) ? (
                    <Moon size={17} fill="currentColor" />
                  ) : (
                    <Heart size={17} />
                  )}
                </span>
                <span className="card-progress" aria-hidden="true">
                  {ROUTINES[id].map((_, n) => (
                    <i
                      key={n}
                      className={game.progress[id] > n ? 'complete' : ''}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
          {assetStatus === 'error' ? (
            <div className="asset-notice" role="alert">
              <p>{t.loadError}</p>
              <button
                className="primary-button"
                onClick={() => {
                  setAssetStatus('loading');
                  setLoadAttempt((n) => n + 1);
                }}
              >
                <RotateCcw />
                {t.retry}
              </button>
            </div>
          ) : (
            <button
              className="primary-button"
              disabled={!playable}
              onClick={() => {
                if (finished) {
                  activate();
                  send({ type: 'open', room: 'bunny' });
                  send({ type: 'next' });
                  audio.current?.lullaby();
                  say('ending');
                } else
                  open(ANIMAL_IDS.find((id) => !isAsleep(game.progress, id))!);
              }}
            >
              {!playable ? (
                <Moon className="loading-moon" />
              ) : finished ? (
                <Moon fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
              {!playable
                ? t.loading
                : finished
                  ? t.ending
                  : ANIMAL_IDS.some((id) => game.progress[id] > 0)
                    ? t.continue
                    : t.start}
            </button>
          )}
          <span className="welcome-footnote">
            <Heart size={14} />
            {t.welcomeFoot}
          </span>
        </section>
      )}
      {game.view === 'room' && (
        <Room
          key={game.room + '-' + (step === 0 ? 'start' : 'night')}
          animal={animal}
          step={step}
          collected={game.collected[game.room]}
          language={language}
          motion={motion}
          onInteract={interact}
          onNext={nextRoom}
          onHint={hint}
          onExplore={explore}
        />
      )}
      {game.view === 'ending' && (
        <section className="ending">
          <div className="ending-moon">
            <Moon size={92} strokeWidth={1.2} fill="currentColor" />
            <Sparkles size={28} />
          </div>
          <span className="eyebrow">{t.shh}</span>
          <h1>{t.ending}</h1>
          <p>{t.endingText}</p>
          <div className="sleeping-friends">
            {ANIMAL_IDS.map((id) => (
              <button
                key={id}
                onClick={() => open(id)}
                aria-label={t.visit + ' ' + ANIMALS[id].name[language]}
              >
                <Portrait animal={ANIMALS[id]} sleeping />
                <span>{ANIMALS[id].name[language]}</span>
              </button>
            ))}
          </div>
          <button className="quiet-button" onClick={goHome}>
            <House size={18} />
            {t.home}
          </button>
        </section>
      )}
      <footer className="app-footer">
        {game.view === 'room' ? (
          <nav aria-label={t.collection}>
            {ANIMAL_IDS.map((id) => (
              <button
                key={id}
                onClick={() => open(id)}
                aria-current={game.room === id ? 'page' : undefined}
                aria-label={t.visit + ' ' + ANIMALS[id].name[language]}
              >
                <Portrait
                  animal={ANIMALS[id]}
                  sleeping={isAsleep(game.progress, id)}
                />
              </button>
            ))}
          </nav>
        ) : (
          <span className="footer-moon">
            <Moon size={16} />
            {t.footnote}
          </span>
        )}
        <button
          className="parents-button"
          aria-label={t.parents}
          onClick={() => {
            audio.current?.stop();
            setParents(true);
          }}
        >
          <Settings2 size={18} />
          <span>{t.parents}</span>
        </button>
      </footer>
      <Dialog open={parents} onOpenChange={setParents}>
        <DialogContent className="parents-dialog" showCloseButton={false}>
          <DialogClose
            className="icon-button dialog-close"
            aria-label={t.close}
          >
            <X size={21} />
          </DialogClose>
          <DialogTitle className="parents-title">{t.parentTitle}</DialogTitle>
          <DialogDescription className="parents-description">
            {t.parentDescription}
          </DialogDescription>
          <div className="setting-row">
            <label htmlFor="language-setting">{t.language}</label>
            <PreferenceSelect
              id="language-setting"
              aria-label={t.language}
              value={language}
              onValueChange={(value) =>
                changePreference('language', value as Language)
              }
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
          {(['sound', 'voice', 'motion'] as const).map((key) => (
            <div className="setting-row" key={key}>
              <label htmlFor={key + '-setting'}>
                {t[key]}
                <small>
                  {key === 'motion' && systemReduced
                    ? t.systemMotion
                    : t[
                        (key + 'Detail') as
                          | 'soundDetail'
                          | 'voiceDetail'
                          | 'motionDetail'
                      ]}
                </small>
              </label>
              <Switch
                id={key + '-setting'}
                checked={
                  preferences[key] && (key !== 'motion' || !systemReduced)
                }
                disabled={key === 'motion' && systemReduced}
                onCheckedChange={(value) => changePreference(key, value)}
              />
            </div>
          ))}
          <fieldset className="voice-options">
            <legend>{t.spanishVoice}</legend>
            <RadioGroup
              aria-label={t.spanishVoice}
              value={preferences.spanishVoice}
              onValueChange={(value) =>
                changePreference(
                  'spanishVoice',
                  value as Preferences['spanishVoice'],
                )
              }
            >
              <label className="voice-option" htmlFor="voice-spain">
                <RadioGroupItem id="voice-spain" value="spain" />
                <span>{t.voiceSpain}</span>
              </label>
              <label className="voice-option" htmlFor="voice-original">
                <RadioGroupItem id="voice-original" value="original" />
                <span>{t.voiceOriginal}</span>
              </label>
            </RadioGroup>
          </fieldset>
          <div className="setting-row">
            <label htmlFor="pace-setting">{t.voiceSpeed}</label>
            <PreferenceSelect
              id="pace-setting"
              aria-label={t.voiceSpeed}
              value={preferences.voiceSpeed}
              onValueChange={(value) =>
                changePreference(
                  'voiceSpeed',
                  value as Preferences['voiceSpeed'],
                )
              }
              options={[
                { value: 'calm', label: t.calm },
                { value: 'normal', label: t.normal },
              ]}
            />
          </div>
          <button
            className="install-button"
            disabled={!preferences.sound || !preferences.voice}
            onClick={() => {
              activate();
              say('welcome', 0);
            }}
          >
            <Volume2 size={18} />
            {t.previewVoice}
          </button>
          <p className="voice-credit">
            <a href="https://elevenlabs.io" target="_blank" rel="noreferrer">
              {language === 'es'
                ? `Voz de IA: ${preferences.spanishVoice === 'spain' ? 'Valeria' : 'Sarah'} · ElevenLabs (elevenlabs.io)`
                : 'AI voice: Sarah · ElevenLabs (elevenlabs.io)'}
            </a>
          </p>
          <p className="privacy-note">
            {t.privacy} {storageIssue ? t.storageIssue : ''}
          </p>
          {!Capacitor.isNativePlatform() &&
            (installPrompt ? (
              <button
                className="install-button"
                onClick={async () => {
                  try {
                    await installPrompt.prompt();
                    await installPrompt.userChoice;
                  } catch {}
                  setInstallPrompt(null);
                }}
              >
                <Download size={19} />
                {t.install}
              </button>
            ) : (
              <p className="install-note">{t.installHelp}</p>
            ))}
          <p className="install-note">
            {offlineReady ? t.offlineReady : t.offlineWait}
          </p>
          {game.view === 'room' && (
            <button className="reset-button" onClick={replay}>
              <RotateCcw size={18} />
              {t.restartRoom}
            </button>
          )}
          <button className="reset-button" onClick={reset}>
            <RotateCcw size={18} />
            {t.reset}
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
