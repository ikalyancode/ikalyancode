import { experience } from '../data';
import Reveal from './Reveal';

export default function Experience() {
  return (
    <section id="experience" className="bg-white">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-ink md:text-[44px]">
            Experience
          </h2>
          <p className="mt-3 text-center text-[16px] text-sub md:text-[19px]">
            From requirements to production hardening.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 max-w-3xl">
          {experience.map((job, i) => (
            <Reveal key={job.company} delay={i * 60}>
              <article className="border-t border-black/10 py-10 first:border-t-0 first:pt-0 md:py-12">
                <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
                  <h3 className="text-[21px] font-semibold tracking-tight text-ink md:text-[24px]">
                    {job.company}
                    <span className="font-normal text-sub"> — {job.role}</span>
                  </h3>
                  <p className="shrink-0 text-[14px] text-sub">
                    {job.dates} · {job.location}
                  </p>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {job.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="text-[15px] leading-relaxed text-ink/80 md:text-[16px]"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
