import Nav from './src/components/Nav';
import Hero from './src/components/Hero';
import About from './src/components/About';
import Experience from './src/components/Experience';
import Skills from './src/components/Skills';
import Projects from './src/components/Projects';
import Education from './src/components/Education';
import Contact from './src/components/Contact';

export default function App() {
  return (
    <div className="min-h-screen bg-white font-sans text-ink">
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Skills />
        <Projects />
        <Education />
        <Contact />
      </main>
    </div>
  );
}
