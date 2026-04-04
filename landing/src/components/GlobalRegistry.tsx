import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';

type Region = {
  id: string;
  name: string;
  sightings: number;
  activeSensors: number;
  threatLevel: 'Stable' | 'Critical' | 'Dynamic' | 'Moderate';
  description: string;
  coordinates: string;
};

type GlobalStats = {
  sightings: number;
  species: number;
  hexes: number;
};

const API = 'https://api.speciesmap.org';

const baseRegions: Region[] = [
  {
    id: 'NA',
    name: 'North America',
    sightings: 6942105,
    activeSensors: 1240,
    threatLevel: 'Stable',
    description:
      'Boreal forests, grasslands, and migration corridors are rendered into a navigable entry point for species observation.',
    coordinates: '45.0° N, 100.0° W',
  },
  {
    id: 'SA',
    name: 'South America',
    sightings: 1100000,
    activeSensors: 3150,
    threatLevel: 'Critical',
    description:
      'From the Amazon basin to mountain transitions, this region reveals where biodiversity intensity and ecological pressure collide.',
    coordinates: '15.0° S, 60.0° W',
  },
  {
    id: 'EU',
    name: 'Europe',
    sightings: 23400000,
    activeSensors: 2840,
    threatLevel: 'Stable',
    description:
      'A compact but information-dense region where long-term records help make change more legible and comparable.',
    coordinates: '50.0° N, 15.0° E',
  },
  {
    id: 'AF',
    name: 'Africa',
    sightings: 991000,
    activeSensors: 1920,
    threatLevel: 'Dynamic',
    description:
      'SpeciesMap begins to feel alive here: migration, habitat contrast, and ecological movement become immediately visible.',
    coordinates: '0.0° N, 20.0° E',
  },
  {
    id: 'AS',
    name: 'Asia',
    sightings: 2100000,
    activeSensors: 4200,
    threatLevel: 'Moderate',
    description:
      'A wide regional surface where elevation, climate, and species richness make layered observation especially important.',
    coordinates: '34.0° N, 100.0° E',
  },
  {
    id: 'OC',
    name: 'Oceania',
    sightings: 5200000,
    activeSensors: 840,
    threatLevel: 'Stable',
    description:
      'A quieter but highly distinctive region that hints at how SpeciesMap will later connect local rarity with broader ecological context.',
    coordinates: '25.0° S, 135.0° E',
  },
];

const continentKeyMap: Record<string, string> = {
  'North America': 'NA',
  'South America': 'SA',
  Europe: 'EU',
  Africa: 'AF',
  Asia: 'AS',
  Oceania: 'OC',
};

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString();
}

function CountUp({ value, duration = 1800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const update = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.floor(easeOutCubic(progress) * value));
      if (progress < 1) animationFrame = requestAnimationFrame(update);
    };

    animationFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function GlobalRegistry() {
  const [regions, setRegions] = useState<Region[]>(baseRegions);
  const [activeRegion, setActiveRegion] = useState<Region>(baseRegions[0]);
  const [stats, setStats] = useState<GlobalStats>({
    sightings: 39_800_000,
    species: 5_000,
    hexes: 50_000,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [globalRes, continentRes] = await Promise.all([
          fetch(`${API}/api/stats/global`),
          fetch(`${API}/api/sightings/continent-summary`),
        ]);

        if (!globalRes.ok || !continentRes.ok) throw new Error('Failed to load live stats');

        const globalData = await globalRes.json();
        const continentData = await continentRes.json();

        if (!isMounted) return;

        setStats({
          sightings: Number(globalData.sightings ?? 39_800_000),
          species: Number(globalData.species ?? 5_000),
          hexes: Number(globalData.hexes ?? 50_000),
        });

        setRegions((prev) => {
          const next = prev.map((region) => {
            const match = Array.isArray(continentData)
              ? continentData.find((row: any) => continentKeyMap[row.continent] === region.id)
              : null;

            return match ? { ...region, sightings: Number(match.total ?? region.sightings) } : region;
          });

          const current = next.find((region) => region.id === activeRegion.id) ?? next[0];
          setActiveRegion(current);
          return next;
        });
      } catch {
        // Keep editorial fallbacks if the API is unavailable.
      }
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const liveSummary = useMemo(
    () => [
      ['Sightings mapped', formatCompact(stats.sightings)],
      ['Species tracked', formatCompact(stats.species)],
      ['Biodiversity hexes', formatCompact(stats.hexes)],
    ],
    [stats]
  );

  return (
    <section id="registry" className="py-32 bg-surface-container-low overflow-hidden scroll-mt-24">
      <div className="max-w-screen-2xl mx-auto px-8 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live regional registry
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl lg:text-6xl font-headline font-bold text-on-surface leading-tight"
              >
                Start with a region. <br />
                <span className="text-primary italic">Let the platform open from there.</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-on-surface-variant font-body text-lg leading-relaxed max-w-lg"
              >
                The registry is the first practical step in SpeciesMap. It helps people enter the platform
                through geography first, before they need to think about species lists, filters, timelines,
                or ecological interpretation.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-outline-variant/20">
              {liveSummary.map(([label, value]) => (
                <div key={label} className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{label}</p>
                  <p className="text-3xl md:text-4xl font-headline font-light text-on-surface">{value}</p>
                </div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-surface border border-outline-variant/20 editorial-shadow rounded-sm space-y-4"
            >
              <div className="flex items-center gap-3 text-secondary">
                <Zap className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Live ingest connected</span>
              </div>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                This front-end can pull global and regional totals from your live API, so the landing page keeps
                reflecting the real state of the platform rather than frozen demo numbers.
              </p>
            </motion.div>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="bg-surface border border-outline-variant/10 rounded-sm overflow-hidden editorial-shadow min-h-[600px] flex flex-col">
              <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-headline font-bold text-on-surface">Regional Atlas</h3>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-widest text-secondary">Live</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    Hover or focus a region to preview the platform's entry view
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/40">Coordinates</p>
                  <p className="text-[10px] font-mono text-secondary">{activeRegion.coordinates}</p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 relative">
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                <div className="border-r border-outline-variant/10 divide-y divide-outline-variant/10 bg-surface/50 backdrop-blur-sm relative z-10">
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onMouseEnter={() => setActiveRegion(region)}
                      onFocus={() => setActiveRegion(region)}
                      className={`w-full p-6 text-left transition-all duration-500 group relative overflow-hidden ${
                        activeRegion.id === region.id ? 'bg-primary/[0.05] opacity-100' : 'opacity-65 hover:opacity-100'
                      }`}
                    >
                      {activeRegion.id === region.id && (
                        <motion.div
                          layoutId="active-indicator"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(145,65,17,0.4)]"
                          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        />
                      )}

                      <div className="flex justify-between items-center mb-3 relative z-10">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/55">
                          {region.id} / region
                        </span>
                        <span className="text-[10px] font-mono text-on-surface-variant/45">
                          {formatCompact(region.sightings)}
                        </span>
                      </div>

                      <div className="space-y-2 relative z-10">
                        <h4 className="text-lg font-headline font-bold text-on-surface">{region.name}</h4>
                        <p className="text-sm text-on-surface-variant/78 leading-relaxed">{region.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-8 lg:p-10 flex flex-col justify-between relative z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeRegion.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Active region</div>
                        <h3 className="text-4xl font-headline font-bold text-on-surface leading-none">
                          {activeRegion.name}
                        </h3>
                        <p className="text-on-surface-variant leading-relaxed text-base">
                          This preview is not meant to be the whole experience. It is the moment where a user
                          understands where they are beginning before the interface later opens into species,
                          patterns, and deeper ecological context.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 border-t border-outline-variant/12 pt-6">
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/45">Sightings</div>
                          <div className="text-3xl font-headline text-on-surface">
                            <CountUp value={activeRegion.sightings} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/45">Active nodes</div>
                          <div className="text-3xl font-headline text-on-surface">
                            <CountUp value={activeRegion.activeSensors} />
                          </div>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/45">Signal profile</div>
                          <div className="inline-flex px-3 py-1.5 bg-primary/6 border border-primary/14 rounded-sm text-xs uppercase tracking-[0.24em] font-bold text-primary">
                            {activeRegion.threatLevel}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  <div className="pt-8 border-t border-outline-variant/12 space-y-4">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/45">
                      What comes next
                    </div>
                    <p className="text-sm text-on-surface-variant/78 leading-relaxed max-w-md">
                      After this regional layer, the journey continues into methodology and then into the planned
                      roadmap: species-first navigation, time-aware biodiversity, and deeper ecological context.
                    </p>
                    <div className="flex flex-wrap gap-4">
                      <a href="#methodology" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary hover:text-primary-container transition-colors">
                        Read the system
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                      <a href="#roadmap" className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-on-surface-variant/60 hover:text-primary transition-colors">
                        See the roadmap
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
