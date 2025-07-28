import React from 'react';
import type { Experience } from '../types';

interface ExperienceCardProps {
  job: Experience;
  isFirst: boolean;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ job, isFirst }) => {
  return (
    <div className="relative group">
       <div className={`absolute -left-10 top-1.5 w-4 h-4 rounded-full ${isFirst ? 'bg-cyan-500 dark:bg-cyan-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-cyan-500 dark:group-hover:bg-cyan-400'} transition-colors duration-300`}></div>
      <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{job.role}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{job.period}</p>
        </div>
        <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-md mb-4">{job.company}</p>
        <ul className="space-y-3 text-slate-600 dark:text-slate-300 list-disc list-inside">
          {job.description.map((point, index) => (
            <li key={index} className="leading-relaxed">{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};