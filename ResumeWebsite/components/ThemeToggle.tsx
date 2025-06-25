import React from 'react';
import { SunIcon, MoonIcon } from './icons';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors duration-300"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
};