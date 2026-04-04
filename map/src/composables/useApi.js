import { useContinent } from './useContinent'

const API_BASE = import.meta.env.VITE_API_URL ?? 'https://api.speciesmap.org'

export function useApi() {
  const { continent } = useContinent()

  async function get(path, params = {}) {
    // Always inject continent unless explicitly overridden
    const finalParams = { continent, ...params }

    const url = new URL(API_BASE + path)
    Object.entries(finalParams).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.set(k, v)
    })

    const resp = await fetch(url.toString())
    if (!resp.ok) throw new Error(`API error ${resp.status}: ${path}`)
    return resp.json()
  }

  return { get, continent }
}
