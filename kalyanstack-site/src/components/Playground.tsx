import { useEffect, useRef, useState } from 'react';
import Reveal from './Reveal';
import { RoadsterRun } from '../game/roadster-run';

/**
 * Playground — an interactive break in the portfolio.
 * "Roadster Run": steer the flying roadster, smash the drifting words.
 * Small words pop in one hit; big ones take a beating.
 */
export default function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Only boot the game once the section scrolls into view.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reducedMotion) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setReady(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!ready || !canvasRef.current || reducedMotion) return;
    const game = new RoadsterRun(canvasRef.current, {
      onScore: (s, b) => {
        setScore(s);
        setBest(b);
      },
    });
    return () => game.destroy();
  }, [ready, reducedMotion]);

  return (
    <section id="playground" className="bg-[#07070b]">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-white md:text-[44px]">
            Playground
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[16px] text-white/60 md:text-[19px]">
            Roadster Run — take the wheel and smash the stack. Small words pop
            in one hit; big ones take a beating.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div
            ref={wrapRef}
            className="relative mt-12 overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
          >
            {reducedMotion ? (
              <div className="flex h-[380px] items-center justify-center bg-[#0b0b12] px-6 text-center md:h-[480px]">
                <p className="max-w-sm text-[15px] leading-relaxed text-white/60">
                  Motion is reduced on your device, so the roadster is parked.
                  Turn off reduced motion to play.
                </p>
              </div>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  className="block h-[380px] w-full cursor-crosshair touch-none md:h-[480px]"
                  aria-label="Roadster Run game: steer the car with your pointer, click or press space to boost, smash the floating words"
                />
                {/* HUD */}
                <div className="pointer-events-none absolute left-5 top-4 flex items-center gap-5 font-mono text-[13px] tracking-widest">
                  <span className="text-white/85">
                    SCORE <span className="text-white">{score}</span>
                  </span>
                  <span className="text-white/40">
                    BEST <span className="text-white/70">{best}</span>
                  </span>
                </div>
                <div className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-[12px] tracking-wide text-white/40">
                  Move to steer · Click / Space to boost · Arrows or WASD work too
                </div>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
