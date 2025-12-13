import React, { useState, useEffect } from 'react';
import { RESUME_DATA } from './constants';
import { Header } from './components/Header';
import { Section } from './components/Section';
import { SkillPill } from './components/SkillPill';
import { ExperienceCard } from './components/ExperienceCard';
import { EducationCard } from './components/EducationCard';
import { ContributionIcon, EducationIcon, ExperienceIcon, GitHubIcon, LinkedInIcon, SkillsIcon } from './components/icons';
import LetterGlitch from './components/LetterGlitch';
import Prism from './components/Prism';
import SplashCursor from './components/SplashCursor';
import Chatbot from './src/components/Chatbot';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { summary, skills, experience, contributions, education } = RESUME_DATA;

  const [theme, setTheme] = useState<Theme>('dark');
  const [clickCount, setClickCount] = useState(0);
  const [isHacked, setIsHacked] = useState(false);
  const [fluidCursorEnabled, setFluidCursorEnabled] = useState(false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = 'font-sans antialiased bg-slate-900 text-slate-300';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'font-sans antialiased bg-slate-50 text-slate-700';
    }
  }, [theme]);

  const handleThemeToggle = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    if (newClickCount === 2) {
      setIsHacked(true);
      return;
    }
    
    if(isHacked) {
      setIsHacked(false);
    }

    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleExitGlitch = () => {
    setIsHacked(false);
    setClickCount(0);
  };

  const handleCursorToggle = () => {
    setFluidCursorEnabled((prev) => !prev);
  };

  return (
    <>
      {isHacked && <LetterGlitch onExit={handleExitGlitch} />}

      <div className={`min-h-screen bg-gradient-to-br from-white via-slate-50 to-sky-50 text-slate-800 transition-opacity duration-500 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 ${isHacked ? 'opacity-0' : 'opacity-100'}`}>
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_82%_0%,rgba(236,72,153,0.08),transparent_22%),radial-gradient(circle_at_40%_90%,rgba(34,211,238,0.08),transparent_18%)]" />
        <Header data={RESUME_DATA} theme={theme} onToggleTheme={handleThemeToggle} />
        <main className="relative container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-14">

          <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-8 sm:p-12 shadow-2xl dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/70 dark:to-slate-950">
            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(99,102,241,0.22),transparent_35%)] dark:opacity-40" />
            <div className="relative grid gap-10 lg:grid-cols-5 lg:items-center">
              <div className="lg:col-span-3 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-cyan-700 ring-1 ring-cyan-200 shadow-sm dark:bg-white/10 dark:text-cyan-100 dark:ring-cyan-500/40">
                  <span className="h-2 w-2 rounded-full bg-cyan-500" />
                  Building thoughtful digital experiences
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 drop-shadow-lg dark:text-white">
                  Full Stack Engineer crafting resilient, human-centered products.
                </h1>
                <p className="max-w-3xl text-lg leading-relaxed text-slate-700/90 dark:text-slate-200/90">{summary}</p>
                <div className="flex flex-wrap gap-4">
                  <a href={RESUME_DATA.contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:translate-y-[-1px] hover:shadow-cyan-500/35">
                    <LinkedInIcon />
                    Connect on LinkedIn
                  </a>
                  <a href="https://calendly.com/kalyan-psu/30min" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-cyan-400 hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400">
                    <ContributionIcon />
                    Book a conversation
                  </a>
                  <button
                    type="button"
                    onClick={handleCursorToggle}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/90 px-5 py-3 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:text-cyan-600 dark:border-cyan-500/40 dark:bg-slate-900 dark:text-cyan-200 dark:hover:border-cyan-400"
                    aria-pressed={fluidCursorEnabled}
                  >
                    <SkillsIcon />
                    {fluidCursorEnabled ? 'Disable fluid cursor' : 'Activate fluid cursor'}
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-xl dark:border-slate-800/80 dark:bg-slate-900/70">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-100/50 via-transparent to-purple-100/40 blur-3xl dark:from-cyan-900/30 dark:to-purple-900/30" />
                  <div className="relative rounded-xl border border-white/80 bg-white shadow-lg shadow-cyan-900/10 ring-1 ring-cyan-100/80 dark:border-slate-800 dark:bg-slate-950 dark:ring-cyan-900/40">
                    <Prism animationType="hover" bloom={1.2} glow={1.2} scale={3.2} colorFrequency={1.2} />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[{ label: 'Years of building', value: '5+', detail: 'Full stack delivery across web, CMS, and cloud.' }, { label: 'Tech mastered', value: '20+', detail: 'Languages, frameworks, and delivery tooling.' }, { label: 'Deployments shipped', value: '50+', detail: 'Customer-facing launches with zero downtime.' }, { label: 'Collaboration score', value: 'A+', detail: 'Trusted partner to design, product, and ops.' }].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-cyan-900/10 dark:border-slate-800/80 dark:bg-slate-900/70">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{stat.label}</p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{stat.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <Section title="Technical Skills" icon={<SkillsIcon />}>
            <div className="grid gap-6 md:grid-cols-2">
              {skills.map((skillCategory) => (
                <div key={skillCategory.category} className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-900/60 p-5 shadow-lg shadow-cyan-900/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{skillCategory.category}</h3>
                    <span className="rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-md">{skillCategory.skills.length} tools</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skillCategory.skills.map((skill) => (
                      <SkillPill key={skill} name={skill} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Work Experience" icon={<ExperienceIcon />}>
            <div className="relative ml-2 border-l border-slate-200 dark:border-slate-800/70 pl-8">
               <div className="absolute -left-[0.35rem] top-0 h-full w-1 bg-gradient-to-b from-cyan-500 via-sky-500 to-purple-500 rounded-full" />
               <div className="space-y-10">
                 {experience.map((job, index) => (
                    <ExperienceCard key={job.id} job={job} isFirst={index === 0}/>
                 ))}
               </div>
            </div>
          </Section>

          <Section title="Key Contributions" icon={<ContributionIcon />}>
            <div className="grid gap-4 md:grid-cols-2">
              {contributions.map((contribution, index) => (
                <div key={index} className="rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/60 p-5 shadow-md shadow-cyan-900/10">
                  <div className="flex items-center gap-3 text-cyan-500 dark:text-cyan-300">
                    <ContributionIcon />
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">Impact</p>
                  </div>
                  <p className="mt-2 text-base text-slate-700 dark:text-slate-100">{contribution}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Education" icon={<EducationIcon />}>
              <div className="grid gap-4 md:grid-cols-2">
                {education.map((edu, index) => (
                    <EducationCard key={index} education={edu} />
                ))}
              </div>
          </Section>

          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-8 sm:px-10 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/60 via-sky-100/60 to-purple-100/60 dark:from-cyan-900/20 dark:via-slate-900/40 dark:to-purple-900/20" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-300">Let’s collaborate</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Need a partner who ships? I’m ready.</h3>
                <p className="text-slate-600 dark:text-slate-300">I combine engineering rigor with product intuition to deliver modern experiences.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={RESUME_DATA.contact.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-cyan-100 transition hover:border-cyan-300 hover:ring-cyan-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:border-cyan-500">
                  <GitHubIcon />
                  View GitHub
                </a>
                <a href={RESUME_DATA.contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-500/25">
                  <LinkedInIcon />
                  Connect
                </a>
              </div>
            </div>
          </section>

        </main>
        <footer className="text-center py-8 text-slate-500 text-sm dark:text-slate-400">
          <p className="font-medium text-slate-600 dark:text-slate-300">Built with React & Tailwind CSS · Crafted with care</p>
          <p className="text-slate-500 dark:text-slate-500">&copy; {new Date().getFullYear()} Kalyan Nalladimmu. All Rights Reserved.</p>
        </footer>
      </div>

      {fluidCursorEnabled && <SplashCursor TRANSPARENT DYE_RESOLUTION={1024} COLOR_UPDATE_SPEED={12} />}

      <Chatbot />

    </>
  );
};

export default App;
