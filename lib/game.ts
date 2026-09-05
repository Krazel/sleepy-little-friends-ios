export const ANIMAL_IDS = [
  'bunny',
  'kitten',
  'bear',
  'puppy',
  'fox',
  'panda',
] as const;
export type AnimalId = (typeof ANIMAL_IDS)[number];
export type Language = 'es' | 'en';
export type ActivityKind =
  | 'pet'
  | 'bubbles'
  | 'brush'
  | 'wash'
  | 'tidy'
  | 'stars'
  | 'snack'
  | 'ball'
  | 'prop'
  | 'kiss'
  | 'lamp'
  | 'story'
  | 'song';
export const ROUTINES: Record<AnimalId, readonly ActivityKind[]> = {
  bunny: ['pet', 'bubbles', 'brush', 'prop', 'kiss', 'lamp'],
  kitten: ['tidy', 'wash', 'stars', 'prop', 'song', 'lamp'],
  bear: ['bubbles', 'snack', 'brush', 'prop', 'story', 'song'],
  puppy: ['ball', 'wash', 'brush', 'prop', 'kiss', 'lamp'],
  fox: ['tidy', 'stars', 'story', 'prop', 'pet', 'song'],
  panda: ['snack', 'wash', 'stars', 'prop', 'kiss', 'lamp'],
};
export const ACTIVITY_COUNTS: Record<ActivityKind, number> = {
  pet: 3,
  bubbles: 5,
  brush: 3,
  wash: 4,
  tidy: 3,
  stars: 3,
  snack: 3,
  ball: 4,
  prop: 1,
  kiss: 1,
  lamp: 1,
  story: 3,
  song: 4,
};
export type Step = number;
export type Progress = Record<AnimalId, number>;
export type Preferences = {
  sound: boolean;
  voice: boolean;
  motion: boolean;
  language: Language;
  voiceSpeed: 'calm' | 'normal';
};
export type GameState = {
  view: 'home' | 'room' | 'ending';
  room: AnimalId;
  progress: Progress;
  collected: Record<AnimalId, string[]>;
};
export type GameAction =
  | { type: 'open'; room: AnimalId }
  | { type: 'interact'; room: AnimalId; step: number; token: string }
  | { type: 'home' }
  | { type: 'next' }
  | { type: 'reset' }
  | { type: 'replay'; room: AnimalId };
export const STORAGE_KEY = 'animalitos-a-dormir-v1';
export const DEFAULT_PREFERENCES: Preferences = {
  sound: true,
  voice: true,
  motion: true,
  language: 'es',
  voiceSpeed: 'calm',
};
export const freshGame = (): GameState => ({
  view: 'home',
  room: 'bunny',
  progress: { bunny: 0, kitten: 0, bear: 0, puppy: 0, fox: 0, panda: 0 },
  collected: { bunny: [], kitten: [], bear: [], puppy: [], fox: [], panda: [] },
});
export const isAsleep = (progress: Progress, id: AnimalId) =>
  progress[id] >= ROUTINES[id].length;
export const allAsleep = (progress: Progress) =>
  ANIMAL_IDS.every((id) => isAsleep(progress, id));
export const currentActivity = (state: GameState) =>
  ROUTINES[state.room][state.progress[state.room]];
export function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return freshGame();
    case 'home':
      return { ...state, view: 'home' };
    case 'open':
      return ANIMAL_IDS.includes(action.room)
        ? { ...state, view: 'room', room: action.room }
        : state;
    case 'replay':
      return ANIMAL_IDS.includes(action.room)
        ? {
            ...state,
            view: 'room',
            room: action.room,
            progress: { ...state.progress, [action.room]: 0 },
            collected: { ...state.collected, [action.room]: [] },
          }
        : state;
    case 'interact': {
      if (
        state.view !== 'room' ||
        action.room !== state.room ||
        state.progress[action.room] !== action.step ||
        isAsleep(state.progress, action.room)
      )
        return state;
      const count = ACTIVITY_COUNTS[currentActivity(state)];
      if (
        !Array.from({ length: count }, (_, i) => String(i)).includes(
          action.token,
        ) ||
        state.collected[action.room].includes(action.token)
      )
        return state;
      const collected = [...state.collected[action.room], action.token];
      const done = collected.length === count;
      return {
        ...state,
        progress: {
          ...state.progress,
          [action.room]: action.step + (done ? 1 : 0),
        },
        collected: { ...state.collected, [action.room]: done ? [] : collected },
      };
    }
    case 'next': {
      if (state.view !== 'room' || !isAsleep(state.progress, state.room))
        return state;
      if (allAsleep(state.progress)) return { ...state, view: 'ending' };
      const index = ANIMAL_IDS.indexOf(state.room);
      const room = [
        ...ANIMAL_IDS.slice(index + 1),
        ...ANIMAL_IDS.slice(0, index + 1),
      ].find((id) => !isAsleep(state.progress, id))!;
      return { ...state, view: 'room', room };
    }
  }
}
export function deviceLanguage(locales: readonly string[]): Language {
  for (const locale of locales) {
    const language = locale.toLowerCase().split(/[-_]/)[0];
    if (language === 'es' || language === 'en') return language;
  }
  return 'en';
}
export function restoreSaved(
  raw: string | null,
  language: Language = 'es',
): {
  game: GameState;
  preferences: Preferences;
} {
  const fallback = {
    game: freshGame(),
    preferences: { ...DEFAULT_PREFERENCES, language },
  };
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 && value?.version !== 2) return fallback;
    const game = freshGame();
    for (const id of ANIMAL_IDS) {
      const step = value.progress?.[id];
      if (
        Number.isInteger(step) &&
        step >= 0 &&
        step <= (value.version === 1 ? 2 : ROUTINES[id].length)
      ) {
        game.progress[id] =
          value.version === 1 ? (step === 2 ? 6 : step === 1 ? 4 : 0) : step;
      }
      if (
        value.version === 2 &&
        !isAsleep(game.progress, id) &&
        Array.isArray(value.collected?.[id])
      ) {
        const count = ACTIVITY_COUNTS[ROUTINES[id][game.progress[id]]];
        game.collected[id] = [
          ...new Set<string>(
            value.collected[id].filter(
              (t: unknown) =>
                typeof t === 'string' &&
                Array.from({ length: count }, (_, i) => String(i)).includes(t),
            ),
          ),
        ].slice(0, count - 1);
      }
    }
    const preferences = { ...DEFAULT_PREFERENCES, language };
    for (const key of ['sound', 'voice', 'motion'] as const)
      if (typeof value.preferences?.[key] === 'boolean')
        preferences[key] = value.preferences[key];
    if (['es', 'en'].includes(value.preferences?.language))
      preferences.language = value.preferences.language;
    if (['calm', 'normal'].includes(value.preferences?.voiceSpeed))
      preferences.voiceSpeed = value.preferences.voiceSpeed;
    return { game, preferences };
  } catch {
    return fallback;
  }
}
export const serializeGame = (game: GameState, preferences: Preferences) =>
  JSON.stringify({
    version: 2,
    progress: game.progress,
    collected: game.collected,
    preferences,
  });
export type Point = { x: number; y: number };
export type Rect = { left: number; top: number; width: number; height: number };
export const actionReady = (lastActionAt: number, now: number) =>
  now - lastActionAt >= 180;
export function acceptsDrop(start: Point, end: Point, target: Rect, scale = 1) {
  if (Math.hypot(end.x - start.x, end.y - start.y) <= 14 * scale) return true;
  const pad = 38 * scale;
  return (
    end.x >= target.left - pad &&
    end.x <= target.left + target.width + pad &&
    end.y >= target.top - pad &&
    end.y <= target.top + target.height + pad
  );
}
export function dragOffset(start: Point, end: Point, limit: Rect): Point {
  return {
    x:
      Math.max(limit.left, Math.min(end.x, limit.left + limit.width)) - start.x,
    y: Math.max(limit.top, Math.min(end.y, limit.top + limit.height)) - start.y,
  };
}
