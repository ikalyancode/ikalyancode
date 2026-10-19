/* Single source of truth for all site content.
   Update this file to change anything on kalyanstack.com. */

export interface ExperienceItem {
  company: string;
  role: string;
  dates: string;
  location: string;
  bullets: string[];
}

export interface SkillGroup {
  title: string;
  items: string[];
}

export interface Project {
  name: string;
  description: string;
  url: string;
}

export const profile = {
  name: 'Kalyan Nalladimmu',
  location: 'Phoenix, AZ',
  email: 'kalyan.psu@gmail.com',
  phone: '(952) 652-5068',
  linkedin: 'https://linkedin.com/in/knalladimmu',
  linkedinLabel: 'linkedin.com/in/knalladimmu',
  github: 'https://github.com/ikalyancode',
  githubLabel: 'github.com/ikalyancode',
  site: 'https://kalyanstack.com',
  headline: 'Software Engineer (AI) · Full-Stack · Forward Deployed Engineer',
  heroTitleA: 'AI systems,',
  heroTitleB: 'shipped.',
  heroSub:
    '6+ years deploying full-stack and AI systems into production — across regulated banking, state government, and large enterprises.',
  summary:
    '6+ years deploying full-stack and AI systems into production across regulated banking, state government, and large enterprises — including conversational AI agents on Vertex AI and GenAI pipelines on GCP. Owns delivery from requirements through production hardening. Targeting Forward Deployed Engineer roles.',
};

export const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Skills', href: '#skills' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export const experience: ExperienceItem[] = [
  {
    company: 'Wells Fargo',
    role: 'GenAI Engineering',
    dates: 'Mar 2026 – Present',
    location: 'Chandler, AZ',
    bullets: [
      'Deployed conversational AI agents (coding and call agents) on Vertex AI at a regulated bank — owning scoping, tool integrations, and production hardening.',
      'Integrated LLM agents into enterprise systems under strict reliability and compliance requirements.',
    ],
  },
  {
    company: 'State of Minnesota',
    role: 'Full-Stack Developer',
    dates: 'Feb – Mar 2026',
    location: 'Minneapolis, MN (Remote)',
    bullets: [
      'Shipped READ Act features for a statewide literacy initiative within a 2-month contract — React/Chakra UI front ends on .NET/ASP.NET services for a government client.',
      'Triaged and resolved production bugs independently.',
    ],
  },
  {
    company: '3M',
    role: 'Application Engineer',
    dates: 'Jul 2025 – Feb 2026',
    location: 'Maplewood, MN (Remote)',
    bullets: [
      'Deployed LLM-powered intelligence into backend workflows.',
      'Built GenAI pipelines analyzing unstructured data at enterprise scale with fault tolerance.',
      'Delivered cloud-native automation playbooks on GCP.',
    ],
  },
  {
    company: 'Verizon',
    role: 'Software Engineer',
    dates: 'Earlier',
    location: 'Enterprise platforms',
    bullets: [
      'Built enterprise content platforms and CMS-driven experiences.',
      'Owned content migrations end to end; built REST/GraphQL APIs across Java Spring Boot, Python, Node.js, and .NET services with React/Vue/Angular front ends.',
    ],
  },
];

export const skillGroups: SkillGroup[] = [
  {
    title: 'Languages & Frameworks',
    items: [
      'Java (Spring Boot)',
      'Python (Flask, FastAPI)',
      'C# (.NET/ASP.NET)',
      'Go',
      'JavaScript/TypeScript (Node.js, NestJS)',
      'React',
      'Angular',
      'Vue',
      'Chakra UI',
    ],
  },
  {
    title: 'AI & GenAI',
    items: [
      'Google Vertex AI',
      'Generative AI agents',
      'LLM workflow automation',
      'GenAI pipelines',
      'Responsible AI',
    ],
  },
  {
    title: 'Cloud & DevOps',
    items: [
      'GCP',
      'AWS (Lambda, S3, EC2, IAM)',
      'Docker',
      'Kubernetes',
      'Terraform',
      'Jenkins',
      'GitHub Actions',
      'CI/CD',
    ],
  },
  {
    title: 'Data & Integration',
    items: [
      'SQL',
      'PostgreSQL',
      'MongoDB',
      'GraphQL',
      'REST APIs',
      'Event-driven architectures',
      'Systems integration',
      'Data migration',
    ],
  },
  {
    title: 'Tools',
    items: ['Git', 'Jira', 'Figma', 'AEM'],
  },
];

export const projects: Project[] = [
  {
    name: 'passkey-starter',
    description:
      'Passwordless auth with the latest WebAuthn patterns — conditional-mediation autofill, discoverable credentials, and passkey management in Next.js.',
    url: 'https://github.com/ikalyancode/passkey-starter',
  },
  {
    name: 'streamwatch',
    description:
      'Stream-health monitor for live-event streamers — probes RTMP/HLS targets and alerts on bitrate or fps degradation before the audience notices.',
    url: 'https://github.com/ikalyancode/streamwatch',
  },
  {
    name: 'ev-engine-sound',
    description:
      'TeslaSound-style synthesized engine sounds for EVs — a PWA that renders V8, inline-6, and EV-hum audio with the Web Audio API. Zero audio files.',
    url: 'https://github.com/ikalyancode/ev-engine-sound',
  },
];

export const education = {
  degree: 'M.S. in Technology',
  school: 'Pittsburg State University',
  dates: '2019 – 2021',
  detail: 'Double emphasis in IT & Web Development',
};
