<template>
  <div class="map-wrap">
    <div ref="mapContainer" class="map"></div>

    <!-- Popup tooltip -->
    <div v-if="popup" class="map-popup" :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
      <div class="popup-name">{{ popup.common_name }}</div>
      <div class="popup-latin">{{ popup.scientific_name }}</div>
      <div class="popup-row">
        <span class="popup-badge" :style="iucnStyle(popup.iucn_status)">
          {{ popup.iucn_status }}
        </span>
        <span class="popup-sightings">· {{ popup.individual_count ?? 1 }} sighting</span>
      </div>
      <div class="popup-hint">Click to explore</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'

const props = defineProps({
  sightings:     { type: Array,  default: () => [] },
  selectedClass: { type: String, default: null },
})

const emit = defineEmits(['select-species'])

const mapContainer = ref(null)
const popup        = ref(null)
let map            = null
let markers        = []

// Class colours — Slate & Sage palette
const CLASS_COLORS = {
  Mammalia:  '#b05828',
  Aves:      '#4880a8',
  Reptilia:  '#6a9848',
  Amphibia:  '#8858b0',
}

const IUCN_STYLES = {
  CR: { background: '#fde8e8', color: '#c02020' },
  EN: { background: '#fdeede', color: '#c05010' },
  VU: { background: '#fdf8dc', color: '#a08010' },
  NT: { background: '#f5f5dc', color: '#806010' },
  LC: { background: '#eaf3de', color: '#3a6818' },
  DD: { background: '#f1efe8', color: '#a09080' },
}

function iucnStyle(code) {
  return IUCN_STYLES[code] ?? IUCN_STYLES['DD']
}

function getColor(cls) {
  return CLASS_COLORS[cls] ?? '#a09080'
}

function createMarkerEl(sighting) {
  const el = document.createElement('div')
  el.className = 'species-marker'
  const color = getColor(sighting.class)
  el.style.cssText = `
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${color};
    border: 1.5px solid ${color}cc;
    cursor: pointer;
    transition: transform 0.15s;
    box-shadow: 0 0 0 3px ${color}22, 0 0 8px ${color}44;
  `
  el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)' })
  el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })
  return el
}

function clearMarkers() {
  markers.forEach(m => m.remove())
  markers = []
}

function plotSightings() {
  if (!map) return
  clearMarkers()

  props.sightings.forEach(s => {
    if (!s.lng || !s.lat) return

    const el = createMarkerEl(s)

    const m = new maptilersdk.Marker({ element: el })
      .setLngLat([s.lng, s.lat])
      .addTo(map)

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      emit('select-species', s)
      popup.value = {
        x: e.clientX - mapContainer.value.getBoundingClientRect().left + 12,
        y: e.clientY - mapContainer.value.getBoundingClientRect().top - 10,
        ...s
      }
      setTimeout(() => { popup.value = null }, 3000)
    })

    markers.push(m)
  })
}

onMounted(() => {
  maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? ''

  map = new maptilersdk.Map({
    container:   mapContainer.value,
    style:       maptilersdk.MapStyle.OUTDOOR,
    center:      [-98, 45],    // Centre of North America
    zoom:        3,
    minZoom:     2,
    maxZoom:     14,
    projection:  'mercator',   // Flat map — not globe
    attributionControl: false,
  })

  map.addControl(new maptilersdk.AttributionControl({ compact: true }), 'bottom-right')
  map.addControl(new maptilersdk.NavigationControl(), 'bottom-right')

  map.on('load', () => {
    plotSightings()
  })

  map.on('click', () => {
    popup.value = null
  })
})

onUnmounted(() => {
  clearMarkers()
  if (map) map.remove()
})

watch(() => props.sightings, plotSightings, { deep: true })
</script>

<style scoped>
.map-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
}

.map-popup {
  position: absolute;
  background: #f8f4e8;
  border: 0.5px solid rgba(176, 88, 40, 0.4);
  border-radius: 4px;
  padding: 10px 12px;
  pointer-events: none;
  z-index: 10;
  min-width: 160px;
  max-width: 220px;
}

.popup-name {
  font-family: Georgia, serif;
  font-size: 13px;
  color: #2a2418;
  margin-bottom: 2px;
  text-shadow: 0 0 8px rgba(176, 88, 40, 0.3);
}

.popup-latin {
  font-size: 10px;
  color: #a09080;
  font-style: italic;
  margin-bottom: 6px;
}

.popup-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.popup-badge {
  font-size: 9px;
  font-weight: 500;
  padding: 2px 5px;
  border-radius: 3px;
}

.popup-sightings {
  font-size: 10px;
  color: #a09080;
}

.popup-hint {
  font-size: 9px;
  color: #b0a090;
}
</style>
