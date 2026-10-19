import { skillGroups } from '../data';
import Reveal from './Reveal';

export default function Skills() {
  return (
    <section id="skills" className="bg-silver">
      <div className="mx-auto max-w-[980px] px-5 py-20 md:py-28">
        <Reveal>
          <h2 className="text-center text-[32px] font-bold tracking-tight text-ink md:text-[44px]">
            Skills
          </h2>
          <p className="mt-3 text-center text-[16px] text-sub md:text-[19px]">
            The toolkit behind the work.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <Reveal key={group.title} delay={(i % 3) * 80} className="h-full">
              <div className="h-full rounded-2xl bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                <h3 className="text-[17px] font-semibold tracking-tight text-ink">
                  {group.title}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full bg-silver px-3 py-1 text-[13px] text-ink/80"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
