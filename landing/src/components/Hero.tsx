import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, OrbitControls } from '@react-three/drei';
import { Globe } from './Globe';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const globeScroll = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-8 pt-24 scroll-mt-24"
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-35 mix-blend-multiply">
        <div className="relative w-[1000px] h-[1000px] rounded-full bg-gradient-to-tr from-surface-container-high via-surface-variant to-primary-fixed blur-[120px] animate-pulse"></div>
        <div className="absolute w-[760px] h-[760px] border-[0.5px] border-primary/10 rounded-full"></div>
        <div className="absolute w-[560px] h-[560px] border-[0.5px] border-primary/18 rounded-full"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 items-center gap-14 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-10 order-2 lg:order-1"
        >
          <div className="space-y-5">
            <motion.span
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/10 bg-primary/5 text-primary text-[10px] tracking-[0.24em] uppercase font-bold"
            >
              SpeciesMap — Earth intelligence
            </motion.span>

            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-[6.5rem] font-headline font-extrabold tracking-tight leading-[0.88] text-on-surface">
              See where life <br />
              <span className="text-primary/90 italic font-medium">holds, shifts, and fades.</span>
            </h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 1 }}
            className="text-lg md:text-xl text-on-surface-variant max-w-2xl font-body leading-relaxed opacity-90 border-l-2 border-primary/10 pl-6"
          >
            SpeciesMap turns fragmented wildlife records into a navigable view of the living world —
            helping people begin by region, move into species, and eventually understand how biodiversity
            changes across time, season, and ecological pressure.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="flex flex-wrap gap-5 pt-2"
          >
            <a
              href="#registry"
              className="bg-primary text-on-primary px-9 py-4.5 flex items-center gap-3 group transition-all hover:bg-primary-container editorial-shadow"
            >
              <span className="font-bold uppercase tracking-widest text-xs">Enter the map</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#methodology"
              className="bg-surface-container-highest/55 backdrop-blur-sm text-primary px-9 py-4.5 font-bold uppercase tracking-widest text-xs hover:bg-surface-variant transition-colors border border-outline-variant/20"
            >
              See how it works
            </a>
            <a
              href="/overview"
              className="bg-transparent text-on-surface px-2 py-4 text-[11px] font-bold uppercase tracking-[0.22em] hover:text-primary transition-colors"
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
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-1 lg:order-2 flex justify-center items-center h-[600px] lg:h-[700px]"
        >
          <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 6], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.9} color="#ffdbcc" />
            <pointLight position={[-10, -10, -10]} intensity={1.2} color="#914111" />
            <Float speed={0.9} rotationIntensity={0.08} floatIntensity={0.16}>
              <GlobeWrapper scrollProgress={globeScroll} />
            </Float>
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.12} />
            <Environment preset="night" />
          </Canvas>

          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]"></div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.05 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
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

function GlobeWrapper({ scrollProgress }: { scrollProgress: any }) {
  const [val, setVal] = useState(0);

  useFrame(() => {
    setVal(scrollProgress.get());
  });

  return <Globe scrollProgress={val} />;
}
