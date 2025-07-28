import type { ResumeData } from '../types';
import { GitHubIcon, LinkedInIcon } from './icons';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
    data: ResumeData;
    theme: 'dark' | 'light';
    onToggleTheme: () => void;
}

const ContactLink: React.FC<{ href: string; icon: React.ReactNode; text: string; }> = ({ href, icon, text }) => (
    <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-300"
    >
        {icon}
        <span className="hidden sm:inline">{text}</span>
    </a>
);


export const Header: React.FC<HeaderProps> = ({ data, theme, onToggleTheme }) => {
    const { name, title, contact } = data;
    
    return (
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg sticky top-0 z-50 py-5 border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{name}</h1>
                    <h2 className="text-lg font-medium text-cyan-600 dark:text-cyan-400">{title}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                   <ContactLink href={contact.linkedin} icon={<LinkedInIcon />} text={contact.linkedinHandle} />
                   <ContactLink href={contact.github} icon={<GitHubIcon />} text={contact.githubHandle} />
                   <ThemeToggle theme={theme} onToggle={onToggleTheme} />
                </div>
            </div>
        </header>
    );
};