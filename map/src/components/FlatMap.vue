<template>
  <div class="map-wrap">
    <div ref="mapContainer" class="map"></div>

    <div v-if="loading" class="map-loading">
      <div class="loading-pill">Loading sightings...</div>
    </div>

    <div v-if="popup" class="map-popup" :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
      <div class="popup-name">{{ popup.display_name }}</div>
      <div class="popup-latin" v-if="popup.common_name">{{ popup.scientific_name }}</div>
      <div class="popup-row">
        <span v-if="popup.iucn_status" class="popup-badge" :style="iucnStyle(popup.iucn_status)">{{ popup.iucn_status }}</span>
        <span class="popup-class">{{ popup.class }}</span>
      </div>
      <div class="popup-hint">Click for details →</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { useContinent } from '../composables/useContinent'

const props = defineProps({
  sightings: { type: Array,   default: () => [] },
  loading:   { type: Boolean, default: false },
})

const emit = defineEmits(['select-species'])

const { slug } = useContinent()
const mapContainer = ref(null)
const popup        = ref(null)
let map = null

const CLASSES = [
  { key: 'Mammalia', color: '#b05828', outline: '#8a3810' },
  { key: 'Reptilia', color: '#6a9848', outline: '#4a7028' },
  { key: 'Amphibia', color: '#8858b0', outline: '#683890' },
]

const CONTINENT_BOUNDS = {
  northamerica: [-172.0,   5.0,  -48.0,  86.0],
  southamerica: [ -85.0, -58.0,  -30.0,  15.0],
  europe:       [ -28.0,  32.0,   48.0,  74.0],
  africa:       [ -20.0, -37.0,   54.0,  40.0],
  asia:         [  24.0,  -1.0,  182.0,  80.0],
  oceania:      [ 110.0, -55.0,  180.0,  -8.0],
}

const CONTINENT_VIEW = {
  northamerica: { center: [-98.0,  45.0], zoom: 3   },
  southamerica: { center: [-58.0, -20.0], zoom: 3   },
  europe:       { center: [ 10.0,  54.0], zoom: 3.5 },
  africa:       { center: [ 18.0,   2.0], zoom: 3   },
  asia:         { center: [ 95.0,  40.0], zoom: 2.5 },
  oceania:      { center: [134.0, -27.0], zoom: 3.5 },
}

const IUCN_STYLES = {
  CR: { background: '#fde8e8', color: '#c02020' },
  EN: { background: '#fdeede', color: '#c05010' },
  VU: { background: '#fdf8dc', color: '#a08010' },
  NT: { background: '#f5f5dc', color: '#806010' },
  LC: { background: '#eaf3de', color: '#3a6818' },
}

function iucnStyle(code) {
  return IUCN_STYLES[code] ?? { background: '#f1efe8', color: '#a09080' }
}

function buildGeoJSON(sightings, classKey) {
  return {
    type: 'FeatureCollection',
    features: sightings
      .filter(s => s.class === classKey)
      .map(s => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: {
          id:              s.id,
          species_id:      s.species_id,
          display_name:    s.display_name || s.scientific_name,
          common_name:     s.common_name,
          scientific_name: s.scientific_name,
          class:           s.class,
          iucn_status:     s.iucn_status,
          country:         s.country,
        }
      }))
  }
}

function addClassLayers(cls) {
  const sourceId    = `sightings-${cls.key}`
  const clusterId   = `clusters-${cls.key}`
  const countId     = `cluster-count-${cls.key}`
  const pointId     = `points-${cls.key}`

  if (map.getSource(sourceId)) return

  map.addSource(sourceId, {
    type:          'geojson',
    data:          buildGeoJSON(props.sightings, cls.key),
    cluster:       true,
    clusterMaxZoom: 9,
    clusterRadius:  50,
  })

  // Cluster circles
  map.addLayer({
    id: clusterId,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': cls.color,
      'circle-radius': [
        'step', ['get', 'point_count'],
        12,       //  < 10
        10,  18,  //  10 - 50
        50,  26,  //  50 - 200
        200, 34,  // 200 - 500
        500, 44,  // 500+
      ],
      'circle-opacity':       0.82,
      'circle-stroke-width':  1.5,
      'circle-stroke-color':  cls.outline,
      'circle-stroke-opacity': 0.6,
    }
  })

  // Cluster count labels
  map.addLayer({
    id: countId,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': [
        'case',
        ['>=', ['get', 'point_count'], 1000],
        ['concat', ['to-string', ['round', ['/', ['get', 'point_count'], 1000]]], 'k'],
        ['to-string', ['get', 'point_count']]
      ],
      'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
      'text-size': 10,
    },
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.2)',
      'text-halo-width': 0.5,
    }
  })

  // Individual points (unclustered)
  map.addLayer({
    id: pointId,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color':          cls.color,
      'circle-radius':         ['interpolate', ['linear'], ['zoom'], 7, 4, 10, 6, 14, 9],
      'circle-opacity':        0.85,
      'circle-stroke-width':   1,
      'circle-stroke-color':   '#ffffff',
      'circle-stroke-opacity': 0.5,
    }
  })

  // Cluster click → zoom in
  map.on('click', clusterId, (e) => {
    const clusterId2 = e.features[0].properties.cluster_id
    map.getSource(sourceId).getClusterExpansionZoom(clusterId2, (err, zoom) => {
      if (err) return
      map.easeTo({ center: e.features[0].geometry.coordinates, zoom: zoom + 0.5 })
    })
  })

  // Point hover
  map.on('mousemove', pointId, (e) => {
    map.getCanvas().style.cursor = 'pointer'
    const p = e.features[0].properties
    popup.value = { x: e.point.x + 14, y: e.point.y - 12, ...p }
  })
  map.on('mouseleave', pointId, () => {
    map.getCanvas().style.cursor = ''
    popup.value = null
  })

  // Cluster hover cursor
  map.on('mouseenter', clusterId, () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', clusterId, () => { map.getCanvas().style.cursor = '' })

  // Point click → select species
  map.on('click', pointId, (e) => {
    emit('select-species', e.features[0].properties)
    popup.value = null
  })
}

function updateSources() {
  if (!map || !map.isStyleLoaded()) return
  CLASSES.forEach(cls => {
    const sourceId = `sightings-${cls.key}`
    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(buildGeoJSON(props.sightings, cls.key))
    } else {
      addClassLayers(cls)
    }
  })
}

onMounted(() => {
  maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? ''
  const bounds = CONTINENT_BOUNDS[slug] ?? CONTINENT_BOUNDS.northamerica
  const view   = CONTINENT_VIEW[slug]   ?? CONTINENT_VIEW.northamerica

  map = new maptilersdk.Map({
    container:  mapContainer.value,
    style:      maptilersdk.MapStyle.OUTDOOR,
    center:     view.center,
    zoom:       view.zoom,
    minZoom:    2,
    maxZoom:    16,
    maxBounds:  bounds,
    projection: 'mercator',
    attributionControl: false,
  })

  map.addControl(new maptilersdk.AttributionControl({ compact: true }), 'bottom-right')
  map.addControl(new maptilersdk.NavigationControl(), 'bottom-right')

  map.on('load', () => {
    if (props.sightings.length > 0) updateSources()
  })

  map.on('click', () => { popup.value = null })
})

onUnmounted(() => { if (map) map.remove() })

watch(() => props.sightings, () => {
  if (!map || !map.isStyleLoaded()) return
  updateSources()
}, { deep: false })
</script>

<style scoped>
.map-wrap { width: 100%; height: 100%; position: relative; }
.map      { width: 100%; height: 100%; }

.map-loading {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  pointer-events: none; z-index: 5;
}
.loading-pill {
  background: rgba(240,236,224,0.92);
  border: 0.5px solid rgba(0,0,0,0.1);
  border-radius: 20px; padding: 8px 16px;
  font-size: 12px; color: #706050;
}

.map-popup {
  position: absolute;
  background: #f8f4e8; border: 0.5px solid rgba(176,88,40,0.4);
  border-radius: 4px; padding: 10px 12px;
  pointer-events: none; z-index: 10;
  min-width: 160px; max-width: 220px;
}
.popup-name  { font-family: Georgia, serif; font-size: 13px; color: #2a2418; margin-bottom: 2px; line-height: 1.3; }
.popup-latin { font-size: 10px; color: #a09080; font-style: italic; margin-bottom: 6px; }
.popup-row   { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; }
.popup-badge { font-size: 9px; font-weight: 500; padding: 2px 5px; border-radius: 3px; }
.popup-class { font-size: 10px; color: #a09080; }
.popup-hint  { font-size: 9px; color: #b0a090; }
</style>
