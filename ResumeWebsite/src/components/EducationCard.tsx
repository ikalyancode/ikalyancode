import type { Education } from '../types';

interface EducationCardProps {
    education: Education;
}

export const EducationCard: React.FC<EducationCardProps> = ({ education }) => {
    return (
        <div className="bg-slate-100 dark:bg-slate-800 p-5 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{education.degree}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{education.period}</p>
            </div>
            <p className="text-cyan-600 dark:text-cyan-400 font-semibold text-md mb-2">{education.university}</p>
            <p className="text-slate-600 dark:text-slate-300">{education.emphasis}</p>
        </div>
    );
}