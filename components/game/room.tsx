'use client';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  ArrowRight,
  Heart,
  Moon,
  Music2,
  Sparkles,
  Volume2,
  Hand,
  Star,
  Brush,
  Droplets,
  Apple,
  Cherry,
  Carrot,
  ShoppingBasket,
  Blocks,
  Cat,
  BookOpen,
  Check,
  Lightbulb,
  Circle,
} from 'lucide-react';
import {
  ACTIVITY_COUNTS,
  ROUTINES,
  acceptsDrop,
  dragOffset,
  type AnimalId,
  type Language,
  type Point,
} from '@/lib/game';
import type { Animal } from '@/lib/animals';
import { activityText, activityTitle, lineText, ui } from '@/lib/i18n';
import { Sprite, Portrait, Prop } from './art';
export const ACTIVITY_ICONS = {
  pet: Heart,
  bubbles: Sparkles,
  brush: Brush,
  wash: Droplets,
  tidy: ShoppingBasket,
  stars: Star,
  snack: Apple,
  ball: Circle,
  prop: Hand,
  kiss: Heart,
  lamp: Moon,
  story: BookOpen,
  song: Music2,
};
type RoomProps = {
  animal: Animal;
  step: number;
  collected: string[];
  language: Language;
  motion: boolean;
  onInteract: (room: AnimalId, step: number, token: string) => boolean;
  onNext: () => void;
  onHint: () => void;
  onExplore: (key: string) => void;
};
function DragItem({
  children,
  label,
  className = '',
  target,
  onDrop,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  target: () => DOMRect | undefined;
  onDrop: () => void;
}) {
  const drag = useRef<{
    id: number;
    start: Point;
    origin: Point;
    width: number;
  } | null>(null);
  const [ghost, setGhost] = useState<{
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const cancel = () => {
    drag.current = null;
    setGhost(null);
  };
  useEffect(() => {
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);
  const start = (e: PointerEvent<HTMLButtonElement>) => {
    if (!e.isPrimary || e.button !== 0 || drag.current) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    drag.current = {
      id: e.pointerId,
      start: { x: e.clientX, y: e.clientY },
      origin: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      width: r.width,
    };
    setGhost({
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      width: r.width,
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const delta = dragOffset(
      d.start,
      { x: e.clientX, y: e.clientY },
      { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight },
    );
    setGhost({
      x: d.origin.x + delta.x,
      y: d.origin.y + delta.y,
      width: d.width,
    });
  };
  const end = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const r = target();
    cancel();
    if (e.currentTarget.hasPointerCapture(e.pointerId))
      e.currentTarget.releasePointerCapture(e.pointerId);
    if (r && acceptsDrop(d.start, { x: e.clientX, y: e.clientY }, r, 0.85))
      onDrop();
  };
  return (
    <>
      <button
        className={'drag-item ' + className + (ghost ? ' dragging' : '')}
        aria-label={label}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onClick={(e) => {
          if (e.detail === 0) onDrop();
        }}
      >
        {children}
        <Hand className="item-hand" size={20} />
      </button>
      {ghost && (
        <div
          className={'drag-ghost ' + className}
          aria-hidden="true"
          style={{ left: ghost.x, top: ghost.y, width: ghost.width }}
        >
          {children}
        </div>
      )}
    </>
  );
}
const bubbles = [
  [20, 36],
  [75, 34],
  [30, 64],
  [70, 68],
  [50, 24],
];
const smudges = [
  [39, 46],
  [62, 49],
  [43, 68],
  [62, 70],
];
const stars = [
  [18, 20],
  [40, 17],
  [62, 22],
];
const balls = [
  [25, 76],
  [72, 75],
  [34, 64],
  [68, 65],
];
const position = (xy: number[]): CSSProperties => ({
  left: xy[0] + '%',
  top: xy[1] + '%',
});
export function Room({
  animal,
  step,
  collected,
  language,
  motion,
  onInteract,
  onNext,
  onHint,
  onExplore,
}: RoomProps) {
  const scene = useRef<HTMLDivElement>(null),
    body = useRef<HTMLButtonElement>(null),
    basket = useRef<HTMLDivElement>(null);
  const stroke = useRef<{ id: number; point: Point; step: number } | null>(
    null,
  );
  const [feedback, setFeedback] = useState(0),
    [dim, setDim] = useState(false),
    [ready, setReady] = useState(false);
  const sleeping = step >= ROUTINES[animal.id].length,
    kind = ROUTINES[animal.id][step],
    t = ui(language),
    name = animal.name[language];
  const count = kind ? ACTIVITY_COUNTS[kind] : 0,
    first =
      Array.from({ length: count }, (_, i) => String(i)).find(
        (s) => !collected.includes(s),
      ) || '0';
  const propsReady = step > ROUTINES[animal.id].indexOf('prop');
  const hit = (token = first) => {
    const accepted = onInteract(animal.id, step, token);
    if (accepted) setFeedback((n) => n + 1);
    return accepted;
  };
  const explore = (key: string) => {
    setFeedback((n) => n + 1);
    if (key === 'lamp') setDim((d) => !d);
    onExplore(key);
  };
  useEffect(() => {
    if (!sleeping) return;
    const timer = setTimeout(() => setReady(true), motion ? 1500 : 150);
    return () => clearTimeout(timer);
  }, [sleeping, motion]);
  useEffect(() => {
    const cancel = () => {
      stroke.current = null;
    };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);
  const stroking = kind === 'pet' || kind === 'brush';
  const strokeStart = (e: PointerEvent<HTMLButtonElement>) => {
    if (!stroking || !e.isPrimary || e.button !== 0) return;
    stroke.current = {
      id: e.pointerId,
      point: { x: e.clientX, y: e.clientY },
      step,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    hit();
  };
  const strokeMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = stroke.current;
    if (!s || s.id !== e.pointerId || s.step !== step) return;
    if (Math.hypot(s.point.x - e.clientX, s.point.y - e.clientY) >= 32) {
      if (hit()) s.point = { x: e.clientX, y: e.clientY };
    }
  };
  const Icon = ACTIVITY_ICONS[kind] || Moon;
  return (
    <section
      className={
        'room-screen ' +
        (sleeping ? 'asleep ' : '') +
        (dim ? 'dimmed ' : '') +
        (motion ? '' : 'still')
      }
      aria-label={t.roomOf + ' ' + name}
    >
      <div className="activity-heading">
        <Icon size={19} />
        <span>{sleeping ? t.sweetDreams : activityTitle(kind, language)}</span>
        <small>{sleeping ? <Check size={16} /> : <>{step + 1} / 6</>}</small>
      </div>
      <div
        className="room-art"
        ref={scene}
        style={{ touchAction: kind === 'wash' ? 'none' : undefined }}
        onPointerMove={(e) => {
          if (kind !== 'wash' || e.buttons !== 1) return;
          const r = e.currentTarget.getBoundingClientRect();
          const index = smudges.findIndex(
            ([x, y], i) =>
              !collected.includes(String(i)) &&
              Math.hypot(
                e.clientX - (r.left + (r.width * x) / 100),
                e.clientY - (r.top + (r.height * y) / 100),
              ) < 32,
          );
          if (index >= 0) hit(String(index));
        }}
      >
        <Sprite
          id={animal.id}
          crop={animal.room}
          className={'room-background ' + (feedback ? 'friend-react' : '')}
          alt={name + ' · ' + animal.kind[language]}
        />
        {propsReady && (
          <div
            className={'placed-prop placed-' + animal.id}
            style={{
              left: animal.placed.x * 100 + '%',
              top: animal.placed.y * 100 + '%',
              width: animal.placed.width * 100 + '%',
            }}
          >
            <Prop animal={animal} />
          </div>
        )}
        <div className="night-shade" />
        <button
          ref={body}
          className={
            'scene-target friend-target ' + (stroking ? 'stroke-target' : '')
          }
          style={{ left: '27%', top: '34%', width: '47%', height: '47%' }}
          aria-label={
            sleeping
              ? t.sweetDreams
              : stroking
                ? activityText(kind, language)
                : kind === 'kiss'
                  ? activityText(kind, language)
                  : t.exploreFriend
          }
          onPointerDown={strokeStart}
          onPointerMove={strokeMove}
          onPointerUp={() => {
            stroke.current = null;
          }}
          onPointerCancel={() => {
            stroke.current = null;
          }}
          onLostPointerCapture={() => {
            stroke.current = null;
          }}
          onClick={(e) => {
            if (sleeping) {
              explore('goodnight_' + animal.id);
              return;
            }
            if (stroking) {
              if (e.detail === 0) hit();
            } else if (kind === 'kiss') hit();
            else explore('tickle');
          }}
        >
          {stroking && (
            <span className="gesture-cue">
              <Icon />
              <Hand size={20} />
            </span>
          )}
          {kind === 'prop' && (
            <span className="target-heart">
              <Heart />
            </span>
          )}
          {kind === 'kiss' && (
            <span className="kiss-hint">
              <Heart fill="currentColor" />
            </span>
          )}
        </button>
        <button
          className="explore-hotspot moon-hotspot"
          style={{
            left: animal.window.x * 100 + '%',
            top: animal.window.y * 100 + '%',
          }}
          aria-label={t.exploreMoon}
          onClick={() => explore('moon')}
        >
          <Sparkles size={18} />
        </button>
        <button
          className={
            'explore-hotspot lamp-hotspot ' +
            (kind === 'lamp' ? 'active-lamp' : '')
          }
          style={{
            left: animal.lamp.x * 100 + '%',
            top: animal.lamp.y * 100 + '%',
          }}
          aria-label={
            kind === 'lamp' ? activityText(kind, language) : t.exploreLamp
          }
          onClick={() => (kind === 'lamp' ? hit('0') : explore('lamp'))}
        >
          <Lightbulb size={19} />
        </button>
        {(kind === 'bubbles' || kind === 'wash' || kind === 'stars') &&
          (kind === 'bubbles'
            ? bubbles
            : kind === 'wash'
              ? smudges
              : stars
          ).map((xy, i) => {
            const done = collected.includes(String(i));
            return (
              <button
                key={kind + i}
                className={
                  'micro-target target-' + kind + (done ? ' collected' : '')
                }
                style={{ ...position(xy), '--i': i } as CSSProperties}
                aria-label={activityTitle(kind, language) + ' ' + (i + 1)}
                aria-pressed={done}
                disabled={done}
                onClick={() => hit(String(i))}
                onPointerEnter={(e) => {
                  if (kind === 'wash' && e.buttons === 1) hit(String(i));
                }}
                onPointerDown={(e) => {
                  if (kind === 'wash') {
                    e.preventDefault();
                    hit(String(i));
                  }
                }}
              >
                {kind === 'stars' ? (
                  <Star fill={done ? 'currentColor' : 'none'} />
                ) : kind === 'wash' ? (
                  <Droplets />
                ) : (
                  <span />
                )}
              </button>
            );
          })}
        {kind === 'ball' && (
          <button
            key={'ball' + collected.length}
            className="micro-target play-ball"
            style={position(balls[collected.length])}
            aria-label={activityText(kind, language)}
            onClick={() => hit()}
          >
            <Circle />
            <Star fill="currentColor" />
          </button>
        )}
        {sleeping && (
          <div className="sleep-marks" aria-hidden="true">
            <span>z</span>
            <span>z</span>
            <span>z</span>
          </div>
        )}
        {feedback > 0 && (
          <div key={feedback} className="mimo-hearts" aria-hidden="true">
            <Heart />
            <Sparkles />
            <Heart />
          </div>
        )}
        <span className="room-name">
          <Heart size={15} />
          {name}
        </span>
      </div>
      <div className={'activity-tray tray-' + kind}>
        {sleeping ? (
          <div className="sleep-message">
            <Moon size={25} />
            <span>
              {t.sweetDreams},<br />
              <strong>{name}</strong>
            </span>
          </div>
        ) : kind === 'prop' ? (
          <DragItem
            key={animal.id + step}
            label={activityText(kind, language)}
            className={'prop-button prop-' + animal.id}
            target={() => body.current?.getBoundingClientRect()}
            onDrop={() => hit('0')}
          >
            <Prop animal={animal} />
          </DragItem>
        ) : kind === 'brush' ? (
          <DragItem
            label={activityText(kind, language)}
            className="small-object brush-object"
            target={() => body.current?.getBoundingClientRect()}
            onDrop={() => hit()}
          >
            <Brush size={38} />
          </DragItem>
        ) : kind === 'snack' || kind === 'tidy' ? (
          <div className="objects-row">
            {(kind === 'snack'
              ? [Apple, Cherry, Carrot]
              : [Blocks, Cat, Star]
            ).map((ObjectIcon, i) => (
              <span
                key={i}
                className={
                  'object-slot ' +
                  (collected.includes(String(i)) ? 'empty-slot' : '')
                }
              >
                {collected.includes(String(i)) ? (
                  <Check size={20} />
                ) : (
                  <DragItem
                    label={activityTitle(kind, language) + ' ' + (i + 1)}
                    className={'small-object object-' + i}
                    target={() =>
                      kind === 'tidy'
                        ? basket.current?.getBoundingClientRect()
                        : body.current?.getBoundingClientRect()
                    }
                    onDrop={() => hit(String(i))}
                  >
                    <ObjectIcon size={37} />
                  </DragItem>
                )}
              </span>
            ))}
            {kind === 'tidy' && (
              <div ref={basket} className="toy-basket" aria-label={t.toyBasket}>
                <ShoppingBasket size={45} />
                {collected.length > 0 && (
                  <span>
                    {collected.length === 3 ? (
                      <Heart size={13} />
                    ) : (
                      <Check size={13} />
                    )}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : kind === 'song' ? (
          <div className="music-keys">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                className={
                  'music-key note-' +
                  i +
                  (collected.includes(String(i)) ? ' played' : '')
                }
                aria-label={activityTitle(kind, language) + ' ' + (i + 1)}
                aria-pressed={collected.includes(String(i))}
                disabled={collected.includes(String(i))}
                onClick={() => hit(String(i))}
              >
                {collected.includes(String(i)) ? <Check /> : <Music2 />}
              </button>
            ))}
          </div>
        ) : kind === 'story' ? (
          <div className="story-book">
            <div className="story-picture">
              {collected.length === 0 ? (
                <Moon size={46} fill="currentColor" />
              ) : collected.length === 1 ? (
                <Portrait animal={animal} />
              ) : (
                <Heart size={44} fill="currentColor" />
              )}
            </div>
            <div>
              <p aria-live="polite">
                {lineText('story' + collected.length, language)}
              </p>
              <button
                onClick={() => hit()}
                className="story-next"
                aria-label={collected.length === 2 ? t.finishStory : t.nextPage}
              >
                <span>
                  {collected.length === 2 ? t.finishStory : t.nextPage}
                </span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : (
          <button
            className={'round-action routine-action kind-' + kind}
            onClick={() =>
              ['pet', 'brush', 'kiss', 'lamp'].includes(kind) ? hit() : onHint()
            }
            aria-label={activityText(kind, language)}
          >
            <Icon fill={kind === 'kiss' ? 'currentColor' : 'none'} />
          </button>
        )}
        {!sleeping && (
          <div
            className="micro-progress"
            aria-label={collected.length + ' ' + t.of + ' ' + count}
          >
            {Array.from({ length: count }, (_, i) => (
              <span
                key={i}
                className={collected.includes(String(i)) ? 'complete' : ''}
              />
            ))}
          </div>
        )}
      </div>
      <footer className="room-footer">
        {sleeping ? (
          <button className="next-button" onClick={onNext} disabled={!ready}>
            <span>{ready ? t.continue : t.shh}</span>
            <ArrowRight />
          </button>
        ) : (
          <>
            <span className="instruction" aria-live="polite">
              {activityText(kind, language)}
            </span>
            <button
              className="hint-button"
              onClick={onHint}
              aria-label={t.hint}
            >
              <Volume2 size={20} />
            </button>
          </>
        )}
      </footer>
    </section>
  );
}
