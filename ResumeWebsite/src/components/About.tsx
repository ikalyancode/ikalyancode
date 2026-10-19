import { profile } from '../data';
import Reveal from './Reveal';

export default function About() {
  return (
    <section id="about" className="bg-silver">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-ink md:text-[44px]">
            About
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="mx-auto mt-6 max-w-2xl text-center text-[16px] leading-relaxed text-sub md:text-[19px]">
            {profile.summary}
          </p>
        </Reveal>
        <Reveal delay={200}>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-2xl bg-black/10 sm:grid-cols-3">
            {[
              { value: '6+', label: 'Years in production engineering' },
              { value: '4', label: 'Industries shipped in' },
              { value: 'AI', label: 'Agents on Vertex AI & GCP' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white px-6 py-8 text-center">
                <p className="text-[28px] font-bold tracking-tight text-ink md:text-[34px]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[13px] text-sub">{stat.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
