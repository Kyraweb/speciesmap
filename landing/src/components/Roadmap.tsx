import { useRef } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { Clock3, Expand, Microscope, PanelLeftOpen } from 'lucide-react';

const phases = [
  {
    id: '01',
    icon: PanelLeftOpen,
    status: 'Current',
    title: 'Species-first navigation',
    description:
      'The immediate priority is a clearer front door: class-based browsing, search and filter controls, IUCN indicators, sighting counts, and a slide-in species detail experience that helps general users move through the map with confidence.',
    highlights: ['Species sidebar', 'Search + filters', 'Common-name clarity'],
    isCurrent: true,
  },
  {
    id: '02',
    icon: Clock3,
    status: 'Planned',
    title: 'Time-aware biodiversity',
    description:
      'SpeciesMap will move beyond static presence by introducing temporal range comparison and seasonal animation, allowing users to see how biodiversity shifts across years and pulses through the calendar.',
    highlights: ['Range shift slider', 'Seasonal pulse', 'Time comparison'],
    isCurrent: false,
  },
  {
    id: '03',
    icon: Microscope,
    status: 'Planned',
    title: 'Deeper ecological context',
    description:
      'From full species pages to density layers and absence mapping, the platform will become much more explanatory, showing not just where a species appears, but how concentrated it is and where expected presence no longer aligns with real observation.',
    highlights: ['Species detail page', 'Heatmap toggle', 'Absence mapping'],
    isCurrent: false,
  },
  {
    id: '04',
    icon: Expand,
    status: 'Expansion',
    title: 'Platform scale and access',
    description:
      'Documentation, mobile optimization, and incremental bird-data expansion extend SpeciesMap from a strong desktop experience into a broader scientific platform with more reach, more usability, and more long-term value.',
    highlights: ['Docs site', 'Mobile layout', 'Aves sync'],
    isCurrent: false,
  },
];

export function Roadmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 60%', 'end 60%'],
  });

  const scaleY = useSpring(scrollYProgress, {
    damping: 30,
    stiffness: 100,
    restDelta: 0.001,
  });

  return (
    <section id="roadmap" ref={containerRef} className="py-44 bg-surface overflow-hidden scroll-mt-24">
      <div className="max-w-screen-xl mx-auto px-8">
        <div className="mb-28 space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <span className="w-12 h-px bg-primary/30" />
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Product evolution</span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-headline font-bold text-on-surface leading-[0.95] tracking-tight">
            Where the journey <br />
            <span className="italic font-medium text-primary/80">goes next</span>
          </h2>

          <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-2xl opacity-85">
            Work began in 2026. The roadmap is not a pile of features; it is a sequence. First make
            SpeciesMap easier to navigate, then make change visible through time, then deepen ecological
            understanding, and finally expand the platform&apos;s reach.
          </p>
        </div>

        <div className="relative">
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-outline-variant/10 -translate-x-1/2 hidden md:block" />
          <motion.div
            style={{ scaleY }}
            className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-primary to-primary/20 origin-top -translate-x-1/2 hidden md:block z-0"
          />

          <div className="space-y-32 relative">
            {phases.map((phase, index) => (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0.35, y: 36, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: false, margin: '-25% 0px -25% 0px' }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                className={`flex flex-col md:flex-row items-start md:items-center gap-10 md:gap-24 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className={`flex-1 space-y-7 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <div className={`flex items-center gap-4 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                    <span className={`text-[11px] font-bold uppercase tracking-[0.38em] ${phase.isCurrent ? 'text-primary' : 'text-on-surface-variant/45'}`}>
                      Phase {phase.id} / {phase.status}
                    </span>
                  </div>

                  <h3 className="text-4xl lg:text-5xl font-headline font-bold tracking-tight text-on-surface leading-tight">
                    {phase.title}
                  </h3>

                  <p className={`text-lg lg:text-xl font-body leading-relaxed max-w-xl text-on-surface-variant/80 ${index % 2 === 0 ? 'md:ml-auto' : 'md:mr-auto'}`}>
                    {phase.description}
                  </p>

                  <div className={`flex flex-wrap gap-3 ${index % 2 === 0 ? 'md:justify-end' : 'md:justify-start'}`}>
                    {phase.highlights.map((item) => (
                      <span
                        key={item}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] border rounded-sm ${
                          phase.isCurrent
                            ? 'border-primary/20 bg-primary/6 text-primary'
                            : 'border-outline-variant/18 bg-surface-container-low text-on-surface-variant/60'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-center self-center">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
                      phase.isCurrent
                        ? 'bg-primary border-primary shadow-[0_0_36px_rgba(145,65,17,0.28)] scale-110'
                        : 'bg-surface border-outline-variant/20'
                    }`}
                  >
                    <phase.icon className={`w-7 h-7 ${phase.isCurrent ? 'text-on-primary' : 'text-on-surface-variant/35'}`} />
                  </div>

                  {phase.isCurrent && (
                    <motion.div
                      animate={{ scale: [1, 1.45, 1], opacity: [0.18, 0, 0.18] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full bg-primary/25 -z-10"
                    />
                  )}
                </div>

                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-28 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div className="bg-surface-container-low border border-outline-variant/15 p-8 editorial-shadow space-y-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Timeline</div>
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-2">Foundation</p>
                <p className="text-sm font-headline font-bold text-on-surface">2026</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-2">Current trajectory</p>
                <p className="text-sm font-headline font-bold text-on-surface">Navigation to time to context</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mb-2">Expansion path</p>
                <p className="text-sm font-headline font-bold text-on-surface">Docs, mobile, bird scale</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant/12 p-8 lg:p-10 editorial-shadow space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-primary/25" />
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">The bigger picture</span>
            </div>

            <p className="text-2xl lg:text-3xl font-headline font-medium text-on-surface leading-relaxed">
              SpeciesMap is being shaped as a product that first helps people find their way, then helps
              them see change, and eventually helps them reason about ecological presence, absence, and
              movement at a much deeper level.
            </p>

            <p className="text-sm text-on-surface-variant/75 leading-relaxed max-w-3xl">
              That sequence matters. It keeps the platform approachable for general users while steadily
              increasing scientific value. The roadmap is not there to impress with volume; it is there to
              show that every layer builds toward a more useful and more memorable understanding of life on
              Earth.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
