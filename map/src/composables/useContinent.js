/**
 * useContinent — detects which continent subdomain we're on.
 * northamerica.speciesmap.org → { continent: 'North America', slug: 'northamerica' }
 * speciesmap.org (root)       → fallback to North America
 * localhost                   → fallback to North America (dev)
 */
export function useContinent() {
  const host = window.location.hostname
  const sub  = host.split('.')[0]

  const CONTINENTS = {
    northamerica: 'North America',
    southamerica: 'South America',
    europe:       'Europe',
    africa:       'Africa',
    asia:         'Asia',
    oceania:      'Oceania',
  }

  const continent = CONTINENTS[sub] ?? 'North America'
  const slug      = CONTINENTS[sub] ? sub : 'northamerica'

  return { continent, slug }
}

/**
 * Navigate to a continent subdomain
 */
export function navigateToContinent(slug) {
  const host    = window.location.hostname
  const isLocal = host === 'localhost' || host === '127.0.0.1'

  if (isLocal) {
    console.log(`[dev] Would navigate to ${slug}.speciesmap.org`)
    return
  }

  const base   = host.includes('speciesmap.org') ? 'speciesmap.org' : host
  window.location.href = `https://${slug}.${base}`
}
