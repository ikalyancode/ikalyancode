import { useCallback, useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import { RoadsterRun } from '../game/roadster-run';

/**
 * Playground — the roadster's launch pad.
 * One click unleashes a tiny rocket roadster that flies free over the
 * entire website: it follows your cursor, smashes floating words pulled
 * from the site's own headings, and rattles any heading it buzzes past.
 * Esc (or the button) parks it and hands the page back.
 */
export default function Playground() {
  const [active, setActive] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const gameRef = useRef<RoadsterRun | null>(null);
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const park = useCallback(() => {
    gameRef.current?.destroy();
    gameRef.current = null;
    setActive(false);
  }, []);

  const launch = useCallback(() => {
    if (gameRef.current) return;
    const game = new RoadsterRun({
      onScore: (s, b) => {
        setScore(s);
        setBest(b);
      },
      onExit: () => park(),
    });
    gameRef.current = game;
    const { score: s, best: b } = game.getScore();
    setScore(s);
    setBest(b);
    setActive(true);
  }, [park]);

  useEffect(() => () => park(), [park]);

  return (
    <section id="playground" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <p className="text-sm font-semibold tracking-[0.2em] text-[#0066cc] uppercase">
            Playground
          </p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">
            Unleash the roadster.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#6e6e73]">
            This site has a resident rocket car. Set it loose and it flies free
            across the whole page — chasing your cursor, smashing words pulled
            straight from these headings, and rattling anything it buzzes past.
            Small words pop in one hit; big ones take a beating.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 flex flex-col items-center gap-4">
            {!reducedMotion && (
              <button
                onClick={active ? park : launch}
                className={`group inline-flex items-center gap-3 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.03] active:scale-[0.98] ${
                  active
                    ? 'bg-[#1d1d1f] shadow-black/20'
                    : 'bg-[#e82127] shadow-red-900/25 hover:bg-[#c81e23]'
                }`}
              >
                {active ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <rect x="6" y="6" width="12" height="12" rx="2.5" />
                    </svg>
                    Park the roadster
                    <kbd className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-medium">esc</kbd>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </svg>
                    Unleash the roadster
                  </>
                )}
              </button>
            )}
            <p className="text-sm text-[#6e6e73]">
              {active
                ? isTouch
                  ? 'Drag to steer · tap BOOST for rocket power'
                  : 'Move to steer · click or Space to boost · WASD works too'
                : isTouch
                  ? 'Drag your finger to steer it around the site'
                  : 'It hunts the words on this very page'}
            </p>
          </div>
        </Reveal>
      </div>

      {/* HUD — fixed, above the game canvas, below the nav */}
      {active && (
        <div className="pointer-events-none fixed top-20 right-4 z-50 sm:right-6">
          <div className="rounded-2xl bg-black/60 px-5 py-3 text-white shadow-xl backdrop-blur-md">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-white/60 uppercase">
              Score
            </div>
            <div className="text-3xl font-bold tabular-nums">{score}</div>
            <div className="mt-1 text-xs text-white/60 tabular-nums">Best {best}</div>
          </div>
        </div>
      )}

      {/* Touch boost button */}
      {active && isTouch && (
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            gameRef.current?.boost();
          }}
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#e82127] px-10 py-4 text-base font-bold text-white shadow-2xl active:scale-95"
        >
          BOOST
        </button>
      )}
    </section>
  );
}
