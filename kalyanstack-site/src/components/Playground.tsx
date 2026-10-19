import { lazy, Suspense, useCallback, useState } from 'react';
import Reveal from './Reveal';
import type { RampHud } from '../game/roadster-ramp';

// Lazy-load the 3D game so the main site stays light.
const RampExperience = lazy(() => import('./RampExperience'));

/**
 * Playground — the stunt ramp, embedded as a 16:9 frame in the page.
 * Click play to drive the roadster: WASD down the runway, climb the wall,
 * launch off the lip. ?demo=1 autostarts an autopilot run (for testing).
 */
export default function Playground() {
  const [driving, setDriving] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('demo') === '1'
  );
  const [hud, setHud] = useState<RampHud>({ speedKmh: 0, fanOn: true, contactG: 3, zone: 'ground' });
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const demo =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('demo') === '1';
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stop = useCallback(() => setDriving(false), []);

  return (
    <section id="playground" className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-[#0066cc] uppercase">
              Playground
            </p>
            <h2 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-[#1d1d1f]">
              Take the ramp.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#6e6e73]">
              A drivable 3D roadster on a stunt ramp — black void, neon edges,
              cold-gas thrusters. Floor it down the runway, climb the wall,
              and launch off the lip.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-black/10">
            {driving && !reducedMotion ? (
              <Suspense fallback={null}>
                <RampExperience
                  hud={hud}
                  setHud={setHud}
                  onExit={stop}
                  isTouch={isTouch}
                  demo={demo}
                />
              </Suspense>
            ) : (
              /* Cover: click to drive */
              <button
                onClick={() => setDriving(true)}
                className="group absolute inset-0 flex w-full flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_center,#1a0505_0%,#000000_70%)]"
                aria-label="Drive the roadster"
              >
                <span className="text-sm font-semibold tracking-[0.25em] text-red-500/80 uppercase">
                  Stunt ramp
                </span>
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e82127] text-white shadow-xl shadow-red-900/40 transition-transform group-hover:scale-110">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                </span>
                <span className="text-xl font-semibold text-white">Drive the roadster</span>
                <span className="text-sm text-white/50">
                  {isTouch ? 'Touch controls included' : 'WASD to drive · B to boost · E for lift'}
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
