<template>
  <transition name="slide">
    <div class="detail-panel" v-if="species">

      <div class="dp-header">
        <button class="back-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M9 2L5 7l4 5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
          Back
        </button>
        <button class="xbtn" @click="$emit('close')">✕</button>
      </div>

      <div v-if="loading" class="dp-loading">Loading...</div>

      <div v-else-if="detail" class="dp-body">

        <!-- Species name -->
        <div class="dp-name-block">
          <div class="dp-class-dot" :style="{ background: classColor }"></div>
          <div>
            <div class="dp-name">{{ detail.detail?.display_name || species.display_name }}</div>
            <div class="dp-latin">{{ detail.detail?.scientific_name || species.scientific_name }}</div>
          </div>
        </div>

        <!-- IUCN + class -->
        <div class="dp-badges">
          <span v-if="detail.detail?.iucn_status" class="dp-badge" :style="iucnStyle(detail.detail.iucn_status)">
            {{ detail.detail.iucn_status }} — {{ iucnLabel(detail.detail.iucn_status) }}
          </span>
          <span class="dp-class-badge">{{ detail.detail?.class }}</span>
        </div>

        <!-- Stats -->
        <div class="dp-stats">
          <div class="dp-stat">
            <div class="dp-stat-num">{{ fmt(detail.detail?.sighting_count) }}</div>
            <div class="dp-stat-lbl">sightings</div>
          </div>
          <div class="dp-stat">
            <div class="dp-stat-num">{{ firstYear }}</div>
            <div class="dp-stat-lbl">first recorded</div>
          </div>
          <div class="dp-stat">
            <div class="dp-stat-num">{{ lastYear }}</div>
            <div class="dp-stat-lbl">last recorded</div>
          </div>
        </div>

        <!-- Yearly trend chart -->
        <div class="dp-section" v-if="trendData.length">
          <div class="dp-section-label">Sightings over time</div>
          <div class="trend-bars">
            <div v-for="t in trendData" :key="t.year" class="t-bar-wrap" :title="`${t.year}: ${t.count}`">
              <div class="t-bar" :style="{ height: t.pct + '%', background: classColor }"></div>
            </div>
          </div>
          <div class="trend-labels">
            <span>{{ trendData[0]?.year }}</span>
            <span>{{ trendData[Math.floor(trendData.length/2)]?.year }}</span>
            <span>{{ trendData[trendData.length-1]?.year }}</span>
          </div>
        </div>

        <!-- Seasonal chart -->
        <div class="dp-section" v-if="seasonalData.length">
          <div class="dp-section-label">Monthly activity</div>
          <div class="seasonal-bars">
            <div v-for="m in seasonalData" :key="m.month" class="s-bar-wrap">
              <div class="s-bar" :style="{ height: m.pct + '%', background: classColor }"></div>
            </div>
          </div>
          <div class="seasonal-labels">
            <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span>
            <span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
          </div>
        </div>

        <!-- Taxonomy -->
        <div class="dp-section">
          <div class="dp-section-label">Taxonomy</div>
          <div class="dp-tax">
            <div class="tax-row" v-if="detail.detail?.order_name"><span>Order</span><span>{{ detail.detail.order_name }}</span></div>
            <div class="tax-row" v-if="detail.detail?.family"><span>Family</span><span>{{ detail.detail.family }}</span></div>
            <div class="tax-row"><span>Species</span><span class="tax-italic">{{ detail.detail?.scientific_name }}</span></div>
          </div>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useApi } from '../composables/useApi'

const props = defineProps({
  species: { type: Object, default: null }
})
defineEmits(['close'])

const { get } = useApi()
const detail  = ref(null)
const loading = ref(false)

const CLASS_COLORS = {
  Mammalia: '#b05828', Aves: '#4880a8', Reptilia: '#6a9848', Amphibia: '#8858b0'
}

const IUCN_STYLES = {
  CR: { background: '#fde8e8', color: '#c02020' },
  EN: { background: '#fdeede', color: '#c05010' },
  VU: { background: '#fdf8dc', color: '#a08010' },
  NT: { background: '#f5f5dc', color: '#806010' },
  LC: { background: '#eaf3de', color: '#3a6818' },
}

const IUCN_LABELS = {
  CR: 'Critically endangered', EN: 'Endangered', VU: 'Vulnerable',
  NT: 'Near threatened', LC: 'Least concern', DD: 'Data deficient'
}

function iucnStyle(code) { return IUCN_STYLES[code] ?? { background: '#f1efe8', color: '#a09080' } }
function iucnLabel(code) { return IUCN_LABELS[code] ?? code }

function fmt(n) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return n.toLocaleString()
}

const classColor = computed(() => CLASS_COLORS[detail.value?.detail?.class] ?? '#6a9848')

const firstYear = computed(() => {
  const d = detail.value?.detail?.first_seen
  return d ? new Date(d).getFullYear() : '—'
})

const lastYear = computed(() => {
  const d = detail.value?.detail?.last_seen
  return d ? new Date(d).getFullYear() : '—'
})

const trendData = computed(() => {
  const t = detail.value?.trend ?? []
  const max = Math.max(...t.map(x => x.count), 1)
  return t.map(x => ({ ...x, pct: Math.round((x.count / max) * 100) }))
})

const seasonalData = computed(() => {
  const monthly = Array(12).fill(0)
  ;(detail.value?.seasonal ?? []).forEach(s => {
    if (s.month >= 1 && s.month <= 12) monthly[s.month - 1] += s.count
  })
  const max = Math.max(...monthly, 1)
  return monthly.map((count, i) => ({ month: i + 1, count, pct: Math.round((count / max) * 100) }))
})

watch(() => props.species, async (sp) => {
  if (!sp) return
  loading.value = true
  detail.value  = null
  try {
    detail.value = await get(`/api/species/${sp.id}`)
  } catch (e) {
    console.error('Failed to load species detail:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-panel {
  position: absolute;
  top: 0; right: 0;
  width: 270px; height: 100%;
  background: #f0ece0;
  border-left: 0.5px solid rgba(0,0,0,0.09);
  display: flex; flex-direction: column;
  z-index: 10; overflow: hidden;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.08);
  background: #e8e4d8; flex-shrink: 0;
}

.back-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #b05828; background: none; border: none;
  cursor: pointer; font-family: inherit;
}

.xbtn {
  width: 22px; height: 22px; border-radius: 4px;
  border: 0.5px solid rgba(0,0,0,0.1);
  background: rgba(0,0,0,0.04); cursor: pointer;
  font-size: 11px; color: #908070;
}

.dp-loading { padding: 20px; font-size: 12px; color: #a09080; text-align: center; }

.dp-body { overflow-y: auto; flex: 1; padding: 14px; display: flex; flex-direction: column; gap: 14px; }

.dp-name-block { display: flex; gap: 10px; align-items: flex-start; }
.dp-class-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
.dp-name { font-family: Georgia, serif; font-size: 16px; color: #2a2418; line-height: 1.25; }
.dp-latin { font-size: 11px; color: #a09080; font-style: italic; margin-top: 2px; }

.dp-badges { display: flex; flex-wrap: wrap; gap: 5px; }
.dp-badge { font-size: 10px; padding: 3px 8px; border-radius: 4px; }
.dp-class-badge { font-size: 10px; padding: 3px 8px; border-radius: 4px; background: rgba(0,0,0,0.06); color: #706050; }

.dp-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: rgba(0,0,0,0.08); border-radius: 6px; overflow: hidden;
}
.dp-stat { background: #e8e4d8; padding: 8px 6px; text-align: center; }
.dp-stat-num { font-size: 14px; color: #6a9848; text-shadow: 0 0 8px rgba(106,152,72,0.3); line-height: 1; }
.dp-stat-lbl { font-size: 9px; color: #a09080; margin-top: 2px; }

.dp-section { display: flex; flex-direction: column; gap: 7px; }
.dp-section-label { font-size: 10px; font-weight: 500; letter-spacing: 0.8px; color: #a09080; text-transform: uppercase; }

.trend-bars { display: flex; gap: 2px; align-items: flex-end; height: 40px; }
.t-bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.t-bar { width: 100%; border-radius: 1px 1px 0 0; min-height: 2px; opacity: 0.8; }
.trend-labels { display: flex; justify-content: space-between; font-size: 9px; color: #b0a090; }

.seasonal-bars { display: flex; gap: 2px; align-items: flex-end; height: 36px; }
.s-bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.s-bar { width: 100%; border-radius: 1px 1px 0 0; min-height: 2px; opacity: 0.75; }
.seasonal-labels { display: flex; justify-content: space-between; font-size: 9px; color: #b0a090; }

.dp-tax { display: flex; flex-direction: column; gap: 5px; }
.tax-row { display: flex; justify-content: space-between; font-size: 11px; }
.tax-row span:first-child { color: #a09080; }
.tax-row span:last-child { color: #2a2418; }
.tax-italic { font-style: italic; }
</style>
