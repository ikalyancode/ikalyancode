import type { ResumeData } from './types';

export const RESUME_DATA: ResumeData = {
  name: "Kalyan Nalladimmu",
  title: "Full Stack Software Engineer",
  contact: {
    linkedin: "https://linkedin.com/in/knalladimmu",
    github: "https://github.com/ikalyancode",
    linkedinHandle: "knalladimmu",
    githubHandle: "ikalyancode",
  },
  summary: "Software Engineer with 6+ years of experience in Full Stack development, building scalable and high-performance applications across frontend, backend, and CMS platforms. Proven ability to learn and adapt to new technologies, delivering efficient solutions across diverse tech stacks. Skilled in optimizing databases, integrating APIs, and leveraging cloud-native tools to enhance system performance. Experienced in automation, CI/CD pipelines, and system monitoring, ensuring seamless deployments and reliability. Passionate about problem-solving and innovation, creating impactful digital experiences.",
  skills: [
    { category: "Languages & Frameworks", skills: ["Java", "JavaScript", "Python", ".Net", "Ruby", "Vue.js", "React.js", "Spring Boot", "AEM"] },
    { category: "Databases & APIs", skills: ["SQL", "PostgreSQL", "MongoDB", "GraphQL", "REST APIs", "AEM JCR", "Sling Models"] },
    { category: "Cloud & DevOps", skills: ["AWS", "Adobe Cloud", "Docker", "Jenkins", "GitHub Actions", "CI/CD", "AEM Cloud Service"] },
    { category: "Testing & Automation", skills: ["New Relic", "JMeter", "Selenium", "AEM Mocks", "Slackbot", "Chatbots"] },
    { category: "UI/UX & Tools", skills: ["Figma", "Adobe Suite", "AEM Authoring", "Redux", "JIRA", "Git", "Bitbucket", "AEM Asset Manager"] },
  ],
  experience: [
    {
      id: 1,
      role: "Adobe Asset Manager Engineer",
      company: "3M",
      period: "Mar 2025 - Present",
      description: [
        "Engineered and optimized digital asset workflows within Adobe Experience Manager (AEM) Assets, enhancing content governance and streamlining asset lifecycle management.",
        "Implemented metadata schemas and configured asset processing profiles to improve asset discoverability and automated renditions for multi-channel delivery.",
        "Collaborated with cross-functional teams to integrate AEM Assets with existing enterprise systems, ensuring seamless content flow and operational efficiency.",
        "Monitored asset performance using Adobe Cloud Manager and New Relic, proactively resolving bottlenecks and improving asset availability."
      ]
    },
    {
      id: 2,
      role: "Full Stack Developer",
      company: "Verizon",
      period: "Oct 2022 – Mar 2025",
      description: [
        "Developed backend services using Java (Spring Boot, Sling Models), Python (Flask, Django, FastAPI), .NET for microservices, Chatbots, optimizing content delivery, and application scalability.",
        "Developed React.js, Vue.js components, and AEM editable templates, optimizing UI performance and enhancing authoring flexibility for seamless content updates.",
        "Optimized CSS and JavaScript, GraphQL, and AEM Sling Models for efficient data retrieval, reducing API load time by 30% and improving performance.",
        "Developed intelligent chatbots using Java (Spring Boot) and Python (Flask) to handle automated responses and integrate with third-party APIs.",
        "Integrated JavaScript with AEM components to enable dynamic client-side behavior and personalization features.",
        "Developed and maintained T-SQL stored procedures, views, and functions using SQL Developer.",
        "Designed JWT and OAuth authentication layers for secure API interactions with AEM as a Cloud Service.",
        "Integrated backend services with AWS S3 and Lambda for secure file storage and serverless processing."
      ]
    },
    {
      id: 3,
      role: "AEM Developer",
      company: "Verizon",
      period: "Jul 2021 – Oct 2022",
      description: [
        "Architected AEM as a Cloud Service deployments, leveraging Adobe Cloud Manager and AWS S3 for seamless updates and scalable storage solutions.",
        "Applied principles of component-based architecture from ASP.NET MVC and KendoUI to develop reusable, responsive AEM components using HTL, Java, and JavaScript.",
        "Leveraged experience integrating WCF Services and Entity Framework to build and consume backend APIs in AEM projects.",
        "Led content and asset migration projects, optimizing Adobe DAM for global distribution with cloud-based replication strategies."
      ]
    },
    {
      id: 4,
      role: "Software Engineer Intern",
      company: "Verizon",
      period: "Jan 2020 – May 2021",
      description: [
        "Built small-scale web applications using Java, Python, and HTML/CSS, practicing object-oriented programming and clean code principles.",
        "Assisted in debugging and enhancing existing codebases, gaining hands-on experience with version control using Git and participating in Agile development cycles."
      ]
    }
  ],
  contributions: [
    "Led multiple AEM content releases during high-traffic holiday periods, ensuring seamless deployment and zero downtime.",
    "Built a Python-based Slackbot for automated system alerts and workflow efficiency."
  ],
  education: [
    {
      degree: "Master of Science in Technology",
      university: "Pittsburg State University",
      period: "2019 – 2021",
      emphasis: "Double Emphasis: IT and Web Development"
    }
  ]
};
