export interface Experience {
  id: number;
  role: string;
  company: string;
  period: string;
  description: string[];
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface Education {
    degree: string;
    university: string;
    period: string;
    emphasis: string;
}

export interface ResumeData {
  name: string;
  title: string;
  contact: {
    linkedin: string;
    github: string;
    linkedinHandle: string;
    githubHandle: string;
  };
  summary: string;
  skills: SkillCategory[];
  experience: Experience[];
  contributions: string[];
  education: Education[];
}