/**
 * useApi — base fetch helper scoped to current continent.
 * Automatically appends ?continent=North America to all requests.
 */
import { useContinent } from './useContinent'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function useApi() {
  const { continent } = useContinent()

  async function get(path, params = {}) {
    const url = new URL(`${BASE_URL}${path}`, window.location.origin)
    url.searchParams.set('continent', continent)
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined) url.searchParams.set(k, v)
    })
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`API error ${res.status} on ${path}`)
    return res.json()
  }

  return { get, continent }
}
