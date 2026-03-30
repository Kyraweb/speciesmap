<template>
  <div class="map-wrap">
    <div ref="mapContainer" class="map"></div>

    <!-- Hex popup -->
    <div v-if="popup" class="hex-popup" :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
      <div class="popup-score">
        <span class="score-num" :style="{ color: scoreColor(popup.biodiversity_score) }">
          {{ Math.round(popup.biodiversity_score) }}
        </span>
        <span class="score-label">biodiversity score</span>
      </div>
      <div class="popup-stats">
        <span>{{ popup.species_count }} species</span>
        <span>·</span>
        <span>{{ popup.sighting_count?.toLocaleString() }} sightings</span>
      </div>
      <div class="popup-classes">
        <span v-if="popup.mammal_count" class="cls-pill mammal">{{ popup.mammal_count }} mammals</span>
        <span v-if="popup.bird_count" class="cls-pill bird">{{ popup.bird_count }} birds</span>
        <span v-if="popup.reptile_count" class="cls-pill reptile">{{ popup.reptile_count }} reptiles</span>
        <span v-if="popup.amphibian_count" class="cls-pill amphib">{{ popup.amphibian_count }} amphib.</span>
      </div>
      <div class="popup-hint">Click to explore →</div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-title">Biodiversity score</div>
      <div class="legend-scale">
        <div class="legend-bar"></div>
        <div class="legend-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      <div class="legend-classes">
        <span class="cls-dot mammal"></span> Mammals
        <span class="cls-dot bird"></span> Birds
        <span class="cls-dot reptile"></span> Reptiles
        <span class="cls-dot amphib"></span> Amphibians
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
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
let map            = null
let hexData        = []

const CONTINENT_BOUNDS = {
  northamerica: [-172.0, 5.0, -48.0, 86.0],
  southamerica: [-85.0, -58.0, -30.0, 15.0],
  europe:       [-28.0, 32.0, 48.0, 74.0],
  africa:       [-20.0, -37.0, 54.0, 40.0],
  asia:         [24.0, -1.0, 182.0, 80.0],
  australia:    [110.0, -47.0, 157.0, -8.0],
}

const CONTINENT_VIEW = {
  northamerica: { center: [-98.0, 45.0], zoom: 3 },
  southamerica: { center: [-58.0, -20.0], zoom: 3 },
  europe:       { center: [10.0, 54.0],  zoom: 3.5 },
  africa:       { center: [18.0, 2.0],   zoom: 3 },
  asia:         { center: [95.0, 40.0],  zoom: 2.5 },
  australia:    { center: [134.0, -27.0], zoom: 3.5 },
}

// Biodiversity score → colour (parchment → sage → deep forest)
function scoreToColor(score, maxScore) {
  const t = Math.min(score / maxScore, 1)
  if (t < 0.2) return '#e8e4d8'
  if (t < 0.4) return '#d4d8c0'
  if (t < 0.6) return '#a8bc88'
  if (t < 0.75) return '#7a9e58'
  if (t < 0.9) return '#567a38'
  return '#3a5820'
}

function scoreColor(score) {
  if (score < 15) return '#a09080'
  if (score < 25) return '#6a9848'
  if (score < 40) return '#567a38'
  return '#3a5820'
}

// Convert h3 index to GeoJSON polygon using h3-js
async function buildGeoJSON(data) {
  const { cellToBoundary } = await import('https://esm.sh/h3-js@4')
  const maxScore = Math.max(...data.map(d => d.biodiversity_score || d.sighting_count || 1))

  const features = []
  for (const hex of data) {
    try {
      const boundary = cellToBoundary(hex.h3_index, true) // true = GeoJSON order [lng, lat]
      const score    = hex.biodiversity_score || 0
      const color    = scoreToColor(score, maxScore)

      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [boundary]
        },
        properties: {
          h3_index:          hex.h3_index,
          biodiversity_score: score,
          species_count:     hex.species_count || 0,
          sighting_count:    hex.sighting_count || 0,
          threatened_count:  hex.threatened_count || 0,
          mammal_count:      hex.mammal_count || 0,
          bird_count:        hex.bird_count || 0,
          reptile_count:     hex.reptile_count || 0,
          amphibian_count:   hex.amphibian_count || 0,
          color,
        }
      })
    } catch (e) {
      // skip invalid hex
    }
  }

  return { type: 'FeatureCollection', features }
}

async function loadHexData() {
  try {
    const params = {}
    if (props.selectedClass) params.class = props.selectedClass
    hexData = await get('/api/hex/biodiversity', params)
    return hexData
  } catch (e) {
    console.error('Failed to load hex data:', e)
    return []
  }
}

async function renderHexes() {
  if (!map || !map.isStyleLoaded()) return

  const data    = await loadHexData()
  const geojson = await buildGeoJSON(data)

  if (map.getSource('hexes')) {
    map.getSource('hexes').setData(geojson)
    return
  }

  map.addSource('hexes', { type: 'geojson', data: geojson })

  // Fill layer
  map.addLayer({
    id: 'hex-fill',
    type: 'fill',
    source: 'hexes',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': [
        'interpolate', ['linear'], ['zoom'],
        2, 0.7,
        8, 0.85
      ]
    }
  })

  // Border layer
  map.addLayer({
    id: 'hex-border',
    type: 'line',
    source: 'hexes',
    paint: {
      'line-color': '#f0ece0',
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        2, 0.3,
        6, 0.8,
        10, 1.2
      ],
      'line-opacity': 0.5
    }
  })

  // Hover highlight
  map.addLayer({
    id: 'hex-hover',
    type: 'fill',
    source: 'hexes',
    filter: ['==', 'h3_index', ''],
    paint: {
      'fill-color': '#b05828',
      'fill-opacity': 0.25
    }
  })
}

function setupEvents() {
  if (!map) return

  map.on('mousemove', 'hex-fill', (e) => {
    map.getCanvas().style.cursor = 'pointer'
    const p = e.features[0].properties
    map.setFilter('hex-hover', ['==', 'h3_index', p.h3_index])
    popup.value = {
      x: e.point.x + 14,
      y: e.point.y - 10,
      ...p
    }
  })

  map.on('mouseleave', 'hex-fill', () => {
    map.getCanvas().style.cursor = ''
    map.setFilter('hex-hover', ['==', 'h3_index', ''])
    popup.value = null
  })

  map.on('click', 'hex-fill', (e) => {
    const p = e.features[0].properties
    emit('select-hex', p.h3_index)
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
    await renderHexes()
    setupEvents()
  })
})

onUnmounted(() => {
  if (map) map.remove()
})

watch(() => props.selectedClass, async () => {
  if (!map || !map.isStyleLoaded()) return
  const data    = await loadHexData()
  const geojson = await buildGeoJSON(data)
  if (map.getSource('hexes')) {
    map.getSource('hexes').setData(geojson)
  }
})
</script>

<style scoped>
.map-wrap { width: 100%; height: 100%; position: relative; }
.map { width: 100%; height: 100%; }

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
  font-weight: normal;
  line-height: 1;
  text-shadow: 0 0 8px currentColor;
}

.score-label {
  font-size: 10px;
  color: #a09080;
}

.popup-stats {
  font-size: 11px;
  color: #706050;
  margin-bottom: 7px;
  display: flex;
  gap: 4px;
}

.popup-classes {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.cls-pill {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 3px;
}

.cls-pill.mammal  { background: rgba(176,88,40,0.12);  color: #b05828; }
.cls-pill.bird    { background: rgba(72,128,168,0.12); color: #4880a8; }
.cls-pill.reptile { background: rgba(106,152,72,0.12); color: #6a9848; }
.cls-pill.amphib  { background: rgba(136,88,176,0.12); color: #8858b0; }

.popup-hint { font-size: 9px; color: #b0a090; }

/* Legend */
.legend {
  position: absolute;
  bottom: 32px;
  left: 12px;
  background: rgba(240, 236, 224, 0.92);
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

.legend-scale { margin-bottom: 8px; }

.legend-bar {
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(to right, #e8e4d8, #d4d8c0, #a8bc88, #7a9e58, #3a5820);
  margin-bottom: 3px;
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #a09080;
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
}

.cls-dot.mammal  { background: #b05828; }
.cls-dot.bird    { background: #4880a8; }
.cls-dot.reptile { background: #6a9848; }
.cls-dot.amphib  { background: #8858b0; }
</style>
