const journeyLinks = [
  { label: 'Start with the map', href: '#registry' },
  { label: 'Read the system', href: '#methodology' },
  { label: 'Follow the roadmap', href: '#roadmap' },
];

const platformLinks = [
  { label: 'Investor overview', href: '/overview' },
  { label: 'Back to top', href: '#hero' },
];

export function Footer() {
  return (
    <footer id="footer" className="bg-surface-container-low border-t border-outline-variant/15 scroll-mt-24">
      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-10 lg:px-12 py-18 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            <a href="#hero" className="block">
              <div className="text-2xl font-bold font-headline text-on-surface tracking-tight">SpeciesMap</div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant/50">
                A living interface for wildlife intelligence
              </div>
            </a>

            <p className="max-w-md text-sm md:text-base leading-relaxed text-on-surface-variant/75">
              Built to help people move from raw sightings to ecological understanding — one region, one
              species, and one pattern at a time.
            </p>

            <div className="pt-2 text-xs uppercase tracking-[0.22em] text-on-surface-variant/55">
              © 2026 SpeciesMap. All rights reserved.
            </div>
          </div>

          <div className="lg:col-span-3 lg:col-start-8 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Journey</div>
            <div className="space-y-3">
              {journeyLinks.map((item) => (
                <a key={item.label} href={item.href} className="block text-sm text-on-surface-variant/72 hover:text-primary transition-colors">
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Platform</div>
            <div className="space-y-3">
              {platformLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block text-sm uppercase tracking-[0.16em] text-on-surface-variant/62 hover:text-primary transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
