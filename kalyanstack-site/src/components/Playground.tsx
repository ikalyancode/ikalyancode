import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Reveal from './Reveal';
import type { RampHud } from '../game/roadster-ramp';

// Lazy-load the 3D game so the main site stays light.
const RampExperience = lazy(() => import('./RampExperience'));

/**
 * Playground — the stunt ramp.
 * "Drive the roadster" opens a fullscreen 3D ramp: black void, J-shaped
 * neon ramp, truss tower. WASD to drive, B to boost, E for lift thrusters.
 */
export default function Playground() {
  const [driving, setDriving] = useState(false);
  const [hud, setHud] = useState<RampHud>({ speedKmh: 0, fanOn: true, contactG: 3, zone: 'ground' });
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const close = useCallback(() => setDriving(false), []);

  // Lock body scroll while driving.
  useEffect(() => {
    if (!driving) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [driving]);

  return (
    <section id="playground" className="py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <Reveal>
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
        </Reveal>
        <Reveal delay={120}>
          <div className="mt-8 flex flex-col items-center gap-4">
            {!reducedMotion && (
              <button
                onClick={() => setDriving(true)}
                className="group inline-flex items-center gap-3 rounded-full bg-[#e82127] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-red-900/25 transition-all hover:scale-[1.03] hover:bg-[#c81e23] active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                </svg>
                Drive the roadster
              </button>
            )}
            <p className="text-sm text-[#6e6e73]">
              {isTouch ? 'Touch controls appear on screen' : 'WASD to drive · B to boost · E for lift'}
            </p>
          </div>
        </Reveal>
      </div>

      {driving && (
        <Suspense fallback={null}>
          <RampExperience hud={hud} setHud={setHud} onExit={close} isTouch={isTouch} />
        </Suspense>
      )}
    </section>
  );
}
