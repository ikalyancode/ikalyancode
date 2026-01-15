import React from 'react';
import type { Experience } from '../types';

interface ExperienceCardProps {
  job: Experience;
  isFirst: boolean;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ job, isFirst }) => {
  return (
    <div className="relative group">
       <div className={`absolute -left-10 top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900 shadow-md ${isFirst ? 'bg-gradient-to-br from-cyan-500 to-purple-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700 group-hover:bg-cyan-400 group-hover:shadow-cyan-500/50'} transition-all duration-300`}></div>
      <div className="relative overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-gradient-to-br from-white/90 via-white/60 to-cyan-50/60 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-900/40 p-6 shadow-xl transition-transform duration-300 group-hover:-translate-y-1">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-500 opacity-70" />
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">{job.company}</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{job.role}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{job.period}</p>
          </div>
          <div className="inline-flex h-10 items-center rounded-full bg-white/80 px-4 text-sm font-medium text-slate-600 ring-1 ring-cyan-100/80 shadow-sm dark:bg-slate-800/70 dark:text-slate-200 dark:ring-cyan-900/50">
            Impact Highlights
          </div>
        </div>
        <ul className="relative mt-4 space-y-3 text-slate-700 dark:text-slate-200">
          {job.description.map((point, index) => (
            <li key={index} className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};