import React, { useState, useEffect } from 'react';
import { RESUME_DATA } from './constants';
import { Header } from './components/Header';
import { Section } from './components/Section';
import { SkillPill } from './components/SkillPill';
import { ExperienceCard } from './components/ExperienceCard';
import { EducationCard } from './components/EducationCard';
import { ContributionIcon, EducationIcon, ExperienceIcon, GitHubIcon, LinkedInIcon, SkillsIcon } from './components/icons';
import LetterGlitch from './components/LetterGlitch';
import Chatbot from './src/components/Chatbot';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { summary, skills, experience, contributions, education } = RESUME_DATA;

  const [theme, setTheme] = useState<Theme>('dark');
  const [clickCount, setClickCount] = useState(0);
  const [isHacked, setIsHacked] = useState(false);

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

  return (
    <>
      {isHacked && <LetterGlitch onExit={handleExitGlitch} />}

      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 transition-opacity duration-500 ${isHacked ? 'opacity-0' : 'opacity-100'}`}>
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.08),transparent_25%),radial-gradient(circle_at_40%_100%,rgba(236,72,153,0.08),transparent_20%)]" />
        <Header data={RESUME_DATA} theme={theme} onToggleTheme={handleThemeToggle} />
        <main className="relative container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 space-y-14">

          <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/60 to-slate-950 p-8 sm:p-12 shadow-2xl">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.2),transparent_30%)]" />
            <div className="relative grid gap-10 lg:grid-cols-5 lg:items-center">
              <div className="lg:col-span-3 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-cyan-100 ring-1 ring-cyan-400/30">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Building thoughtful digital experiences
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow-lg">
                  Full Stack Engineer crafting resilient, human-centered products.
                </h1>
                <p className="max-w-3xl text-lg leading-relaxed text-slate-200/90">{summary}</p>
                <div className="flex flex-wrap gap-4">
                  <a href={RESUME_DATA.contact.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:translate-y-[-1px] hover:shadow-cyan-500/35">
                    <LinkedInIcon />
                    Connect on LinkedIn
                  </a>
                  <a href={`mailto:${RESUME_DATA.contact.linkedinHandle}@gmail.com`} className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60 hover:text-white">
                    <ContributionIcon />
                    Book a conversation
                  </a>
                </div>
              </div>
              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
                {[{ label: 'Years of building', value: '5+', detail: 'Full stack delivery across web, CMS, and cloud.' }, { label: 'Tech mastered', value: '20+', detail: 'Languages, frameworks, and delivery tooling.' }, { label: 'Deployments shipped', value: '50+', detail: 'Customer-facing launches with zero downtime.' }, { label: 'Collaboration score', value: 'A+', detail: 'Trusted partner to design, product, and ops.' }].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-4 shadow-lg shadow-black/40">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{stat.label}</p>
                    <p className="text-3xl font-black text-white">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-300">{stat.detail}</p>
                  </div>
                ))}
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

          <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 px-6 py-8 sm:px-10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-purple-500/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Let’s collaborate</p>
                <h3 className="text-2xl font-bold text-white">Need a partner who ships? I’m ready.</h3>
                <p className="text-slate-300">I combine engineering rigor with product intuition to deliver modern experiences.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={RESUME_DATA.contact.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:ring-cyan-400/50">
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
        <footer className="text-center py-8 text-slate-400 text-sm">
          <p className="font-medium text-slate-300">Built with React & Tailwind CSS · Crafted with care</p>
          <p className="text-slate-500">&copy; {new Date().getFullYear()} Kalyan Nalladimmu. All Rights Reserved.</p>
        </footer>
      </div>

      <Chatbot />

    </>
  );
};

export default App;
