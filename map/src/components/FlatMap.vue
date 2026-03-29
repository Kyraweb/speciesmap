<template>
  <div class="map-wrap">
    <div ref="mapContainer" class="map"></div>

    <!-- Popup tooltip -->
    <div v-if="popup" class="map-popup" :style="{ left: popup.x + 'px', top: popup.y + 'px' }">
      <div class="popup-name">{{ popup.common_name || popup.scientific_name }}</div>
      <div class="popup-latin" v-if="popup.common_name">{{ popup.scientific_name }}</div>
      <div class="popup-row">
        <span v-if="popup.iucn_status" class="popup-badge" :style="iucnStyle(popup.iucn_status)">
          {{ popup.iucn_status }}
        </span>
        <span class="popup-class">{{ popup.class }}</span>
      </div>
      <div class="popup-hint">Click to explore →</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import { useContinent } from '../composables/useContinent'

const props = defineProps({
  sightings:     { type: Array,  default: () => [] },
  selectedClass: { type: String, default: null },
})

const emit = defineEmits(['select-species'])

const { slug } = useContinent()
const mapContainer = ref(null)
const popup        = ref(null)
let map            = null
let popupData      = {}

const CONTINENT_BOUNDS = {
  northamerica: [-172.0,   5.0,  -48.0,  86.0],
  southamerica: [ -85.0, -58.0,  -30.0,  15.0],
  europe:       [ -28.0,  32.0,   48.0,  74.0],
  africa:       [ -20.0, -37.0,   54.0,  40.0],
  asia:         [  24.0,  -1.0,  182.0,  80.0],
  australia:    [ 110.0, -47.0,  157.0,  -8.0],
}

const CONTINENT_VIEW = {
  northamerica: { center: [-98.0,  45.0], zoom: 3   },
  southamerica: { center: [-58.0, -20.0], zoom: 3   },
  europe:       { center: [ 10.0,  54.0], zoom: 3.5 },
  africa:       { center: [ 18.0,   2.0], zoom: 3   },
  asia:         { center: [ 95.0,  40.0], zoom: 2.5 },
  australia:    { center: [134.0, -27.0], zoom: 3.5 },
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

function buildGeoJSON(sightings) {
  return {
    type: 'FeatureCollection',
    features: sightings.map(s => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [s.lng, s.lat]
      },
      properties: {
        id:              s.id,
        species_id:      s.species_id,
        common_name:     s.common_name,
        scientific_name: s.scientific_name,
        class:           s.class,
        iucn_status:     s.iucn_status,
        country:         s.country,
        observed_at:     s.observed_at,
        individual_count: s.individual_count,
        lng:             s.lng,
        lat:             s.lat,
      }
    }))
  }
}

function addLayers() {
  if (!map) return

  // Add or update GeoJSON source
  if (map.getSource('sightings')) {
    map.getSource('sightings').setData(buildGeoJSON(props.sightings))
    return
  }

  map.addSource('sightings', {
    type: 'geojson',
    data: buildGeoJSON(props.sightings),
    cluster: true,
    clusterMaxZoom: 8,
    clusterRadius: 40,
  })

  // Cluster circles
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'sightings',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step', ['get', 'point_count'],
        '#b05828', 10,
        '#8c4420', 50,
        '#6a3018'
      ],
      'circle-radius': [
        'step', ['get', 'point_count'],
        14, 10,
        18, 50,
        22
      ],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1.5,
      'circle-stroke-color': '#fff',
      'circle-stroke-opacity': 0.4,
    }
  })

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'sightings',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Open Sans Bold'],
      'text-size': 11,
    },
    paint: {
      'text-color': '#ffffff',
    }
  })

  // Individual points — colour by class
  map.addLayer({
    id: 'sightings-points',
    type: 'circle',
    source: 'sightings',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': [
        'interpolate', ['linear'], ['zoom'],
        3, 4,
        8, 7,
        12, 10
      ],
      'circle-color': [
        'match', ['get', 'class'],
        'Mammalia',  '#b05828',
        'Aves',      '#4880a8',
        'Reptilia',  '#6a9848',
        'Amphibia',  '#8858b0',
        'Insecta',   '#888780',
        '#a09080'
      ],
      'circle-opacity': 0.85,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
      'circle-stroke-opacity': 0.5,
    }
  })

  // Hover state — enlarge on hover
  map.addLayer({
    id: 'sightings-points-hover',
    type: 'circle',
    source: 'sightings',
    filter: ['==', 'id', ''],
    paint: {
      'circle-radius': 10,
      'circle-color': [
        'match', ['get', 'class'],
        'Mammalia',  '#b05828',
        'Aves',      '#4880a8',
        'Reptilia',  '#6a9848',
        'Amphibia',  '#8858b0',
        'Insecta',   '#888780',
        '#a09080'
      ],
      'circle-opacity': 1,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
    }
  })
}

function setupEvents() {
  if (!map) return

  // Hover
  map.on('mousemove', 'sightings-points', (e) => {
    map.getCanvas().style.cursor = 'pointer'
    const props = e.features[0].properties
    map.setFilter('sightings-points-hover', ['==', 'id', props.id])
    const rect = mapContainer.value.getBoundingClientRect()
    popup.value = {
      x: e.point.x + 12,
      y: e.point.y - 10,
      ...props
    }
    popupData = props
  })

  map.on('mouseleave', 'sightings-points', () => {
    map.getCanvas().style.cursor = ''
    map.setFilter('sightings-points-hover', ['==', 'id', ''])
    popup.value = null
  })

  // Click individual point
  map.on('click', 'sightings-points', (e) => {
    const props = e.features[0].properties
    emit('select-species', props)
    popup.value = null
  })

  // Click cluster — zoom in
  map.on('click', 'clusters', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
    const clusterId = features[0].properties.cluster_id
    map.getSource('sightings').getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err) return
      map.easeTo({ center: features[0].geometry.coordinates, zoom })
    })
  })

  map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer' })
  map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = '' })

  // Close popup on map click
  map.on('click', () => { popup.value = null })
}

onMounted(() => {
  maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY ?? ''

  const bounds = CONTINENT_BOUNDS[slug] ?? CONTINENT_BOUNDS.northamerica
  const view   = CONTINENT_VIEW[slug]   ?? CONTINENT_VIEW.northamerica

  map = new maptilersdk.Map({
    container:   mapContainer.value,
    style:       maptilersdk.MapStyle.OUTDOOR,
    center:      view.center,
    zoom:        view.zoom,
    minZoom:     2,
    maxZoom:     14,
    maxBounds:   bounds,
    projection:  'mercator',
    attributionControl: false,
  })

  map.addControl(new maptilersdk.AttributionControl({ compact: true }), 'bottom-right')
  map.addControl(new maptilersdk.NavigationControl(), 'bottom-right')

  map.on('load', () => {
    addLayers()
    setupEvents()
  })
})

onUnmounted(() => {
  if (map) map.remove()
})

watch(() => props.sightings, () => {
  if (map && map.isStyleLoaded()) {
    if (map.getSource('sightings')) {
      map.getSource('sightings').setData(buildGeoJSON(props.sightings))
    } else {
      addLayers()
      setupEvents()
    }
  }
}, { deep: true })
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
  line-height: 1.3;
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

.popup-class {
  font-size: 10px;
  color: #a09080;
}

.popup-hint {
  font-size: 9px;
  color: #b0a090;
}
</style>
