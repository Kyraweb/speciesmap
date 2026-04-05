import { motion } from 'motion/react';
import {
  ArrowRight,
  Binoculars,
  Database,
  Globe2,
  Layers3,
  Leaf,
  Radar,
  Server,
  Waypoints,
} from 'lucide-react';

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-12% 0px' },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

const overviewSignals = [
  ['Platform state', 'Live foundation'],
  ['Coverage model', 'Regional by design'],
  ['Data posture', 'Global ingest connected'],
];

const whyCards = [
  {
    icon: Globe2,
    label: 'Map-first product',
    title: 'SpeciesMap gives biodiversity a more legible front door.',
    description:
      'The platform starts with geography so people can enter the system through place, then move deeper into species, patterns, and ecological interpretation.',
  },
  {
    icon: Database,
    label: 'Interpretive layer',
    title: 'It turns fragmented records into a navigable product surface.',
    description:
      'Raw sightings alone do not create understanding. SpeciesMap adds product quality, curation, and structure so the data can be explored rather than merely stored.',
  },
  {
    icon: Binoculars,
    label: 'Long-term value',
    title: 'The same foundation can support public, research, and infrastructure futures.',
    description:
      'What begins as a compelling map experience can later deepen into search, temporal biodiversity, richer species pages, and broader environmental intelligence tooling.',
  },
];

const roadmapPhases = [
  {
    phase: 'Phase 01',
    title: 'Strengthen the front door',
    description:
      'Keep improving navigation, filters, and species detail so the product feels effortless for first-time users without losing scientific weight.',
    highlights: ['Species-first navigation', 'Search and filtering', 'Higher interface clarity'],
  },
  {
    phase: 'Phase 02',
    title: 'Make change visible through time',
    description:
      'Introduce temporal comparison and seasonal storytelling so biodiversity is not just mapped statically, but understood as something that shifts.',
    highlights: ['Time-aware layers', 'Seasonal movement', 'Range comparison'],
  },
  {
    phase: 'Phase 03',
    title: 'Deepen ecological context',
    description:
      'Expand from sightings into density, absence, and richer species narratives so the platform becomes more explanatory and more useful.',
    highlights: ['Species pages', 'Context layers', 'Pattern interpretation'],
  },
  {
    phase: 'Phase 04',
    title: 'Scale the platform infrastructure',
    description:
      'Use stronger infrastructure to support faster spatial queries, more regional surfaces, broader taxonomic coverage, and a more durable product foundation.',
    highlights: ['More regions', 'Higher throughput', 'Broader biodiversity coverage'],
  },
];

const infrastructureTags = [
  'Stronger PostGIS infrastructure',
  'Faster spatial queries',
  'More continent rollouts',
  'Higher ETL throughput',
  'Broader taxonomic expansion',
  'Caching and tiling',
];

export function OverviewPage() {
  return (
    <main id="platform" className="relative overflow-hidden pt-28 md:pt-32">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-10rem] top-8 h-[24rem] w-[24rem] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute right-[-12rem] top-[18rem] h-[28rem] w-[28rem] rounded-full bg-secondary/12 blur-[140px]" />
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(255,219,204,0.28),transparent_62%)]" />
      </div>

      <section className="relative py-20 md:py-24 scroll-mt-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr] gap-12 xl:gap-16 items-start">
            <motion.div {...reveal} className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-primary/12 bg-primary/5 text-primary text-[10px] tracking-[0.24em] uppercase font-bold">
                Platform overview
              </div>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[6.6rem] font-headline font-extrabold tracking-tight leading-[0.9] text-on-surface max-w-5xl">
                  A crafted biodiversity interface
                  <br />
                  <span className="text-primary/90 italic font-medium">with room to scale into infrastructure.</span>
                </h1>

                <p className="max-w-3xl text-lg md:text-xl text-on-surface-variant leading-relaxed border-l-2 border-primary/10 pl-6">
                  SpeciesMap already has the shape of a product: regional entry points, live biodiversity data,
                  a map-first interface, and a clear roadmap from navigation into deeper ecological context. The
                  next step is not to discover whether the concept works. It is to support the platform so it can
                  scale with more confidence, speed, and breadth.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <a
                  href="/#registry"
                  className="bg-primary text-on-primary px-8 py-4 flex items-center gap-3 group transition-all hover:bg-primary-container editorial-shadow"
                >
                  <span className="font-bold uppercase tracking-widest text-[11px]">Open the homepage</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#current-state"
                  className="bg-surface-container-highest/55 backdrop-blur-sm text-primary px-8 py-4 font-bold uppercase tracking-widest text-[11px] hover:bg-surface-variant transition-colors border border-outline-variant/20"
                >
                  See the current platform state
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {overviewSignals.map(([label, value]) => (
                  <div key={label} className="border-t border-outline-variant/18 pt-4 space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.24em] font-bold text-on-surface-variant/45">
                      {label}
                    </div>
                    <div className="text-sm text-on-surface/85 leading-relaxed">{value}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="grid gap-5">
              <div className="bg-surface border border-outline-variant/12 editorial-shadow p-8 lg:p-10 space-y-8">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-px bg-primary/25" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.34em] text-primary">
                    Platform snapshot
                  </span>
                </div>

                <div className="space-y-5">
                  <h2 className="text-3xl lg:text-4xl font-headline font-bold text-on-surface leading-tight">
                    Already beyond concept.
                  </h2>
                  <p className="text-base text-on-surface-variant/80 leading-relaxed">
                    The current product already demonstrates how SpeciesMap wants to behave: people enter by
                    region, understand live biodiversity activity, and move toward a richer system that can later
                    support species, time, and ecological context at much greater depth.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      icon: Radar,
                      label: 'Live registry',
                      value: 'Six regional surfaces with real destination URLs.',
                    },
                    {
                      icon: Layers3,
                      label: 'Product direction',
                      value: 'Map navigation, then time-aware biodiversity, then deeper context.',
                    },
                    {
                      icon: Leaf,
                      label: 'Data posture',
                      value: 'Global and regional activity already feeds the platform narrative.',
                    },
                    {
                      icon: Waypoints,
                      label: 'Business reality',
                      value: 'The product works now, and stronger infrastructure expands what it can carry.',
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-surface-container-low border border-outline-variant/12 p-5 space-y-3">
                      <item.icon className="w-4 h-4 text-primary" />
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant/50">
                          {item.label}
                        </div>
                        <p className="text-sm leading-relaxed text-on-surface-variant/78">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-surface-container-low border border-outline-variant/12 editorial-shadow p-6 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">What exists now</div>
                  <div className="space-y-3 text-sm text-on-surface-variant/78 leading-relaxed">
                    <p>FastAPI services powering species, sightings, routes, and biodiversity endpoints.</p>
                    <p>Vue and React surfaces already shaping the wider product ecosystem.</p>
                    <p>PostGIS-backed geospatial infrastructure and a working ETL pipeline.</p>
                  </div>
                </div>

                <div className="bg-surface border border-outline-variant/12 editorial-shadow p-6 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                    What funding unlocks
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {infrastructureTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] border border-outline-variant/18 bg-surface-container-low text-on-surface-variant/70 rounded-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="why-speciesmap"
        className="relative py-24 md:py-28 bg-surface border-y border-outline-variant/10 scroll-mt-24"
      >
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 lg:px-12 space-y-14">
          <motion.div {...reveal} className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-primary/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">
                Why SpeciesMap matters
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-headline font-bold text-on-surface leading-[0.95] tracking-tight">
              Environmental data already exists.
              <br />
              <span className="italic font-medium text-primary/80">The product layer is what is still missing.</span>
            </h2>
            <p className="text-lg text-on-surface-variant/82 leading-relaxed max-w-3xl">
              SpeciesMap matters because it treats biodiversity as something people should be able to navigate,
              not just download. The product opportunity is in clarity, trust, and a more memorable way of seeing
              ecological information at scale.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-outline-variant/20 border border-outline-variant/20 editorial-shadow">
            {whyCards.map((card, index) => (
              <motion.article
                key={card.label}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.08 }}
                className="bg-surface p-8 lg:p-10 space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/5 flex items-center justify-center border border-primary/10">
                    <card.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant/55">
                    {card.label}
                  </div>
                </div>

                <h3 className="text-2xl font-headline font-bold text-on-surface leading-snug">{card.title}</h3>
                <p className="text-sm text-on-surface-variant/78 leading-relaxed">{card.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="current-state" className="relative py-24 md:py-28 scroll-mt-24">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 xl:gap-16 items-start">
            <motion.div {...reveal} className="space-y-7">
              <div className="flex items-center gap-3">
                <span className="w-12 h-px bg-primary/30" />
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">Current platform state</span>
              </div>

              <h2 className="text-5xl md:text-6xl font-headline font-bold text-on-surface leading-[0.95] tracking-tight">
                Built foundation first.
                <br />
                <span className="italic font-medium text-primary/80">Now the platform needs headroom.</span>
              </h2>

              <p className="text-lg text-on-surface-variant/82 leading-relaxed max-w-2xl">
                Today the platform already supports live regional discovery and a clear product narrative. The
                constraint is not whether SpeciesMap can exist. The constraint is the ceiling imposed by current
                infrastructure and the pace that a smaller deployment can sustain.
              </p>

              <div className="bg-surface border border-outline-variant/12 editorial-shadow p-7 space-y-5">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                    Infrastructure reality
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant/78 leading-relaxed">
                  The current deployment proves the product thesis with a lightweight 4 vCPU / 4 GB RAM VPS. It
                  supports development and selective live usage well enough, but it is not the long-term shape of a
                  larger biodiversity platform.
                </p>
              </div>
            </motion.div>

            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="grid gap-5">
              <div className="bg-surface border border-outline-variant/12 editorial-shadow p-8 lg:p-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    ['Current compute', '4 vCPU VPS'],
                    ['Current memory', '4 GB RAM'],
                    ['Coverage posture', 'Multi-region registry live'],
                    ['Expansion path', 'Species, time, context, scale'],
                  ].map(([label, value]) => (
                    <div key={label} className="space-y-2 border-t border-outline-variant/12 pt-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant/45">
                        {label}
                      </div>
                      <div className="text-xl font-headline font-bold text-on-surface">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-surface-container-low border border-outline-variant/12 editorial-shadow p-6 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                    Operational focus now
                  </div>
                  <div className="space-y-3 text-sm text-on-surface-variant/78 leading-relaxed">
                    <p>Keep the live homepage and regional registry polished and trustworthy.</p>
                    <p>Improve entry flows, species discovery, and the clarity of what users are seeing.</p>
                    <p>Prepare the platform for deeper ecological context without losing approachability.</p>
                  </div>
                </div>

                <div className="bg-surface border border-outline-variant/12 editorial-shadow p-6 space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                    Capital accelerates
                  </div>
                  <div className="space-y-3 text-sm text-on-surface-variant/78 leading-relaxed">
                    <p>Higher spatial performance for a more responsive public product.</p>
                    <p>More geographic coverage, stronger ETL throughput, and broader biodiversity depth.</p>
                    <p>Product refinement that moves SpeciesMap from promising foundation to clearer category signal.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="roadmap" className="relative py-24 md:py-28 bg-surface border-y border-outline-variant/10 scroll-mt-24">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 lg:px-12 space-y-14">
          <motion.div {...reveal} className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-px bg-primary/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">
                Roadmap and investor context
              </span>
            </div>
            <h2 className="text-5xl md:text-6xl font-headline font-bold text-on-surface leading-[0.95] tracking-tight">
              A sequence, not a pile of features.
            </h2>
            <p className="text-lg text-on-surface-variant/82 leading-relaxed max-w-3xl">
              The roadmap keeps the product coherent. First make entry and navigation stronger, then reveal time,
              then deepen ecological interpretation, and finally scale the system beneath it so the product can
              carry a broader future.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roadmapPhases.map((phase, index) => (
              <motion.article
                key={phase.phase}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.07 }}
                className="bg-surface-container-low border border-outline-variant/12 editorial-shadow p-7 lg:p-8 space-y-6"
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">{phase.phase}</div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-headline font-bold text-on-surface leading-tight">{phase.title}</h3>
                  <p className="text-sm text-on-surface-variant/78 leading-relaxed">{phase.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phase.highlights.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] border border-outline-variant/18 bg-surface text-on-surface-variant/68 rounded-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          <motion.div
            {...reveal}
            transition={{ ...reveal.transition, delay: 0.12 }}
            className="grid grid-cols-1 lg:grid-cols-[0.92fr_1.08fr] gap-5"
          >
            <div className="bg-surface border border-outline-variant/12 editorial-shadow p-8 space-y-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">Investor context</div>
              <p className="text-2xl font-headline font-medium text-on-surface leading-relaxed">
                SpeciesMap is already a crafted foundation. The opportunity is to help it mature into a faster,
                broader, and more durable biodiversity platform.
              </p>
              <p className="text-sm text-on-surface-variant/76 leading-relaxed">
                The product direction is not speculative. It is visible now in the landing experience, the regional
                system, and the platform roadmap. Capital mainly changes speed, reach, and technical headroom.
              </p>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/12 editorial-shadow p-8 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">
                Continue the conversation
              </div>
              <p className="text-base text-on-surface-variant/80 leading-relaxed">
                If the fit is right, this is the point where better infrastructure and aligned backing can accelerate
                a product that already knows what it wants to become.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:founders@speciesmap.org?subject=SpeciesMap%20Investor%20Inquiry"
                  className="bg-primary text-on-primary px-8 py-4 inline-flex items-center gap-3 group transition-all hover:bg-primary-container editorial-shadow"
                >
                  <span className="font-bold uppercase tracking-widest text-[11px]">Email the founder</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="/#registry"
                  className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary hover:text-primary-container transition-colors"
                >
                  Return to the registry
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
