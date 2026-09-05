import content from './content.json';
import type { ActivityKind, Language } from './game';
export type UI = typeof content.ui.es;
export const ui = (language: Language): UI => content.ui[language];
export const activityText = (kind: ActivityKind, language: Language) =>
  content.activities[kind][language];
export const activityTitle = (kind: ActivityKind, language: Language) =>
  content.activities[kind].title[language];
export const lineText = (key: string, language: Language) =>
  content.lines[key as keyof typeof content.lines]?.[language] || '';
export const narrationKey = (kind: ActivityKind, animal: string) =>
  kind === 'prop' ? 'prop_' + animal : 'activity_' + kind;
