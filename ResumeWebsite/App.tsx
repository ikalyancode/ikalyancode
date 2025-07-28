import React, { useState, useEffect } from 'react';
import { RESUME_DATA } from './constants';
import { Header } from './components/Header';
import { Section } from './components/Section';
import { SkillPill } from './components/SkillPill';
import { ExperienceCard } from './components/ExperienceCard';
import { EducationCard } from './components/EducationCard';
import { ContributionIcon, EducationIcon, ExperienceIcon, SkillsIcon, SummaryIcon } from './components/icons';
import LetterGlitch from './components/LetterGlitch';
// import SplashCursor from './components/SplashCursor';
import FallingText from './components/FallingText';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const { summary, skills, experience, contributions, education } = RESUME_DATA;

  const [theme, setTheme] = useState<Theme>('dark');
  const [clickCount, setClickCount] = useState(0);
  const [isHacked, setIsHacked] = useState(false);
  const [isCursorUpgraded, setIsCursorUpgraded] = useState(false);
  
  const [skillsState, setSkillsState] = useState<'idle' | 'falling' | 'fallen'>('idle');
  const [skillsKey, setSkillsKey] = useState(0);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.className = 'font-sans antialiased bg-slate-900 text-slate-300';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.className = 'font-sans antialiased bg-slate-50 text-slate-700';
    }
  }, [theme]);

  useEffect(() => {
    if (skillsState === 'idle') {
      const timerId = setTimeout(() => {
        setSkillsState('falling');
      }, 5000);
      return () => clearTimeout(timerId);
    }
  }, [skillsState]);

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

  const handleSkillsReset = () => {
    setSkillsKey(k => k + 1);
    setSkillsState('idle');
  }

  const categoriesWithNBSP = skills.map(s => s.category.replace(/ /g, '\u00a0'));
  const skillsText = skills.map((cat, i) => `${categoriesWithNBSP[i]} ${cat.skills.join(' ')}`).join(' ');

  return (
    <>
      {isHacked && <LetterGlitch onExit={handleExitGlitch} />}
      {/* {isCursorUpgraded && <SplashCursor />} */}
      
      <div className={`min-h-screen transition-opacity duration-500 ${isHacked ? 'opacity-0' : 'opacity-100'}`}>
        <Header data={RESUME_DATA} theme={theme} onToggleTheme={handleThemeToggle} />
        <main className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          
          <Section title="Professional Summary" icon={<SummaryIcon />}>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{summary}</p>
          </Section>

          <Section title="Technical Skills" icon={<SkillsIcon />}>
            <div className="relative min-h-[280px]">
              {skillsState === 'idle' && (
                <div className="space-y-6">
                  {skills.map((skillCategory) => (
                    <div key={skillCategory.category}>
                      <h3 className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-3">{skillCategory.category}</h3>
                      <div className="flex flex-wrap gap-2">
                        {skillCategory.skills.map((skill) => (
                          <SkillPill key={skill} name={skill} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {(skillsState === 'falling' || skillsState === 'fallen') && (
                  <FallingText
                    key={skillsKey}
                    text={skillsText}
                    highlightWords={categoriesWithNBSP}
                    onFallen={() => setSkillsState('fallen')}
                  />
              )}
              {skillsState === 'fallen' && (
                <div className="absolute inset-0 flex items-center justify-center bg-transparent">
                    <button
                      onClick={handleSkillsReset}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
                    >
                      Reset Skills
                    </button>
                </div>
              )}
            </div>
          </Section>
          
          <Section title="Work Experience" icon={<ExperienceIcon />}>
            <div className="relative border-l-2 border-slate-300 dark:border-slate-700 ml-4 pl-8 space-y-12 py-4">
               {experience.map((job, index) => (
                  <ExperienceCard key={job.id} job={job} isFirst={index === 0}/>
               ))}
            </div>
          </Section>

          <Section title="Key Contributions" icon={<ContributionIcon />}>
            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
              {contributions.map((contribution, index) => (
                <li key={index}>{contribution}</li>
              ))}
            </ul>
          </Section>

          <Section title="Education" icon={<EducationIcon />}>
              {education.map((edu, index) => (
                  <EducationCard key={index} education={edu} />
              ))}
          </Section>

        </main>
        <footer className="text-center py-6 text-slate-500 text-sm">
          <p>Built with React & Tailwind CSS. Inspired by modern web design trends.</p>
          <p>&copy; {new Date().getFullYear()} Kalyan Nalladimmu. All Rights Reserved.</p>
        </footer>
      </div>

      {/* {!isHacked && (
        <button
          onClick={() => setIsCursorUpgraded(prev => !prev)}
          className="fixed bottom-5 right-5 z-40 bg-cyan-500/80 dark:bg-cyan-400/80 text-white dark:text-slate-900 font-bold py-2 px-4 rounded-full shadow-lg backdrop-blur-sm hover:scale-105 transform transition-all duration-300 ease-in-out"
          aria-label="Toggle interactive cursor"
        >
          {isCursorUpgraded ? 'Downgrade Cursor 😭' : 'Upgrade Cursor ✨'}
        </button>
      )} */}
    </>
  );
};

export default App;