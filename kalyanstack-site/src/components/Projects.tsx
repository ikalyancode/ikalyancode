import { projects, profile } from '../data';
import Reveal from './Reveal';

export default function Projects() {
  return (
    <section id="projects" className="bg-black">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-white md:text-[44px]">
            Projects
          </h2>
          <p className="mt-3 text-center text-[16px] text-white/60 md:text-[19px]">
            Built to solve real problems.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {projects.map((project, i) => (
            <Reveal key={project.name} delay={i * 80} className="h-full">
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col rounded-2xl bg-[#1d1d1f] p-7 transition-transform hover:scale-[1.02]"
              >
                <h3 className="font-mono text-[17px] font-semibold text-white">
                  {project.name}
                </h3>
                <p className="mt-3 flex-1 text-[14px] leading-relaxed text-white/60">
                  {project.description}
                </p>
                <span className="mt-6 text-[14px] text-[#2997ff]">
                  View on GitHub <span aria-hidden="true">›</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-10 text-center">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[15px] text-[#2997ff] hover:underline"
            >
              See everything on GitHub <span aria-hidden="true">›</span>
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
