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
        <button class="vtab" :class="{ active: viewMode === 'hex' }" @click="viewMode = 'hex'">
          <svg width="13" height="13" viewBox="0 0 14 14"><polygon points="7,1 13,4.5 13,9.5 7,13 1,9.5 1,4.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
          Biodiversity
        </button>
        <button class="vtab" :class="{ active: viewMode === 'dots' }" @click="viewMode = 'dots'">
          <svg width="13" height="13" viewBox="0 0 14 14"><circle cx="4" cy="4" r="2.5" fill="currentColor" opacity="0.6"/><circle cx="10" cy="9" r="2.5" fill="currentColor" opacity="0.6"/><circle cx="7" cy="6" r="2" fill="currentColor"/></svg>
          Sightings
        </button>
      </div>
      <div class="nav-right">
        <input class="search" type="text" placeholder="Search species..." v-model="search" />
      </div>
    </nav>

    <div class="body">
      <aside class="sidebar">
        <Sidebar
          :selected-class="selectedClass"
          :sighting-count="hexStats?.total_sightings || sightings.length"
          :species-count="hexStats?.total_species_records || speciesList.length"
          :view-mode="viewMode"
          @filter-class="selectedClass = $event"
        />
      </aside>

      <main class="map-area">
        <HexMap
          v-if="viewMode === 'hex'"
          :selected-class="selectedClass"
          @select-hex="onSelectHex"
        />
        <FlatMap
          v-else
          :sightings="sightings"
          :selected-class="selectedClass"
          @select-species="onSelectSpecies"
        />
      </main>

      <HexDetail
        v-if="viewMode === 'hex'"
        :hex-index="selectedHex"
        @close="selectedHex = null"
      />
      <DetailPanel
        v-else
        :species="selectedSpecies"
        @close="selectedSpecies = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useApi } from './composables/useApi'
import { useContinent, navigateToContinent } from './composables/useContinent'
import Sidebar     from './components/Sidebar.vue'
import DetailPanel from './components/DetailPanel.vue'
import FlatMap     from './components/FlatMap.vue'
import HexMap      from './components/HexMap.vue'
import HexDetail   from './components/HexDetail.vue'

const { get } = useApi()
const { slug: currentSlug } = useContinent()

const viewMode      = ref('hex')
const sightings     = ref([])
const speciesList   = ref([])
const hexStats      = ref(null)
const selectedClass   = ref(null)
const selectedHex     = ref(null)
const selectedSpecies = ref(null)
const search          = ref('')

const continents = [
  { name: 'N. America',   slug: 'northamerica' },
  { name: 'S. America',   slug: 'southamerica' },
  { name: 'Europe',       slug: 'europe' },
  { name: 'Africa',       slug: 'africa' },
  { name: 'Asia',         slug: 'asia' },
  { name: 'Oceania',      slug: 'oceania' },
]

function switchContinent(slug) {
  if (slug === currentSlug) return
  navigateToContinent(slug)
}

function onSelectHex(h3Index) {
  selectedHex.value     = h3Index
  selectedSpecies.value = null
}

function onSelectSpecies(sighting) {
  selectedSpecies.value = sighting
  selectedHex.value     = null
}

async function loadSightings() {
  try {
    sightings.value = await get('/api/sightings', { class: selectedClass.value, limit: 2000 })
  } catch (e) { console.error('Failed to load sightings:', e) }
}

async function loadSpecies() {
  try {
    speciesList.value = await get('/api/species', { class: selectedClass.value })
  } catch (e) { console.error('Failed to load species:', e) }
}

async function loadHexStats() {
  try {
    hexStats.value = await get('/api/hex/stats/overview')
  } catch (e) { console.error('Failed to load hex stats:', e) }
}

watch(selectedClass, () => {
  if (viewMode.value === 'dots') { loadSightings(); loadSpecies() }
})

watch(viewMode, (mode) => {
  if (mode === 'dots' && sightings.value.length === 0) { loadSightings(); loadSpecies() }
})

onMounted(() => { loadHexStats() })
</script>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; background: var(--color-bg); }

.topnav {
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px; height: 48px;
  background: var(--color-bg-sidebar);
  border-bottom: 0.5px solid var(--color-border);
  flex-shrink: 0;
}

.logo { font-family: var(--font-serif); font-size: 15px; color: var(--color-text-primary); flex-shrink: 0; }
.logo b { color: var(--color-mammal); font-weight: normal; }

.continent-tabs { display: flex; gap: 2px; background: rgba(0,0,0,0.06); border-radius: 5px; padding: 3px; }

.ctab {
  padding: 4px 8px; font-size: 11px; border-radius: 3px;
  cursor: pointer; color: var(--color-text-muted);
  transition: background 0.15s, color 0.15s; white-space: nowrap;
}
.ctab:hover { color: var(--color-text-primary); background: rgba(0,0,0,0.04); }
.ctab.active { background: var(--color-bg-panel); color: var(--color-text-primary); }

.view-toggle { display: flex; gap: 2px; background: rgba(0,0,0,0.06); border-radius: 5px; padding: 3px; }

.vtab {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 9px; font-size: 11px; border-radius: 3px;
  border: none; background: none; cursor: pointer;
  color: var(--color-text-muted); font-family: var(--font-sans);
  transition: background 0.15s, color 0.15s;
}
.vtab.active { background: var(--color-bg-panel); color: var(--color-text-primary); }

.nav-right { margin-left: auto; }
.search {
  background: rgba(255,255,255,0.6); border: 0.5px solid var(--color-border);
  border-radius: 5px; padding: 5px 10px; font-size: 11px;
  color: var(--color-text-secondary); width: 160px; outline: none;
}

.body { display: flex; flex: 1; overflow: hidden; position: relative; }
.sidebar { width: 200px; flex-shrink: 0; }
.map-area { flex: 1; position: relative; }
</style>
