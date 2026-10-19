import { useEffect, useRef, useState } from 'react';
import { RoadsterRamp, type RampHud } from '../game/roadster-ramp';

interface Props {
  hud: RampHud;
  setHud: (h: RampHud) => void;
  onExit: () => void;
  isTouch: boolean;
}

/** Fullscreen 3D driving overlay: canvas + HUD + controls + touch buttons. */
export default function RampExperience({ hud, setHud, onExit, isTouch }: Props) {
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
    <div className="fixed inset-0 z-50 bg-black">
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
            <button
              onClick={onExit}
              className="mt-6 rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/25"
            >
              Back to the site
            </button>
          </div>
        </div>
      )}

      {/* HUD pill */}
      <div className="pointer-events-none absolute top-4 left-4 rounded-2xl bg-black/60 px-5 py-3 text-white backdrop-blur-md">
        <div className="text-2xl font-bold tabular-nums">
          {hud.speedKmh} <span className="text-sm font-medium text-white/60">km/h</span>
        </div>
        <div className="mt-0.5 text-xs text-white/60 tabular-nums">
          fan {hud.fanOn ? '2.0' : '0.0'} G · contact {hud.contactG.toFixed(2)} G · {zoneLabel}
        </div>
      </div>

      {/* Close */}
      <button
        onClick={onExit}
        aria-label="Exit driving"
        className="absolute top-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Controls legend */}
      {!isTouch && (
        <div className="pointer-events-none absolute right-4 bottom-4 rounded-2xl bg-black/60 px-5 py-3 text-xs leading-relaxed text-white/75 backdrop-blur-md">
          <span className="font-semibold text-white">WASD</span> drive ·{' '}
          <span className="font-semibold text-white">E</span> lift ·{' '}
          <span className="font-semibold text-white">Space</span> drop ·{' '}
          <span className="font-semibold text-white">B</span> boost ·{' '}
          <span className="font-semibold text-white">F</span> fan ·{' '}
          <span className="font-semibold text-white">C</span> cam ·{' '}
          <span className="font-semibold text-white">L</span> lamps ·{' '}
          <span className="font-semibold text-white">R</span> reset ·{' '}
          <span className="font-semibold text-white">M</span> sound ·{' '}
          <span className="font-semibold text-white">esc</span> exit
        </div>
      )}

      {/* Touch controls */}
      {isTouch && (
        <>
          <div className="absolute bottom-6 left-4 flex gap-3">
            <button {...hold('left')} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur-md active:bg-white/30">◀</button>
            <button {...hold('right')} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur-md active:bg-white/30">▶</button>
          </div>
          <div className="absolute right-4 bottom-6 flex gap-3">
            <button {...hold('brake')} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-2xl text-white backdrop-blur-md active:bg-white/30">▼</button>
            <button {...hold('gas')} className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e82127]/80 text-2xl text-white backdrop-blur-md active:bg-[#e82127]">▲</button>
          </div>
          <div className="absolute bottom-28 left-1/2 flex -translate-x-1/2 gap-3">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                if (gameRef.current) gameRef.current.touch.boost = true;
              }}
              className="rounded-full bg-orange-500/80 px-6 py-3 text-sm font-bold text-white backdrop-blur-md active:bg-orange-500"
            >
              BOOST
            </button>
            <button {...hold('lift')} className="rounded-full bg-sky-500/80 px-6 py-3 text-sm font-bold text-white backdrop-blur-md active:bg-sky-500">
              LIFT
            </button>
          </div>
        </>
      )}
    </div>
  );
}
