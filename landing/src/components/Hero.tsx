import { Canvas } from '@react-three/fiber';
import { Environment, Float, OrbitControls } from '@react-three/drei';
import { Globe } from './Globe';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

function useDesktopHero() {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    return window.matchMedia('(min-width: 1024px)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatch);
      return () => mediaQuery.removeEventListener('change', updateMatch);
    }

    mediaQuery.addListener(updateMatch);
    return () => mediaQuery.removeListener(updateMatch);
  }, []);

  return isDesktop;
}

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDesktop = useDesktopHero();
  const [globeProgress, setGlobeProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const globeScroll = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(globeScroll, 'change', (value) => {
    setGlobeProgress(value);
  });

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 md:px-8 pt-24 scroll-mt-24"
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 mix-blend-multiply">
        <div className="relative h-[34rem] w-[34rem] sm:h-[44rem] sm:w-[44rem] lg:h-[64rem] lg:w-[64rem] rounded-full bg-gradient-to-tr from-surface-container-high via-surface-variant to-primary-fixed blur-[120px] animate-pulse" />
        <div className="absolute h-[22rem] w-[22rem] sm:h-[30rem] sm:w-[30rem] lg:h-[48rem] lg:w-[48rem] border-[0.5px] border-primary/10 rounded-full" />
        <div className="absolute h-[15rem] w-[15rem] sm:h-[22rem] sm:w-[22rem] lg:h-[36rem] lg:w-[36rem] border-[0.5px] border-primary/16 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] items-center gap-10 lg:gap-8 xl:gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 lg:space-y-10 order-2 lg:order-1"
        >
          <div className="space-y-5">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/5 text-primary text-[10px] tracking-[0.24em] uppercase font-bold"
            >
              SpeciesMap / Earth intelligence
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[6rem] xl:text-[6.8rem] font-headline font-extrabold tracking-tight leading-[0.9] text-on-surface">
              See where life
              <br />
              <span className="text-primary/90 italic font-medium">holds, shifts, and fades.</span>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 1 }}
            className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-2xl font-body leading-relaxed opacity-90 border-l-2 border-primary/10 pl-5 sm:pl-6"
          >
            SpeciesMap turns fragmented wildlife records into a navigable view of the living world,
            helping people begin by region, move into species, and eventually understand how biodiversity
            changes across time, season, and ecological pressure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap gap-3 sm:gap-5 pt-2"
          >
            <a
              href="#registry"
              className="bg-primary text-on-primary px-7 sm:px-9 py-4 flex items-center gap-3 group transition-all hover:bg-primary-container editorial-shadow"
            >
              <span className="font-bold uppercase tracking-widest text-[11px] sm:text-xs">Enter the map</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>

            <a
              href="#methodology"
              className="bg-surface-container-highest/55 backdrop-blur-sm text-primary px-7 sm:px-9 py-4 font-bold uppercase tracking-widest text-[11px] sm:text-xs hover:bg-surface-variant transition-colors border border-outline-variant/20"
            >
              See how it works
            </a>

            <a
              href="/overview"
              className="bg-transparent text-on-surface px-1 py-4 text-[11px] font-bold uppercase tracking-[0.22em] hover:text-primary transition-colors"
            >
              Investor overview
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4"
          >
            {[
              ['Start with place', 'Explore the world region by region'],
              ['Then understand trust', 'See how the data is sourced and shaped'],
              ['Then follow the vision', 'Watch the platform deepen over time'],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-outline-variant/18 pt-4 space-y-1">
                <div className="text-[10px] uppercase tracking-[0.24em] font-bold text-on-surface-variant/45">
                  {label}
                </div>
                <div className="text-sm text-on-surface/85 leading-relaxed">{value}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 lg:order-2 hidden lg:flex justify-center items-center h-[700px] xl:h-[780px] pointer-events-auto"
        >
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="h-[28rem] w-[28rem] xl:h-[34rem] xl:w-[34rem] rounded-full bg-primary/7 blur-[110px]" />
          </div>

          <div className="relative flex h-full w-full items-center justify-center translate-x-[2%] xl:translate-x-[4%]">
            <div className="relative h-[520px] w-[520px] xl:h-[620px] xl:w-[620px] rounded-full overflow-hidden">
              <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 5.5], fov: 42 }}>
                <ambientLight intensity={0.78} color="#fff7ee" />
                <hemisphereLight intensity={0.46} color="#fff5e9" groundColor="#dfd0bf" />
                <directionalLight position={[4.5, 2.5, 5]} intensity={1.95} color="#fff1df" />
                <directionalLight position={[-4, -1.75, 3.5]} intensity={0.72} color="#f0dcc9" />
                <pointLight position={[0, -3.5, 4]} intensity={0.32} color="#ffefe1" />

                <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.14}>
                  <group scale={0.9} position={[0, 0, 0]}>
                    <Globe scrollProgress={globeProgress} />
                  </group>
                </Float>

                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.12}
                  enabled={true}
                />

                <Environment preset="sunset" />
              </Canvas>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.05 }}
        className="hidden sm:flex absolute bottom-10 left-1/2 -translate-x-1/2 flex-col items-center gap-3"
      >
        <a href="#registry" className="flex flex-col items-center gap-3 group">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface-variant/42 group-hover:text-primary transition-colors">
            Begin with the global registry
          </span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
            <ChevronDown className="w-5 h-5 text-primary/45" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  );
}