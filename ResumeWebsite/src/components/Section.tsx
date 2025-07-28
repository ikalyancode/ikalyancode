interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, icon, children }) => {
  return (
    <section className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm">
      <div className="flex items-center mb-6">
        <div className="text-cyan-500 dark:text-cyan-400 mr-4">{icon}</div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-wide">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
};