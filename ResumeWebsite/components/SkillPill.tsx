import React from 'react';

interface SkillPillProps {
  name: string;
}

export const SkillPill: React.FC<SkillPillProps> = ({ name }) => {
  return (
    <span className="bg-slate-200 dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-sm font-medium px-3 py-1 rounded-full shadow-sm">
      {name}
    </span>
  );
};