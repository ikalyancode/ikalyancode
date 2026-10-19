import { education } from '../data';
import Reveal from './Reveal';

export default function Education() {
  return (
    <section id="education" className="bg-white">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-24">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-ink md:text-[44px]">
            Education
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-silver p-8 text-center md:p-10">
            <p className="text-[21px] font-semibold tracking-tight text-ink md:text-[24px]">
              {education.degree}
            </p>
            <p className="mt-2 text-[16px] text-sub">{education.school}</p>
            <p className="mt-1 text-[14px] text-sub">
              {education.dates} · {education.detail}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
