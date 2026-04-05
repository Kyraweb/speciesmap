<template>
  <transition name="slide">
    <div class="species-panel" v-if="selectedClass">

      <!-- Header with breadcrumb -->
      <div class="sp-header">
        <button class="back-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L5 7l4 5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
          {{ classLabel }}
        </button>
        <button class="xbtn" @click="$emit('close')">✕</button>
      </div>

      <!-- Search -->
      <div class="sp-search">
        <svg width="13" height="13" viewBox="0 0 14 14" class="search-icon"><circle cx="6" cy="6" r="4" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="9" y1="9" x2="13" y2="13" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        <input
          ref="searchInput"
          v-model="search"
          type="text"
          :placeholder="`Search ${classLabel.toLowerCase()}...`"
          class="search-input"
          @input="onSearch"
        />
        <button v-if="search" class="clear-btn" @click="search = ''; onSearch()">✕</button>
      </div>

      <!-- IUCN filter chips -->
      <div class="iucn-chips">
        <span
          v-for="s in iucnFilters"
          :key="s.code"
          class="iucn-chip"
          :class="{ active: activeIucn === s.code }"
          :style="activeIucn === s.code ? { background: s.bg, color: s.color, borderColor: s.color } : {}"
          @click="toggleIucn(s.code)"
        >{{ s.code }}</span>
      </div>

      <!-- Species list -->
      <div class="sp-list" ref="listEl">
        <div v-if="loading" class="sp-empty">Loading...</div>
        <div v-else-if="species.length === 0" class="sp-empty">No species found</div>
        <div
          v-else
          v-for="sp in species"
          :key="sp.id"
          class="sp-row"
          :class="{ active: selectedSpecies?.id === sp.id }"
          @click="selectSpecies(sp)"
        >
          <div class="sp-name">{{ sp.display_name }}</div>
          <div class="sp-meta">
            <span v-if="sp.iucn_status" class="sp-badge" :style="iucnStyle(sp.iucn_status)">{{ sp.iucn_status }}</span>
            <span class="sp-count">{{ fmt(sp.sighting_count) }}</span>
          </div>
        </div>

        <div v-if="species.length >= limit && !loading" class="sp-more">
          Showing top {{ limit }} — use search to narrow results
        </div>
      </div>

    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useApi } from '../composables/useApi'

const props = defineProps({
  selectedClass:   { type: String, default: null },
  selectedSpecies: { type: Object, default: null },
})

const emit = defineEmits(['close', 'select-species'])

const { get } = useApi()

const search       = ref('')
const activeIucn   = ref(null)
const species      = ref([])
const loading      = ref(false)
const searchInput  = ref(null)
const listEl       = ref(null)
const limit        = 200
let   searchTimer  = null

const CLASS_LABELS = {
  Mammalia:  'Mammals',
  Reptilia:  'Reptiles',
  Amphibia:  'Amphibians',
}

const classLabel = computed(() => CLASS_LABELS[props.selectedClass] || props.selectedClass)

const iucnFilters = [
  { code: 'CR', bg: '#fde8e8', color: '#c02020' },
  { code: 'EN', bg: '#fdeede', color: '#c05010' },
  { code: 'VU', bg: '#fdf8dc', color: '#a08010' },
  { code: 'LC', bg: '#eaf3de', color: '#3a6818' },
]

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

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return n.toLocaleString()
}

function toggleIucn(code) {
  activeIucn.value = activeIucn.value === code ? null : code
  loadSpecies()
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadSpecies(), 300)
}

async function loadSpecies() {
  if (!props.selectedClass) return
  loading.value = true
  try {
    const params = { class: props.selectedClass, limit }
    if (search.value)     params.search      = search.value
    if (activeIucn.value) params.iucn_status = activeIucn.value
    species.value = await get('/api/species', params)
    if (listEl.value) listEl.value.scrollTop = 0
  } catch (e) {
    console.error('Failed to load species:', e)
  } finally {
    loading.value = false
  }
}

function selectSpecies(sp) {
  emit('select-species', sp)
}

watch(() => props.selectedClass, async (cls) => {
  if (!cls) return
  search.value     = ''
  activeIucn.value = null
  species.value    = []
  await loadSpecies()
  await nextTick()
  searchInput.value?.focus()
})
</script>

<style scoped>
.species-panel {
  position: absolute;
  top: 0; left: 200px;
  width: 240px;
  height: 100%;
  background: #f0ece0;
  border-right: 0.5px solid rgba(0,0,0,0.09);
  display: flex;
  flex-direction: column;
  z-index: 8;
  overflow: hidden;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }

.sp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 0.5px solid rgba(0,0,0,0.08);
  background: #e8e4d8;
  flex-shrink: 0;
}

.back-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #b05828; background: none; border: none;
  cursor: pointer; font-family: inherit; padding: 0;
}

.xbtn {
  width: 22px; height: 22px; border-radius: 4px;
  border: 0.5px solid rgba(0,0,0,0.1);
  background: rgba(0,0,0,0.04); cursor: pointer;
  font-size: 11px; color: #908070;
}

.sp-search {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px;
  border-bottom: 0.5px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.search-icon { color: #b0a090; flex-shrink: 0; }

.search-input {
  flex: 1; border: none; background: none; outline: none;
  font-size: 12px; color: #2a2418; font-family: inherit;
}
.search-input::placeholder { color: #c0b0a0; }

.clear-btn {
  background: none; border: none; cursor: pointer;
  font-size: 10px; color: #b0a090; padding: 0;
}

.iucn-chips {
  display: flex; gap: 5px; padding: 7px 10px;
  border-bottom: 0.5px solid rgba(0,0,0,0.06);
  flex-shrink: 0;
}

.iucn-chip {
  font-size: 10px; padding: 3px 8px; border-radius: 12px;
  border: 0.5px solid rgba(0,0,0,0.12);
  background: rgba(0,0,0,0.04); color: #a09080;
  cursor: pointer; transition: all 0.15s;
}
.iucn-chip:hover { background: rgba(0,0,0,0.08); }
.iucn-chip.active { font-weight: 500; }

.sp-list {
  flex: 1; overflow-y: auto;
  padding: 4px 0;
}

.sp-empty {
  padding: 20px; font-size: 12px; color: #a09080; text-align: center;
}

.sp-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 10px; cursor: pointer;
  transition: background 0.12s; gap: 6px;
}
.sp-row:hover { background: rgba(0,0,0,0.04); }
.sp-row.active { background: rgba(176,88,40,0.08); }

.sp-name {
  font-size: 12px; color: #2a2418;
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  line-height: 1.3;
}

.sp-meta { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }

.sp-badge { font-size: 8px; padding: 1px 4px; border-radius: 2px; }

.sp-count { font-size: 10px; color: #b0a090; min-width: 28px; text-align: right; }

.sp-more {
  padding: 10px; font-size: 10px; color: #b0a090;
  text-align: center; border-top: 0.5px solid rgba(0,0,0,0.06);
}
</style>
