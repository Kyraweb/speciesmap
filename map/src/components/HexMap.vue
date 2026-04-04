<template>
  <div class="map-wrap">
    <div ref="mapContainer" class="map"></div>

    <div v-if="loading" class="map-loading">
      <div class="loading-text">Computing biodiversity map...</div>
    </div>

    <div v-if="popup" class="hex-popup" :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
      <div class="popup-score">
        <span class="score-num" :style="{ color: scoreColor(popup.biodiversity_score) }">
          {{ Math.round(popup.biodiversity_score || 0) }}
        </span>
        <span class="score-label">biodiversity score</span>
      </div>
      <div class="popup-stats">
        <span>{{ popup.species_count }} species</span>
        <span>·</span>
        <span>{{ Number(popup.sighting_count).toLocaleString() }} sightings</span>
      </div>
      <div class="popup-classes">
        <span v-if="popup.mammal_count > 0" class="cls-pill mammal">{{ popup.mammal_count }} mammals</span>
        <span v-if="popup.bird_count > 0" class="cls-pill bird">{{ popup.bird_count }} birds</span>
        <span v-if="popup.reptile_count > 0" class="cls-pill reptile">{{ popup.reptile_count }} reptiles</span>
        <span v-if="popup.amphibian_count > 0" class="cls-pill amphib">{{ popup.amphibian_count }} amphib.</span>
      </div>
      <div class="popup-hint">Click to explore →</div>
    </div>

    <div class="legend">
      <div class="legend-title">Biodiversity score</div>
      <div class="legend-scale">
        <div class="legend-bar"></div>
        <div class="legend-labels"><span>Low</span><span>High</span></div>
      </div>
      <div class="legend-classes">
        <div><span class="cls-dot mammal"></span> Mammals</div>
        <div><span class="cls-dot bird"></span> Birds</div>
        <div><span class="cls-dot reptile"></span> Reptiles</div>
        <div><span class="cls-dot amphib"></span> Amphibians</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { cellToBoundary } from 'h3-js'
import { useContinent } from '../composables/useContinent'
import { useApi } from '../composables/useApi'

const props = defineProps({
  selectedClass: { type: String, default: null },
})

const emit = defineEmits(['select-hex'])

const { slug } = useContinent()
const { get }  = useApi()

const mapContainer = ref(null)
const popup        = ref(null)
const loading      = ref(true)

let map        = null
let geojsonCache = null  // cached once, never recomputed

const CONTINENT_BOUNDS = {
  northamerica: [-172.0, 5.0, -48.0, 86.0],
  southamerica: [-85.0, -58.0, -30.0, 15.0],
  europe:       [-28.0, 32.0, 48.0, 74.0],
  africa:       [-20.0, -37.0, 54.0, 40.0],
  asia:         [24.0, -1.0, 182.0, 80.0],
  oceania:      [110.0, -55.0, 180.0, -8.0],
}

const CONTINENT_VIEW = {
  northamerica: { center: [-98.0, 45.0], zoom: 3 },
  southamerica: { center: [-58.0, -20.0], zoom: 3 },
  europe:       { center: [10.0, 54.0], zoom: 3.5 },
  africa:       { center: [18.0, 2.0], zoom: 3 },
  asia:         { center: [95.0, 40.0], zoom: 2.5 },
  oceania:      { center: [134.0, -27.0], zoom: 3.5 },
}

function scoreToColor(score, maxScore) {
  const t = Math.min(score / Math.max(maxScore, 1), 1)
  if (t < 0.15) return '#e8e4d8'
  if (t < 0.30) return '#d4d8c0'
  if (t < 0.45) return '#b8c898'
  if (t < 0.60) return '#90b068'
  if (t < 0.75) return '#6a9848'
  if (t < 0.88) return '#4e7830'
  return '#335820'
}

function scoreColor(score) {
  if (!score || score < 15) return '#a09080'
  if (score < 25) return '#6a9848'
  if (score < 40) return '#4e7830'
  return '#335820'
}

// Build GeoJSON ONCE — called on mount only
function buildGeoJSON(data) {
  const maxScore = Math.max(...data.map(d => d.biodiversity_score || 0), 1)
  const features = []

  for (const hex of data) {
    try {
      // cellToBoundary returns [lat, lng] pairs — need to flip to [lng, lat] for GeoJSON
      const boundary = cellToBoundary(hex.h3_index)
      const coords   = boundary.map(([lat, lng]) => [lng, lat])
      coords.push(coords[0]) // close the polygon

      // Skip hexes that cross the antimeridian (lng range > 180°)
      // These create a horizontal stripe across the entire map in MapLibre
      const lngs = coords.map(c => c[0])
      const lngRange = Math.max(...lngs) - Math.min(...lngs)
      if (lngRange > 180) continue

      features.push({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {
          h3_index:           hex.h3_index,
          biodiversity_score: hex.biodiversity_score || 0,
          species_count:      hex.species_count || 0,
          sighting_count:     hex.sighting_count || 0,
          threatened_count:   hex.threatened_count || 0,
          mammal_count:       hex.mammal_count || 0,
          bird_count:         hex.bird_count || 0,
          reptile_count:      hex.reptile_count || 0,
          amphibian_count:    hex.amphibian_count || 0,
          color:              scoreToColor(hex.biodiversity_score || 0, maxScore),
        }
      })
    } catch (e) {
      // skip invalid hex index
    }
  }

  return { type: 'FeatureCollection', features }
}

function addLayers(geojson) {
  map.addSource('hexes', { type: 'geojson', data: geojson })

  map.addLayer({
    id: 'hex-fill',
    type: 'fill',
    source: 'hexes',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.75, 8, 0.88]
    }
  })

  map.addLayer({
    id: 'hex-border',
    type: 'line',
    source: 'hexes',
    paint: {
      'line-color': '#f0ece0',
      'line-width':   ['interpolate', ['linear'], ['zoom'], 2, 0.2, 6, 0.6, 10, 1.0],
      'line-opacity': 0.45
    }
  })

  // Hover layer — only reacts to filter changes, not GeoJSON rebuilds
  map.addLayer({
    id: 'hex-hover',
    type: 'fill',
    source: 'hexes',
    filter: ['==', 'h3_index', ''],
    paint: {
      'fill-color':   '#b05828',
      'fill-opacity': 0.3
    }
  })
}

function setupEvents() {
  let hoverTimeout = null
  let currentHex   = null

  map.on('mousemove', 'hex-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer'
    const p      = e.features[0].properties
    const newHex = p.h3_index

    // Always show popup immediately for responsiveness
    popup.value = { x: e.point.x + 14, y: e.point.y - 10, ...p }

    // Debounce the hover highlight — only fire after cursor pauses 80ms on same hex
    if (newHex === currentHex) return
    currentHex = newHex

    clearTimeout(hoverTimeout)
    hoverTimeout = setTimeout(() => {
      map.setFilter('hex-hover', ['==', 'h3_index', newHex])
    }, 80)
  })

  map.on('mouseleave', 'hex-fill', () => {
    map.getCanvas().style.cursor = ''
    clearTimeout(hoverTimeout)
    currentHex = null
    map.setFilter('hex-hover', ['==', 'h3_index', ''])
    popup.value = null
  })

  map.on('click', 'hex-fill', (e) => {
    emit('select-hex', e.features[0].properties.h3_index)
    popup.value = null
  })

  map.on('click', () => { popup.value = null })
}

onMounted(async () => {
  maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? ''

  const bounds = CONTINENT_BOUNDS[slug] ?? CONTINENT_BOUNDS.northamerica
  const view   = CONTINENT_VIEW[slug]   ?? CONTINENT_VIEW.northamerica

  map = new maptilersdk.Map({
    container:  mapContainer.value,
    style:      maptilersdk.MapStyle.OUTDOOR,
    center:     view.center,
    zoom:       view.zoom,
    minZoom:    2,
    maxZoom:    14,
    maxBounds:  bounds,
    projection: 'mercator',
    attributionControl: false,
  })

  map.addControl(new maptilersdk.AttributionControl({ compact: true }), 'bottom-right')
  map.addControl(new maptilersdk.NavigationControl(), 'bottom-right')

  map.on('load', async () => {
    try {
      // Fetch data and build GeoJSON ONCE
      const data = await get('/api/hex/biodiversity')
      geojsonCache = buildGeoJSON(data)
      addLayers(geojsonCache)
      setupEvents()
    } catch (e) {
      console.error('Failed to load hex data:', e)
    } finally {
      loading.value = false
    }
  })
})

onUnmounted(() => {
  if (map) map.remove()
})

// Class filter — uses MapLibre paint expressions, NO GeoJSON rebuild
watch(() => props.selectedClass, async (cls) => {
  if (!map || !map.isStyleLoaded() || !map.getSource('hexes')) return

  if (!cls) {
    // Show all hexes at full opacity
    map.setPaintProperty('hex-fill', 'fill-opacity',
      ['interpolate', ['linear'], ['zoom'], 2, 0.75, 8, 0.88]
    )
    return
  }

  // Dim hexes that don't have this class, highlight those that do
  const countField = {
    'Mammalia':  'mammal_count',
    'Aves':      'bird_count',
    'Reptilia':  'reptile_count',
    'Amphibia':  'amphibian_count',
  }[cls] || 'species_count'

  map.setPaintProperty('hex-fill', 'fill-opacity', [
    'case',
    ['>', ['get', countField], 0],
    ['interpolate', ['linear'], ['zoom'], 2, 0.85, 8, 0.95],
    0.1
  ])
})
</script>

<style scoped>
.map-wrap { width: 100%; height: 100%; position: relative; }
.map { width: 100%; height: 100%; }

.map-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(240, 236, 224, 0.8);
  z-index: 20;
}

.loading-text {
  font-size: 13px;
  color: #706050;
  background: #f0ece0;
  padding: 10px 18px;
  border-radius: 6px;
  border: 0.5px solid rgba(0,0,0,0.1);
}

.hex-popup {
  position: absolute;
  background: #f8f4e8;
  border: 0.5px solid rgba(176, 88, 40, 0.35);
  border-radius: 6px;
  padding: 10px 13px;
  pointer-events: none;
  z-index: 10;
  min-width: 180px;
  max-width: 240px;
}

.popup-score {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 5px;
}

.score-num {
  font-family: Georgia, serif;
  font-size: 22px;
  line-height: 1;
  text-shadow: 0 0 8px currentColor;
}

.score-label { font-size: 10px; color: #a09080; }

.popup-stats {
  font-size: 11px;
  color: #706050;
  margin-bottom: 7px;
  display: flex;
  gap: 4px;
}

.popup-classes { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 6px; }

.cls-pill { font-size: 9px; padding: 2px 6px; border-radius: 3px; }
.cls-pill.mammal  { background: rgba(176,88,40,0.12);  color: #b05828; }
.cls-pill.bird    { background: rgba(72,128,168,0.12); color: #4880a8; }
.cls-pill.reptile { background: rgba(106,152,72,0.12); color: #6a9848; }
.cls-pill.amphib  { background: rgba(136,88,176,0.12); color: #8858b0; }

.popup-hint { font-size: 9px; color: #b0a090; }

.legend {
  position: absolute;
  bottom: 32px;
  left: 12px;
  background: rgba(240,236,224,0.92);
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  padding: 10px 12px;
  z-index: 5;
  min-width: 140px;
}

.legend-title {
  font-size: 10px;
  font-weight: 500;
  color: #706050;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 7px;
}

.legend-bar {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #e8e4d8, #d4d8c0, #b8c898, #6a9848, #335820);
  margin-bottom: 3px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #a09080;
  margin-bottom: 8px;
}

.legend-classes {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 10px;
  color: #706050;
  border-top: 0.5px solid rgba(0,0,0,0.08);
  padding-top: 7px;
}

.cls-dot {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.cls-dot.mammal  { background: #b05828; }
.cls-dot.bird    { background: #4880a8; }
.cls-dot.reptile { background: #6a9848; }
.cls-dot.amphib  { background: #8858b0; }
</style>
