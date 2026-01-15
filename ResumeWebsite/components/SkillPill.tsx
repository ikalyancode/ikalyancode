import React from 'react';

interface SkillPillProps {
  name: string;
}

export const SkillPill: React.FC<SkillPillProps> = ({ name }) => {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 px-3.5 py-1.5 text-sm font-semibold text-slate-800 dark:text-white shadow-lg shadow-cyan-900/10 ring-1 ring-slate-200/70 dark:ring-slate-700/70">
      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
      {name}
    </span>
  );
};