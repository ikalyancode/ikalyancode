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
      role: "Application Engineer",
      company: "3M",
      period: "Mar 2025 - Present",
      description: [
        "Engineered and optimized digital asset workflows within Adobe Experience Manager (AEM) Assets, enhancing content governance and streamlining asset lifecycle management.",
        "Designed and developed backend services and automation workflows for digital asset management systems, integrating with enterprise APIs to streamline content delivery and improve scalability.",
        "Built and deployed AI asset processing pipelines, leveraging machine learning models for automated tagging, classification, and metadata enrichment — reducing manual curation time by 40% and improving search relevance.",
        "Integrated AI tagging and content classification models to automatically categorize digital assets, reducing manual curation time by 60% and improving search accuracy.",
        "Implemented observability solutions with Splunk, CloudWatch, and New Relic to monitor microservice performance and alert on failures."
      ]
    },
    {
      id: 2,
      role: "Full Stack Developer",
      company: "Verizon",
      period: "Oct 2022 – Mar 2025",
      description: [
        "Developed backend services using Java (Spring Boot, Sling Models), Python (Flask, FastAPI), Node.js, .NET for microservices, Chatbots, optimizing content delivery, and application scalability.",
        "Developed React.js, Vue.js, Nest.js, Angular components, and AEM editable templates, optimizing UI performance and enhancing authoring flexibility for seamless content updates.",
        "Optimized CSS and JavaScript, GraphQL, and AEM Sling Models for efficient data retrieval, reducing API load time by 30% and improving performance, leveraging AEM client libraries, caching, and lazy loading to reduce page load time by 15%.",
        "Developed intelligent chatbots using Java (Spring Boot), Python (Flask), and Node.js to handle responses, integrate with third-party APIs, and support internal team workflows with Slack.",
        "Engineered REST and GraphQL APIs using Express.js, Nest.js, and Spring Boot, improving response efficiency by 30%.",
        "Managed cloud-based deployments and resources on AWS, including API Management, Functions, Storage, and App Services.",
        "Implemented authentication and authorization mechanisms using OAuth and JWT to secure APIs and ensure data privacy.",
        "Integrated third-party APIs to extend backend functionality, ensuring seamless data exchange and improving application capabilities.",
        "Led production support for batch and data-processing workflows on Google Cloud Platform (GCP), troubleshooting application-level issues, and ensuring SLA adherence across critical services.",
        "Integrated backend services with Google Cloud Storage and Cloud Functions, enabling secure file handling, serverless processing, and improved scalability in cloud-native deployments.",
        "Designed JWT and OAuth authentication layers for REST and GraphQL to secure API interactions and seamless integration with AEM as a Cloud Service.",
        "Integrated Java and Python backend services with PostgreSQL, MongoDB, and SQL databases, designing efficient data models, optimizing queries, and ensuring secure, scalable API interactions."
      ]
    },
    {
      id: 3,
      role: "AEM Developer",
      company: "Verizon",
      period: "Sept 2019 – Oct 2022",
      description: [
        "Architected and deployed AEM as a Cloud Service using Adobe Cloud Manager, managing cloud-based environments, release pipelines, and CDN-backed content delivery on GCP.",
        "Developed reusable, responsive AEM components using HTL, Java, and JavaScript, applying component-based design principles to support scalable authoring, dynamic rendering, and long-term maintainability.",
        "Developed and managed AEM OSGi services and configurations using Java, leveraging Declarative Services (SCR annotations), service interfaces, and run-mode–specific configs to support scalable, environment-agnostic backend integrations and business logic.",
        "Monitored and tuned backend and supporting services using Google Cloud Monitoring and Splunk, analyzing latency, throughput, and API behavior to maintain performance and reliability."
      ]
    }
  ],
  contributions: [
    "Led multiple AEM content releases during high-traffic holiday periods, ensuring seamless deployment and zero downtime.",
    "Built a Java-based Slackbot for automated system alerts and workflow efficiency."
  ],
  projects: [
    {
      name: "UUID Playground — Trace Anything",
      tagline: "End-to-end, fully functional UUID observability platform.",
      role: "Senior Full-Stack Software Engineer & Technical Architect",
      timeframe: "2024 – Present",
      summary:
        "Designed and delivered a production-style application that demonstrates UUID generation, request correlation, and database persistence across a modern web system. The platform showcases real-world traceability patterns used in distributed systems while remaining clean, approachable, and interview-ready.",
      highlights: [
        "Implemented UUID v4/v7 generation in the backend with request-scoped correlation IDs surfaced to the UI and stored in JSONB metadata.",
        "Built a full request lifecycle visualization that maps API ingress, middleware tracing, persistence, and structured logging.",
        "Delivered a clean, modular architecture with Docker Compose orchestration for frontend, backend, and PostgreSQL."
      ],
      applicationTabs: ["UUID Generator", "UUID Explorer", "Request Trace Viewer"],
      architecture: [
        "React UI issues API requests and renders timeline-driven telemetry.",
        "FastAPI service generates UUIDs, attaches X-Request-ID, and emits JSON logs.",
        "PostgreSQL stores UUIDs as primary keys with indexed request metadata."
      ],
      techStack: ["React (Vite)", "TypeScript", "Tailwind CSS", "Framer Motion", "FastAPI", "PostgreSQL", "Docker"]
    }
  ],
  education: [
    {
      degree: "Master of Science in Technology",
      university: "Pittsburg State University",
      period: "2019 – 2021",
      emphasis: "Admin/Software Developer- IPSO. Double Emphasis: IT and Web Development"
    }
  ]
};
