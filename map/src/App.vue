<template>
  <div class="app-shell">
    <nav class="topnav">
      <span class="logo">species<b>map</b></span>
      <div class="continent-tabs">
        <span
          v-for="c in continents"
          :key="c.slug"
          class="ctab"
          :class="{ active: c.slug === currentSlug }"
          @click="switchContinent(c.slug)"
        >{{ c.name }}</span>
      </div>
      <div class="view-toggle">
        <button class="vtab" :class="{ active: viewMode === 'hex' }" @click="setView('hex')">
          <svg width="13" height="13" viewBox="0 0 14 14">
            <polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
          </svg>
          Biodiversity
        </button>
        <button class="vtab" :class="{ active: viewMode === 'dots' }" @click="setView('dots')">
          <svg width="13" height="13" viewBox="0 0 14 14">
            <circle cx="4" cy="4" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="10" cy="9" r="2.5" fill="currentColor" opacity="0.6"/>
            <circle cx="7" cy="6" r="2" fill="currentColor"/>
          </svg>
          Sightings
        </button>
      </div>
      <div class="nav-right">
        <span v-if="loadingMsg" class="loading-indicator">{{ loadingMsg }}</span>
      </div>
    </nav>

    <div class="body">
      <aside class="sidebar-wrap">
        <Sidebar
          :selected-class="selectedClass"
          :view-mode="viewMode"
          :sighting-count="hexStats?.total_sightings || 0"
          :species-count="hexStats?.total_species_records || 0"
          @filter-class="onFilterClass"
        />
      </aside>

      <!--
        Species panel only shows in SIGHTINGS mode.
        In biodiversity mode, the sidebar shows class info but doesn't slide the species panel.
      -->
      <SpeciesPanel
        v-if="viewMode === 'dots' && selectedClass"
        :selected-class="selectedClass"
        :selected-species="selectedSpecies"
        @close="onClosePanel"
        @select-species="onSelectSpecies"
      />

      <main class="map-area">
        <HexMap
          v-if="viewMode === 'hex'"
          :selected-class="selectedClass"
          @select-hex="onSelectHex"
        />
        <FlatMap
          v-else
          :sightings="sightings"
          :loading="loadingSightings"
          @select-species="onSelectSpeciesFromMap"
        />
      </main>

      <!-- Hex detail panel — biodiversity mode only -->
      <HexDetail
        v-if="viewMode === 'hex'"
        :hex-index="selectedHex"
        @close="selectedHex = null"
      />

      <!-- Species detail panel — shown in both modes when a species is selected -->
      <DetailPanel
        v-if="selectedSpecies"
        :species="selectedSpecies"
        @close="selectedSpecies = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useApi } from './composables/useApi'
import { useContinent, navigateToContinent } from './composables/useContinent'
import Sidebar      from './components/Sidebar.vue'
import SpeciesPanel from './components/SpeciesPanel.vue'
import DetailPanel  from './components/DetailPanel.vue'
import FlatMap      from './components/FlatMap.vue'
import HexMap       from './components/HexMap.vue'
import HexDetail    from './components/HexDetail.vue'

const { get } = useApi()
const { slug: currentSlug } = useContinent()

const viewMode         = ref('hex')
const sightings        = ref([])
const hexStats         = ref(null)
const selectedClass    = ref(null)
const selectedHex      = ref(null)
const selectedSpecies  = ref(null)
const loadingSightings = ref(false)
const loadingMsg       = ref('')

const continents = [
  { name: 'N. America', slug: 'northamerica' },
  { name: 'S. America', slug: 'southamerica' },
  { name: 'Europe',     slug: 'europe'       },
  { name: 'Africa',     slug: 'africa'       },
  { name: 'Asia',       slug: 'asia'         },
  { name: 'Oceania',    slug: 'oceania'      },
]

function switchContinent(slug) {
  if (slug === currentSlug) return
  navigateToContinent(slug)
}

function setView(mode) {
  viewMode.value = mode
  selectedSpecies.value = null  // Reset species when switching views
  selectedHex.value     = null

  if (mode === 'dots') {
    // Load sightings for current class filter (or all if none)
    loadSightings()
  }
}

function onFilterClass(cls) {
  // Toggle off if already selected
  if (selectedClass.value === cls) {
    selectedClass.value   = null
    selectedSpecies.value = null
    if (viewMode.value === 'dots') loadSightings()
    return
  }

  selectedClass.value   = cls
  selectedSpecies.value = null
  selectedHex.value     = null

  if (viewMode.value === 'dots') {
    loadSightings()
  }
  // In hex mode — class filter handled by HexMap paint expression, nothing to load
}

function onClosePanel() {
  selectedClass.value   = null
  selectedSpecies.value = null
  if (viewMode.value === 'dots') loadSightings()
}

function onSelectSpecies(sp) {
  selectedSpecies.value = sp
  selectedHex.value     = null
  if (viewMode.value === 'dots') loadSightingsForSpecies(sp)
}

function onSelectSpeciesFromMap(sp) {
  selectedSpecies.value = sp
  selectedHex.value     = null
}

function onSelectHex(h3Index) {
  selectedHex.value     = h3Index
  selectedSpecies.value = null
}

async function loadSightings() {
  loadingSightings.value = true
  loadingMsg.value = 'Loading sightings...'
  try {
    const params = {}
    if (selectedClass.value) params.class = selectedClass.value
    sightings.value = await get('/api/sightings', params)
  } catch (e) {
    console.error('Failed to load sightings:', e)
  } finally {
    loadingSightings.value = false
    loadingMsg.value = ''
  }
}

async function loadSightingsForSpecies(sp) {
  loadingSightings.value = true
  loadingMsg.value = `Locating ${sp.display_name}...`
  try {
    sightings.value = await get('/api/sightings', { species_id: sp.id })
  } catch (e) {
    console.error('Failed to load species sightings:', e)
  } finally {
    loadingSightings.value = false
    loadingMsg.value = ''
  }
}

async function loadHexStats() {
  try { hexStats.value = await get('/api/hex/stats/overview') }
  catch (e) { console.error(e) }
}

onMounted(() => loadHexStats())
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; }

.topnav {
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 48px;
  background: #e8e4d8; border-bottom: 0.5px solid rgba(0,0,0,0.09);
  flex-shrink: 0; z-index: 20; position: relative;
}

.logo { font-family: Georgia, serif; font-size: 15px; color: #2a2418; flex-shrink: 0; }
.logo b { color: #b05828; font-weight: normal; }

.continent-tabs { display: flex; gap: 2px; background: rgba(0,0,0,0.06); border-radius: 5px; padding: 3px; }
.ctab {
  padding: 4px 8px; font-size: 11px; border-radius: 3px; cursor: pointer;
  color: #a09080; transition: background 0.15s, color 0.15s; white-space: nowrap;
}
.ctab:hover  { color: #2a2418; background: rgba(0,0,0,0.04); }
.ctab.active { background: #f0ece0; color: #2a2418; }

.view-toggle { display: flex; gap: 2px; background: rgba(0,0,0,0.06); border-radius: 5px; padding: 3px; }
.vtab {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 9px; font-size: 11px; border-radius: 3px;
  border: none; background: none; cursor: pointer;
  color: #a09080; font-family: inherit; transition: background 0.15s, color 0.15s;
}
.vtab.active { background: #f0ece0; color: #2a2418; }

.nav-right { margin-left: auto; }
.loading-indicator { font-size: 11px; color: #a09080; font-style: italic; }

.body { display: flex; flex: 1; overflow: hidden; position: relative; }

.sidebar-wrap { width: 200px; flex-shrink: 0; z-index: 9; position: relative; }

.map-area { flex: 1; position: relative; overflow: hidden; }
</style>
