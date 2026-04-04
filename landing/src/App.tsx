import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GlobalRegistry } from './components/GlobalRegistry';
import { Methodology } from './components/Methodology';
import { Roadmap } from './components/Roadmap';
import { Footer } from './components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  useEffect(() => {
    // Smooth scroll behavior or other global animations can be added here
    const ctx = gsap.context(() => {
      // Example: Fade in sections on scroll
      gsap.utils.toArray('section').forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 50,
          duration: 1,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
      <Navbar />
      <main>
        <Hero />
        <GlobalRegistry />
        <Methodology />
        <Roadmap />
      </main>
      <Footer />
    </div>
  );
}
