import type { AnimalId, Language } from './game';
export type Crop = { x: number; y: number; width: number; height: number };
type Localized = Record<Language, string>;
export type Animal = {
  id: AnimalId;
  name: Localized;
  kind: Localized;
  color: string;
  room: Crop;
  prop: Crop;
  propClip?: string;
  face: { x: number; y: number };
  lamp: { x: number; y: number };
  window: { x: number; y: number };
  placed: { x: number; y: number; width: number };
};
export const ANIMALS: Record<AnimalId, Animal> = {
  bunny: {
    id: 'bunny',
    name: { es: 'Luna', en: 'Luna' },
    kind: { es: 'la conejita', en: 'the little bunny' },
    color: '#f6d9cc',
    room: { x: 0, y: 0, width: 1024, height: 1033 },
    prop: { x: 136, y: 1076, width: 753, height: 430 },
    face: { x: 0.515, y: 0.49 },
    lamp: { x: 0.84, y: 0.37 },
    window: { x: 0.2, y: 0.18 },
    placed: { x: 0.51, y: 0.78, width: 0.66 },
  },
  kitten: {
    id: 'kitten',
    name: { es: 'Milo', en: 'Milo' },
    kind: { es: 'el gatito', en: 'the little kitten' },
    color: '#e8ddef',
    room: { x: 0, y: 0, width: 1024, height: 1167 },
    prop: { x: 355, y: 1233, width: 318, height: 235 },
    face: { x: 0.49, y: 0.46 },
    lamp: { x: 0.86, y: 0.425 },
    window: { x: 0.2, y: 0.18 },
    placed: { x: 0.52, y: 0.66, width: 0.3 },
  },
  bear: {
    id: 'bear',
    name: { es: 'Nube', en: 'Cloud' },
    kind: { es: 'el osito', en: 'the little bear' },
    color: '#dcebe0',
    room: { x: 0, y: 0, width: 1024, height: 1110 },
    prop: { x: 340, y: 1147, width: 343, height: 348 },
    face: { x: 0.515, y: 0.495 },
    lamp: { x: 0.85, y: 0.37 },
    window: { x: 0.2, y: 0.18 },
    placed: { x: 0.515, y: 0.75, width: 0.31 },
  },
  puppy: {
    id: 'puppy',
    name: { es: 'Coco', en: 'Coco' },
    kind: { es: 'el perrito', en: 'the little puppy' },
    color: '#dbe8e8',
    room: { x: 0, y: 0, width: 1024, height: 1118 },
    prop: { x: 174, y: 1169, width: 676, height: 288 },
    propClip:
      'polygon(7% 1%,30% 2%,50% 3%,80% 1%,94% 1%,97% 4%,99% 12%,98% 24%,97% 28%,99% 78%,100% 88%,98% 96%,95% 99%,5% 99%,2% 96%,0% 90%,1% 78%,3% 28%,2% 24%,2% 15%,3% 7%)',
    face: { x: 0.51, y: 0.548 },
    lamp: { x: 0.879, y: 0.436 },
    window: { x: 0.196, y: 0.176 },
    placed: { x: 0.51, y: 0.805, width: 0.58 },
  },
  fox: {
    id: 'fox',
    name: { es: 'Pipa', en: 'Pippa' },
    kind: { es: 'la zorrita', en: 'the little fox' },
    color: '#e9ddef',
    room: { x: 0, y: 0, width: 1024, height: 1107 },
    prop: { x: 345, y: 1115, width: 368, height: 409 },
    face: { x: 0.511, y: 0.52 },
    lamp: { x: 0.861, y: 0.456 },
    window: { x: 0.225, y: 0.196 },
    placed: { x: 0.52, y: 0.762, width: 0.24 },
  },
  panda: {
    id: 'panda',
    name: { es: 'Bambú', en: 'Bamboo' },
    kind: { es: 'el panda', en: 'the little panda' },
    color: '#e5e7ca',
    room: { x: 0, y: 0, width: 1024, height: 1134 },
    prop: { x: 347, y: 1168, width: 326, height: 322 },
    propClip: 'ellipse(49% 49% at 50% 50%)',
    face: { x: 0.505, y: 0.47 },
    lamp: { x: 0.888, y: 0.46 },
    window: { x: 0.217, y: 0.188 },
    placed: { x: 0.515, y: 0.727, width: 0.265 },
  },
};
