/**
 * useContinent — detects which continent subdomain we're on
 * and returns the display name and slug.
 *
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
    australia:    'Australia',
  }

  const continent = CONTINENTS[sub] ?? 'North America'
  const slug      = CONTINENTS[sub] ? sub : 'northamerica'

  return { continent, slug }
}
