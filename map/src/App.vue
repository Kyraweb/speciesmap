<template>
  <div class="app-shell">
    <nav class="topnav">
      <span class="logo">species<b>map</b></span>
      <div class="continent-tabs">
        <span
          v-for="c in continents"
          :key="c.slug"
          class="ctab"
          :class="{ active: c.slug === currentSlug, soon: !c.live }"
        >
          {{ c.name }}
        </span>
      </div>
      <div class="nav-right">
        <input class="search" type="text" placeholder="Search species..." v-model="search" />
      </div>
    </nav>

    <div class="body">
      <aside class="sidebar">
        <Sidebar
          :selected-class="selectedClass"
          :sighting-count="sightings.length"
          :species-count="speciesList.length"
          @filter-class="selectedClass = $event"
        />
      </aside>

      <main class="map-area">
        <FlatMap
          :sightings="sightings"
          :selected-class="selectedClass"
          @select-species="selectedSpecies = $event"
        />
      </main>

      <DetailPanel
        v-if="selectedSpecies"
        :species="selectedSpecies"
        @close="selectedSpecies = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useApi } from './composables/useApi'
import { useContinent } from './composables/useContinent'
import Sidebar from './components/Sidebar.vue'
import DetailPanel from './components/DetailPanel.vue'
import FlatMap from './components/FlatMap.vue'

const { get, continent } = useApi()
const { slug: currentSlug } = useContinent()

const mapContainer  = ref(null)
const sightings     = ref([])
const speciesList   = ref([])
const selectedClass   = ref(null)
const selectedSpecies = ref(null)
const search          = ref('')

const continents = [
  { name: 'North America', slug: 'northamerica', live: true  },
  { name: 'South America', slug: 'southamerica', live: false },
  { name: 'Europe',        slug: 'europe',       live: false },
  { name: 'Africa',        slug: 'africa',       live: false },
  { name: 'Asia',          slug: 'asia',         live: false },
  { name: 'Australia',     slug: 'australia',    live: false },
]

async function loadSightings() {
  try {
    sightings.value = await get('/api/sightings', {
      class: selectedClass.value,
      limit: 500,
    })
  } catch (e) {
    console.error('Failed to load sightings:', e)
  }
}

async function loadSpecies() {
  try {
    speciesList.value = await get('/api/species', {
      class: selectedClass.value,
    })
  } catch (e) {
    console.error('Failed to load species:', e)
  }
}

watch(selectedClass, () => {
  loadSightings()
  loadSpecies()
})

onMounted(() => {
  loadSightings()
  loadSpecies()
})
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg);
}

.topnav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 48px;
  background: var(--color-bg-sidebar);
  border-bottom: 0.5px solid var(--color-border);
  flex-shrink: 0;
}

.logo {
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--color-text-primary);
}

.logo b {
  color: var(--color-mammal);
  font-weight: normal;
}

.continent-tabs {
  display: flex;
  gap: 2px;
  background: rgba(0,0,0,0.06);
  border-radius: 5px;
  padding: 3px;
}

.ctab {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-text-muted);
}

.ctab.active {
  background: var(--color-bg-panel);
  color: var(--color-text-primary);
}

.ctab.soon {
  opacity: 0.45;
  cursor: default;
}

.nav-right {
  margin-left: auto;
}

.search {
  background: rgba(255,255,255,0.6);
  border: 0.5px solid var(--color-border);
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 11px;
  color: var(--color-text-secondary);
  width: 180px;
  outline: none;
}

.body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.sidebar {
  width: 200px;
  flex-shrink: 0;
}

.map-area {
  flex: 1;
  position: relative;
}

#map {
  width: 100%;
  height: 100%;
}
</style>
