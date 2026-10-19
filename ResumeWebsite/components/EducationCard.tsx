import React from 'react';
import type { Education } from '../types';

interface EducationCardProps {
    education: Education;
}

export const EducationCard: React.FC<EducationCardProps> = ({ education }) => {
    return (
        <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/80 p-6 shadow-lg shadow-cyan-900/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Education</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{education.degree}</h3>
                    <p className="text-cyan-700 dark:text-cyan-300 font-semibold">{education.university}</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-1 text-sm font-semibold text-white shadow-md">
                    {education.period}
                </div>
            </div>
            <p className="mt-3 text-slate-600 dark:text-slate-300">{education.emphasis}</p>
        </div>
    );
}