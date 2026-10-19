import { useEffect, useState } from 'react';
import { navLinks, profile } from '../data';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 backdrop-blur-xl transition-colors ${
        scrolled ? 'bg-white/70 shadow-[0_1px_0_rgba(0,0,0,0.06)]' : 'bg-white/50'
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-[980px] items-center justify-between px-5">
        <a href="#top" className="text-[15px] font-semibold tracking-tight text-ink">
          {profile.name}
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-xs font-normal text-ink/80 transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center md:hidden"
        >
          <span className="relative block h-[11px] w-5">
            <span
              className={`absolute left-0 top-0 h-[1.5px] w-5 bg-ink transition-all ${
                open ? 'top-[5px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[10px] h-[1.5px] w-5 bg-ink transition-all ${
                open ? 'top-[5px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <ul className="border-t border-black/5 bg-white/95 px-5 py-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-black/5 py-3 text-[15px] text-ink last:border-0"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
