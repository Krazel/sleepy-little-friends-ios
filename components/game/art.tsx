/* oxlint-disable nextjs/no-img-element -- Atlas crops require native image dimensions. */
import type { CSSProperties } from 'react';
import { Moon } from 'lucide-react';
import type { AnimalId } from '@/lib/game';
import type { Animal, Crop } from '@/lib/animals';
export function Sprite({
  id,
  crop,
  className = '',
  style = {},
  alt = '',
}: {
  id: AnimalId;
  crop: Crop;
  className?: string;
  style?: CSSProperties;
  alt?: string;
}) {
  return (
    <span
      className={'sprite ' + className}
      style={{ aspectRatio: crop.width + '/' + crop.height, ...style }}
    >
      <img
        src={'/art/' + id + '.png'}
        alt={alt}
        draggable={false}
        style={{
          width: (1024 / crop.width) * 100 + '%',
          maxWidth: 'none',
          left: (-crop.x / crop.width) * 100 + '%',
          top: (-crop.y / crop.height) * 100 + '%',
        }}
      />
    </span>
  );
}
export function Prop({ animal }: { animal: Animal }) {
  return (
    <Sprite
      id={animal.id}
      crop={animal.prop}
      style={{ clipPath: animal.propClip }}
    />
  );
}
export function Portrait({
  animal,
  sleeping = false,
}: {
  animal: Animal;
  sleeping?: boolean;
}) {
  return (
    <span className={'portrait ' + (sleeping ? 'is-sleeping' : '')}>
      <Sprite
        id={animal.id}
        crop={{
          x: animal.face.x * 1024 - 185,
          y: animal.face.y * animal.room.height - 185,
          width: 370,
          height: 370,
        }}
      />
      <span className="portrait-moon" aria-hidden="true">
        <Moon size={17} fill="currentColor" />
      </span>
    </span>
  );
}
