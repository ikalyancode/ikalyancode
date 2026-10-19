import { useEffect, useRef, useState } from 'react';
import { RoadsterRamp, type RampHud } from '../game/roadster-ramp';

interface Props {
  hud: RampHud;
  setHud: (h: RampHud) => void;
  onExit: () => void;
  isTouch: boolean;
  demo?: boolean;
}

/** 3D driving experience, embedded in a 16:9 frame: canvas + HUD + controls. */
export default function RampExperience({ hud, setHud, onExit, isTouch, demo }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<RoadsterRamp | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    try {
      const game = new RoadsterRamp(mountRef.current, {
        onHud: (h) => setHud(h),
        onExit,
        onFirstFrame: () => setReady(true),
      });
      if (demo) game.demoMode = true;
      gameRef.current = game;
    } catch (e) {
      console.error('[ramp-experience] failed to start 3D:', e);
      setError(true);
    }
    return () => {
      gameRef.current?.dispose();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hold = (key: 'left' | 'right' | 'gas' | 'brake' | 'lift') => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      if (gameRef.current) gameRef.current.touch[key] = true;
    },
    onPointerUp: () => {
      if (gameRef.current) gameRef.current.touch[key] = false;
    },
    onPointerLeave: () => {
      if (gameRef.current) gameRef.current.touch[key] = false;
    },
    onPointerCancel: () => {
      if (gameRef.current) gameRef.current.touch[key] = false;
    },
  });

  const zoneLabel = hud.zone === 'ground' ? 'ground' : hud.zone === 'ramp' ? 'ramp' : 'air';

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <div ref={mountRef} className="absolute inset-0" />

      {/* Loading / error states */}
      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3 text-white/70">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white/90" />
            <span className="text-sm font-medium tracking-wide">Warming up the thrusters…</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold text-white">3D couldn't start on this device</p>
            <p className="mt-2 text-sm text-white/60">
              Your browser may have WebGL disabled. Try a recent Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      )}

      {/* HUD pill */}
      <div className="pointer-events-none absolute top-3 left-3 rounded-xl bg-black/60 px-4 py-2 text-white backdrop-blur-md sm:top-4 sm:left-4">
        <div className="text-xl font-bold tabular-nums sm:text-2xl">
          {hud.speedKmh} <span className="text-xs font-medium text-white/60">km/h</span>
        </div>
        <div className="mt-0.5 text-[11px] text-white/60 tabular-nums sm:text-xs">
          fan {hud.fanOn ? '2.0' : '0.0'} G · contact {hud.contactG.toFixed(2)} G · {zoneLabel}
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onExit}
        aria-label="Stop driving"
        className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80 sm:top-4 sm:right-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Controls legend */}
      {!isTouch && (
        <div className="pointer-events-none absolute right-3 bottom-3 hidden rounded-xl bg-black/60 px-4 py-2 text-[11px] leading-relaxed text-white/75 backdrop-blur-md sm:block">
          <span className="font-semibold text-white">WASD</span> drive ·{' '}
          <span className="font-semibold text-white">E</span> lift ·{' '}
          <span className="font-semibold text-white">Space</span> drop ·{' '}
          <span className="font-semibold text-white">B</span> boost ·{' '}
          <span className="font-semibold text-white">F</span> fan ·{' '}
          <span className="font-semibold text-white">C</span> cam ·{' '}
          <span className="font-semibold text-white">R</span> reset ·{' '}
          <span className="font-semibold text-white">esc</span> stop
        </div>
      )}

      {/* Touch controls */}
      {isTouch && (
        <>
          <div className="absolute bottom-4 left-3 flex gap-2">
            <button {...hold('left')} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-md active:bg-white/30">◀</button>
            <button {...hold('right')} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-md active:bg-white/30">▶</button>
          </div>
          <div className="absolute right-3 bottom-4 flex gap-2">
            <button {...hold('brake')} className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-xl text-white backdrop-blur-md active:bg-white/30">▼</button>
            <button {...hold('gas')} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#e82127]/80 text-xl text-white backdrop-blur-md active:bg-[#e82127]">▲</button>
          </div>
          <div className="absolute bottom-20 left-1/2 flex -translate-x-1/2 gap-2">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                if (gameRef.current) gameRef.current.touch.boost = true;
              }}
              className="rounded-full bg-orange-500/80 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md active:bg-orange-500"
            >
              BOOST
            </button>
            <button {...hold('lift')} className="rounded-full bg-sky-500/80 px-5 py-2.5 text-xs font-bold text-white backdrop-blur-md active:bg-sky-500">
              LIFT
            </button>
          </div>
        </>
      )}
    </div>
  );
}
