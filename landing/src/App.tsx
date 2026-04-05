import { useEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GlobalRegistry } from './components/GlobalRegistry';
import { Methodology } from './components/Methodology';
import { Roadmap } from './components/Roadmap';
import { Footer } from './components/Footer';
import { OverviewPage } from './components/OverviewPage';

gsap.registerPlugin(ScrollTrigger);

type PageKind = 'home' | 'overview';

type PageMeta = {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
};

const pageMeta: Record<PageKind, PageMeta> = {
  home: {
    title: 'SpeciesMap | Biodiversity Mapping, Wildlife Sightings, and Species Intelligence',
    description:
      'SpeciesMap is a living platform for biodiversity mapping, wildlife sightings, species intelligence, and conservation discovery across continents.',
    canonical: 'https://speciesmap.org/',
    ogUrl: 'https://speciesmap.org/',
  },
  overview: {
    title: 'SpeciesMap Overview | Platform Vision, Current State, and Roadmap',
    description:
      'Explore the SpeciesMap platform overview, including why the product matters, the current platform state, and the roadmap to biodiversity intelligence at scale.',
    canonical: 'https://speciesmap.org/overview',
    ogUrl: 'https://speciesmap.org/overview',
  },
};

function getPageKind(pathname: string): PageKind {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  return normalizedPath === '/overview' || normalizedPath === '/overview.html' ? 'overview' : 'home';
}

function setMetaTag(attribute: 'name' | 'property', value: string, content: string) {
  const element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${value}"]`);
  if (element) {
    element.setAttribute('content', content);
  }
}

function setCanonical(href: string) {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (element) {
    element.setAttribute('href', href);
  }
}

function LandingPage() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('section').forEach((section) => {
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
    <>
      <Navbar page="home" />
      <main>
        <Hero />
        <GlobalRegistry />
        <Methodology />
        <Roadmap />
      </main>
      <Footer page="home" />
    </>
  );
}

export default function App() {
  const [page, setPage] = useState<PageKind>(() => getPageKind(window.location.pathname));

  useEffect(() => {
    if (window.location.pathname.replace(/\/+$/, '') === '/overview.html') {
      window.history.replaceState({}, '', '/overview');
      setPage('overview');
    }

    const syncPage = () => setPage(getPageKind(window.location.pathname));
    window.addEventListener('popstate', syncPage);
    return () => window.removeEventListener('popstate', syncPage);
  }, []);

  const meta = useMemo(() => pageMeta[page], [page]);

  useEffect(() => {
    document.title = meta.title;
    setMetaTag('name', 'description', meta.description);
    setMetaTag('property', 'og:title', meta.title);
    setMetaTag('property', 'og:description', meta.description);
    setMetaTag('property', 'og:url', meta.ogUrl);
    setMetaTag('name', 'twitter:title', meta.title);
    setMetaTag('name', 'twitter:description', meta.description);
    setCanonical(meta.canonical);
  }, [meta]);

  return (
    <div className="min-h-screen selection:bg-primary-fixed selection:text-on-primary-fixed">
      {page === 'overview' ? (
        <>
          <Navbar page="overview" />
          <OverviewPage />
          <Footer page="overview" />
        </>
      ) : (
        <LandingPage />
      )}
    </div>
  );
}
