import { profile } from '../data';
import Reveal from './Reveal';

export default function Contact() {
  const year = new Date().getFullYear();

  return (
    <>
      <section id="contact" className="bg-silver">
        <div className="mx-auto max-w-[980px] px-5 py-20 text-center md:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-[36px] font-bold leading-tight tracking-tight text-ink md:text-[56px]">
              Let&apos;s build
              <br />
              what&apos;s next.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] text-sub md:text-[19px]">
              Open to Forward Deployed Engineer roles — full-time or contract,
              remote-friendly.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex h-11 items-center rounded-full bg-ablue px-7 text-[15px] font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.99]"
              >
                {profile.email}
              </a>
              <a
                href={`tel:${profile.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex h-11 items-center text-[15px] text-ablue hover:underline"
              >
                {profile.phone}
              </a>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-[14px]">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sub transition-colors hover:text-ink"
              >
                LinkedIn
              </a>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sub transition-colors hover:text-ink"
              >
                GitHub
              </a>
              <a
                href={profile.site}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sub transition-colors hover:text-ink"
              >
                kalyanstack.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="bg-silver">
        <div className="mx-auto max-w-[980px] border-t border-black/10 px-5 py-6">
          <p className="text-center text-[12px] text-sub">
            © {year} {profile.name} · {profile.location}
          </p>
        </div>
      </footer>
    </>
  );
}
