import { Menu } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useEffect, useState } from 'react';
import { motion, useScroll } from 'motion/react';

const navItems = [
  { label: 'Registry', href: '#registry' },
  { label: 'Methodology', href: '#methodology' },
  { label: 'Roadmap', href: '#roadmap' },
  { label: 'Overview', href: '/overview' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 36);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        isScrolled
          ? 'bg-background/86 backdrop-blur-xl py-3 border-b border-outline-variant/10 editorial-shadow'
          : 'bg-transparent py-6'
      )}
    >
      <nav className="flex justify-between items-center px-6 md:px-10 lg:px-12 w-full max-w-screen-2xl mx-auto gap-6">
        <div className="flex items-center gap-8 lg:gap-12 min-w-0">
          <a href="#hero" className="min-w-0 block">
            <div className="text-2xl font-bold font-headline text-on-surface tracking-tighter leading-none">
              SpeciesMap
            </div>
            <div className="hidden sm:block mt-1 text-[9px] font-bold uppercase tracking-[0.28em] text-on-surface-variant/45">
              Living wildlife intelligence
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-x-8 xl:gap-x-10">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface/45 transition-colors duration-300 hover:text-primary"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 lg:gap-8 shrink-0">
          <div className="hidden md:block text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant/55">
            Early platform preview
          </div>

          <a
            href="#registry"
            className="bg-primary text-on-primary px-5 md:px-7 lg:px-8 py-3 text-[10px] font-bold uppercase tracking-[0.28em] hover:bg-primary-container transition-all editorial-shadow"
          >
            Enter SpeciesMap
          </a>

          <button className="lg:hidden text-on-surface" aria-label="Open navigation menu">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <motion.div
        className="absolute bottom-0 left-0 h-[1px] bg-primary/25 origin-left w-full"
        style={{ scaleX: scrollYProgress }}
      />
    </header>
  );
}
