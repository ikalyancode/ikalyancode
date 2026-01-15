import React from 'react';

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl shadow-cyan-900/5">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/60 via-transparent to-purple-50/60 dark:from-cyan-900/10 dark:via-slate-900/40 dark:to-purple-900/10 pointer-events-none" />
      <div className="relative p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-sky-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25">
            {icon}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-600 dark:text-cyan-300/80">Featured</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
          </div>
        </div>
        <div className="space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-200/90">
          {children}
        </div>
      </div>
    </section>
  );
};