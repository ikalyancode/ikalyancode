import { profile } from '../data';
import Reveal from './Reveal';

export default function Hero() {
  return (
    <section id="top" className="bg-white">
      <div className="mx-auto max-w-[980px] px-5 pb-20 pt-32 text-center md:pb-28 md:pt-40">
        <Reveal>
          <p className="text-[15px] font-semibold text-sub md:text-lg">
            {profile.name} · {profile.location}
          </p>
        </Reveal>
        <Reveal delay={100}>
          <h1 className="mx-auto mt-3 max-w-3xl text-[44px] font-bold leading-[1.05] tracking-tight text-ink md:text-[72px]">
            {profile.heroTitleA}
            <br />
            <span className="text-gradient">{profile.heroTitleB}</span>
          </h1>
        </Reveal>
        <Reveal delay={200}>
          <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-sub md:text-[21px]">
            {profile.headline}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-sub md:text-[17px]">
            {profile.heroSub}
          </p>
        </Reveal>
        <Reveal delay={300}>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex h-11 items-center rounded-full bg-ablue px-7 text-[15px] font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.99]"
            >
              Get in touch
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-1 text-[15px] text-ablue hover:underline"
            >
              View GitHub
              <span aria-hidden="true">›</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
