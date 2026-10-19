# kalyanstack.com — Portfolio

Personal portfolio site for **Kalyan Nalladimmu** — Software Engineer (AI) ·
Full-Stack · Forward Deployed Engineer. Served at
[kalyanstack.com](https://kalyanstack.com).

## Theme: Apple.com-inspired

The design follows Apple's visual language:

- **Typography-first** — `-apple-system` / SF Pro stack (Inter fallback), big
  tight headlines, generous whitespace, 980px max content width.
- **Palette** — white `#ffffff`, near-black `#1d1d1f`, secondary gray
  `#6e6e73`, link blue `#0066CC`, section alternation white / `#f5f5f7`,
  one dark `#000` section (Projects) for contrast.
- **Sticky glass nav** — `backdrop-blur`, translucent white, tiny links.
- **Motion** — subtle scroll-reveal via `IntersectionObserver`
  (`src/components/Reveal.tsx`), smooth scrolling, `prefers-reduced-motion`
  respected. No heavy animation libraries.
- **Dependency-light** — React + Vite + Tailwind (CDN). No AI chatbot, no API
  keys, no physics/WebGL effects.

## Project structure

```
index.html            # entry HTML, Tailwind CDN + font config
index.tsx             # React entry point
App.tsx               # section composition
src/
  data.ts             # ← ALL site content lives here
  index.css           # base styles, reveal animation, gradient headline
  components/
    Nav.tsx           # sticky glass nav (+ mobile menu)
    Hero.tsx
    About.tsx
    Experience.tsx
    Skills.tsx
    Projects.tsx      # dark section, links to GitHub repos
    Education.tsx
    Contact.tsx       # contact + footer
    Reveal.tsx        # scroll-reveal wrapper
```

## Updating content

Edit **`src/data.ts`** — profile, experience, skill groups, projects,
education. No other file needs to change for content updates.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

## Production build

```bash
npm run build    # type-checks (tsc) then emits dist/
npm run preview  # serve dist/ locally
```

Deploy the `dist/` directory to any static host.

## Notes

- Tailwind is loaded from the CDN in `index.html`; no Tailwind build step.
- The Inter webfont loads from Google Fonts as the non-Apple fallback.
- This is a rebuild of the previous interactive resume site. The old
  AI-chatbot (`components/Chatbot.tsx`, `api/ai-proxy.ts`, `server/proxy.js`),
  physics text (`components/FallingText.tsx`, `matter-js`), and WebGL cursor
  (`src/lib/ogl.ts`) were intentionally removed.
