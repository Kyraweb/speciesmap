import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Eye, Globe2, Layers3 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const pipelineStages = [
  {
    id: '01',
    icon: Database,
    label: 'Sources',
    title: 'Observation records are gathered into one working surface',
    description:
      'SpeciesMap starts by bringing fragmented wildlife records together so users are not forced to jump across disconnected sources just to form a basic picture.',
    meta: 'Multi-source intake',
    status: 'Active',
  },
  {
    id: '02',
    icon: Layers3,
    label: 'Cleaning',
    title: 'Noise is reduced before the map ever reaches the user',
    description:
      'Duplicate records, inconsistent naming, and irregular inputs are processed into something people can navigate with more confidence and less friction.',
    meta: 'Structured pipeline',
    status: 'Running',
  },
  {
    id: '03',
    icon: Eye,
    label: 'Interpretation',
    title: 'The result becomes a map people can actually understand',
    description:
      'Instead of leaving users with a raw sightings dump, SpeciesMap turns cleaned records into a spatial view that supports exploration first and deeper reasoning later.',
    meta: 'Map-ready output',
    status: 'Live',
  },
];

export function Methodology() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.pipeline-card', {
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 82%',
        },
        opacity: 0,
        y: 40,
        stagger: 0.18,
        duration: 0.95,
        ease: 'power4.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="methodology" ref={sectionRef} className="py-44 bg-surface border-y border-outline-variant/10 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start mb-24 gap-12">
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-primary/30"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Methodology</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-headline font-bold text-on-surface leading-[0.95] tracking-tight">
              What makes the map <br />
              <span className="italic font-medium text-primary/80">worth trusting</span>
            </h2>
          </div>

          <div className="lg:max-w-lg pt-2 space-y-5">
            <p className="text-on-surface-variant font-body text-lg leading-relaxed opacity-85">
              The journey should feel impressive, but it also has to feel earned. This section explains,
              in simple terms, how SpeciesMap moves from scattered records to a cleaner, more usable view
              of species observation.
            </p>
            <p className="text-sm text-on-surface-variant/72 leading-relaxed">
              It is not about overwhelming users with internal machinery. It is about giving them enough
              confidence to understand that the map is shaped, filtered, and interpreted with intention.
            </p>
          </div>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant/20 border border-outline-variant/20 editorial-shadow">
          {pipelineStages.map((stage) => (
            <div
              key={stage.id}
              className="pipeline-card group bg-surface p-10 lg:p-12 relative overflow-hidden transition-colors duration-500 hover:bg-surface-container-low"
            >
              <div className="flex justify-between items-center mb-14">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/5 flex items-center justify-center border border-primary/10">
                    <stage.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/42">Stage</div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface">{stage.label}</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant/30">0x{stage.id}SM</div>
              </div>

              <div className="space-y-6 relative z-10">
                <h3 className="text-2xl font-headline font-bold text-on-surface group-hover:text-primary transition-colors leading-snug">
                  {stage.title}
                </h3>
                <p className="text-on-surface-variant font-body text-sm leading-relaxed opacity-78">
                  {stage.description}
                </p>
              </div>

              <div className="mt-14 pt-8 border-t border-outline-variant/10 flex justify-between items-end gap-4">
                <div className="space-y-2">
                  <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">Signal</div>
                  <div className="text-lg font-headline font-medium text-primary">{stage.meta}</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-secondary/5 border border-secondary/10">
                  <div className="w-1 h-1 rounded-full bg-secondary animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-secondary">{stage.status}</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 text-8xl font-headline font-black text-outline-variant/5 select-none pointer-events-none group-hover:text-primary/5 transition-colors duration-700">
                {stage.id}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-8 items-center justify-center lg:justify-start">
          {[
            { label: 'Purpose', value: 'Clarity first', icon: Eye },
            { label: 'Output', value: 'Map-ready records', icon: Globe2 },
            { label: 'Direction', value: 'Toward richer context', icon: Layers3 },
          ].map((stat) => (
            <div key={stat.label} className="inline-flex items-center gap-3 px-4 py-3 border border-outline-variant/15 bg-surface-container-low">
              <stat.icon className="w-4 h-4 text-primary" />
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant/50">{stat.label}</span>
                <span className="text-sm text-on-surface font-medium">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          <div className="bg-surface-container-low border border-outline-variant/15 p-8 lg:p-10 editorial-shadow space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-10 h-px bg-primary/25"></span>
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-primary">Why it matters</span>
            </div>
            <p className="text-2xl lg:text-3xl font-headline font-medium text-on-surface leading-relaxed">
              A memorable platform is not just visually strong. It also helps users feel that the
              information has been shaped carefully enough to trust what they are seeing.
            </p>
            <p className="text-sm text-on-surface-variant/76 leading-relaxed max-w-3xl">
              That is the role of the methodology layer in SpeciesMap: not to interrupt the experience,
              but to quietly support it. Once the user understands that, the roadmap can open up without
              feeling like speculation.
            </p>
          </div>

          <div className="bg-surface border border-outline-variant/12 p-8 editorial-shadow space-y-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.34em] text-primary">Transition</div>
            <p className="text-base text-on-surface-variant/80 leading-relaxed">
              The next section shifts from system trust to product direction: what SpeciesMap becomes once
              navigation is stronger, time is visible, and ecological reasoning goes deeper.
            </p>
            <a href="#roadmap" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              Continue to roadmap
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
