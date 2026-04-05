<template>
  <div class="sidebar">
    <div class="sidebar-head">
      <div class="stat-row">
        <div class="stat">
          <div class="stat-num">{{ fmt(sightingCount) }}</div>
          <div class="stat-lbl">sightings</div>
        </div>
        <div class="stat">
          <div class="stat-num">{{ fmt(speciesCount) }}</div>
          <div class="stat-lbl">species</div>
        </div>
      </div>
    </div>

    <div class="section-label">Classes</div>
    <div class="class-list">
      <div
        v-for="cls in classes"
        :key="cls.key"
        class="class-item"
        :class="{ active: selectedClass === cls.key }"
        @click="selectClass(cls.key)"
      >
        <span class="cls-dot" :style="{ background: cls.color }"></span>
        <div class="cls-info">
          <div class="cls-name">{{ cls.label }}</div>
          <div class="cls-count">
            <span v-if="classCounts[cls.key]">{{ fmt(classCounts[cls.key].sighting_count) }}</span>
            <span v-else class="loading-pulse">···</span>
          </div>
        </div>
        <svg class="cls-arrow" width="12" height="12" viewBox="0 0 12 12">
          <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <div class="section-label" style="margin-top: 14px;">Conservation status</div>
    <div class="iucn-list">
      <div v-for="s in iucnStatuses" :key="s.code" class="iucn-row">
        <span class="iucn-badge" :style="{ background: s.bg, color: s.color }">{{ s.code }}</span>
        <span class="iucn-label">{{ s.label }}</span>
      </div>
    </div>

    <div class="sidebar-footer">
      <div class="footer-label">Data source</div>
      <div class="footer-source">GBIF · Human observations</div>
      <div class="footer-source">Mammalia · Reptilia · Amphibia</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'

const props = defineProps({
  selectedClass:  { type: String, default: null },
  sightingCount:  { type: Number, default: 0 },
  speciesCount:   { type: Number, default: 0 },
  viewMode:       { type: String, default: 'hex' },
})

const emit = defineEmits(['filter-class'])
const { get } = useApi()
const classCounts = ref({})

// Aves removed — speciesmap covers land animals only
const classes = [
  { key: 'Mammalia',  label: 'Mammals',    color: '#b05828' },
  { key: 'Reptilia',  label: 'Reptiles',   color: '#6a9848' },
  { key: 'Amphibia',  label: 'Amphibians', color: '#8858b0' },
]

const iucnStatuses = [
  { code: 'CR', label: 'Critically endangered', bg: '#fde8e8', color: '#c02020' },
  { code: 'EN', label: 'Endangered',            bg: '#fdeede', color: '#c05010' },
  { code: 'VU', label: 'Vulnerable',            bg: '#fdf8dc', color: '#a08010' },
  { code: 'NT', label: 'Near threatened',       bg: '#f5f5dc', color: '#806010' },
  { code: 'LC', label: 'Least concern',         bg: '#eaf3de', color: '#3a6818' },
]

function fmt(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return n.toLocaleString()
}

function selectClass(key) {
  emit('filter-class', props.selectedClass === key ? null : key)
}

async function loadCounts() {
  try {
    const counts = await get('/api/species/counts')
    const map = {}
    counts.forEach(c => { map[c.class] = c })
    classCounts.value = map
  } catch (e) {
    console.error('Failed to load class counts:', e)
  }
}

onMounted(() => loadCounts())
</script>

<style scoped>
.sidebar {
  height: 100%; background: #e8e4d8;
  border-right: 0.5px solid rgba(0,0,0,0.09);
  display: flex; flex-direction: column; overflow: hidden;
}

.sidebar-head { padding: 12px 12px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.08); flex-shrink: 0; }
.stat-row { display: flex; gap: 8px; }
.stat { flex: 1; background: #f0ece0; border-radius: 6px; padding: 8px 10px; text-align: center; }
.stat-num { font-size: 16px; font-family: Georgia, serif; color: #6a9848; text-shadow: 0 0 8px rgba(106,152,72,0.3); line-height: 1; }
.stat-lbl { font-size: 9px; color: #a09080; margin-top: 2px; }

.section-label { font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; color: #b0a090; padding: 10px 12px 5px; flex-shrink: 0; }

.class-list { padding: 0 8px; flex-shrink: 0; }
.class-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s;
}
.class-item:hover { background: rgba(0,0,0,0.05); }
.class-item.active { background: #f0ece0; }
.cls-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.cls-info { flex: 1; min-width: 0; }
.cls-name { font-size: 12px; color: #2a2418; }
.cls-count { font-size: 10px; color: #a09080; margin-top: 1px; }
.loading-pulse { opacity: 0.5; }
.cls-arrow { color: #c0b0a0; flex-shrink: 0; }
.class-item.active .cls-arrow { color: #b05828; }

.iucn-list { padding: 0 12px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
.iucn-row { display: flex; align-items: center; gap: 7px; }
.iucn-badge { font-size: 9px; padding: 2px 5px; border-radius: 3px; font-weight: 500; flex-shrink: 0; }
.iucn-label { font-size: 10px; color: #706050; }

.sidebar-footer { margin-top: auto; padding: 10px 12px 12px; border-top: 0.5px solid rgba(0,0,0,0.08); flex-shrink: 0; }
.footer-label { font-size: 9px; letter-spacing: 0.8px; text-transform: uppercase; color: #b0a090; margin-bottom: 4px; }
.footer-source { font-size: 10px; color: #a09080; }
</style>
