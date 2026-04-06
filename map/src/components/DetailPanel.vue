<template>
  <transition name="slide">
    <div class="detail-panel" v-if="species">
      <div class="dp-header">
        <button class="back-btn" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M9 2L5 7l4 5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/>
          </svg>
          Back
        </button>
        <button class="xbtn" @click="$emit('close')">✕</button>
      </div>

      <div v-if="loading" class="dp-loading">
        <div class="dp-spinner"></div>
        Loading...
      </div>

      <div v-else-if="detail" class="dp-body">

        <!-- Photo -->
        <div class="dp-photo-wrap">
          <img
            v-if="photoUrl"
            :src="photoUrl"
            :alt="detail.display_name"
            class="dp-photo"
            @error="photoUrl = null"
          />
          <div v-else class="dp-photo-placeholder">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 8C11.6 8 8 11.6 8 16C8 20.4 11.6 24 16 24C20.4 24 24 20.4 24 16C24 11.6 20.4 8 16 8Z" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>
              <circle cx="16" cy="16" r="3" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>
          <!-- IUCN badge over photo -->
          <div v-if="detail.iucn_status" class="dp-iucn-overlay" :style="iucnStyle(detail.iucn_status)">
            {{ detail.iucn_status }} — {{ iucnLabel(detail.iucn_status) }}
          </div>
        </div>

        <!-- Name block -->
        <div class="dp-name-block">
          <div class="dp-class-pill" :style="{ background: classColor + '22', color: classColor }">
            {{ detail.class }}
          </div>
          <div class="dp-name">{{ detail.display_name }}</div>
          <div class="dp-latin" v-if="detail.common_name">{{ detail.scientific_name }}</div>
        </div>

        <!-- Stats row -->
        <div class="dp-stats">
          <div class="dp-stat">
            <div class="dp-stat-num">{{ fmt(detail.sighting_count) }}</div>
            <div class="dp-stat-lbl">Sightings</div>
          </div>
          <div class="dp-stat">
            <div class="dp-stat-num">{{ firstYear }}</div>
            <div class="dp-stat-lbl">First seen</div>
          </div>
          <div class="dp-stat">
            <div class="dp-stat-num">{{ lastYear }}</div>
            <div class="dp-stat-lbl">Last seen</div>
          </div>
        </div>

        <!-- Description -->
        <div class="dp-section" v-if="detail.description">
          <div class="dp-section-label">
            <svg width="11" height="11" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="6" y1="5" x2="6" y2="9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="6" cy="3.5" r="0.7" fill="currentColor"/></svg>
            Overview
          </div>
          <div class="dp-description">{{ detail.description }}</div>
        </div>

        <!-- Observation trend -->
        <div class="dp-section" v-if="trendData.length">
          <div class="dp-section-label">
            <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="1,9 4,5 7,7 11,2" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Observation trend
          </div>
          <div class="dp-section-sub">Annual sighting frequency</div>
          <div class="trend-area">
            <svg :viewBox="`0 0 ${trendData.length * 8} 40`" preserveAspectRatio="none" class="trend-svg">
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="classColor" stop-opacity="0.4"/>
                  <stop offset="100%" :stop-color="classColor" stop-opacity="0.05"/>
                </linearGradient>
              </defs>
              <polygon :points="trendAreaPoints" :fill="`url(#trendGrad)`"/>
              <polyline :points="trendLinePoints" :stroke="classColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="trend-labels">
            <span>{{ trendData[0]?.year }}</span>
            <span>Annual sightings</span>
            <span>{{ trendData[trendData.length - 1]?.year }}</span>
          </div>
        </div>

        <!-- Activity cycle -->
        <div class="dp-section" v-if="hasSeasonalData">
          <div class="dp-section-label">
            <svg width="11" height="11" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.2" fill="none"/><line x1="4" y1="1" x2="4" y2="0" stroke="currentColor" stroke-width="1.2"/><line x1="8" y1="1" x2="8" y2="0" stroke="currentColor" stroke-width="1.2"/></svg>
            Activity cycle
          </div>
          <div class="dp-section-sub">Peak seasonal presence</div>
          <div class="seasonal-bars">
            <div v-for="m in seasonalData" :key="m.month" class="s-bar-wrap">
              <div
                class="s-bar"
                :style="{
                  height: m.pct + '%',
                  background: m.isPeak ? classColor : classColor + '55'
                }"
              ></div>
            </div>
          </div>
          <div class="seasonal-labels">
            <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span>
            <span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
          </div>
          <div class="peak-label" v-if="peakMonths">
            <svg width="10" height="10" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4" fill="currentColor" opacity="0.5"/></svg>
            Peak: {{ peakMonths }}
          </div>
        </div>

        <!-- Classification -->
        <div class="dp-section">
          <div class="dp-section-label">
            <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 2h8M2 6h6M2 10h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
            Classification
          </div>
          <div class="dp-tax">
            <div class="tax-row" v-if="detail.order_name">
              <span class="tax-key">Order</span>
              <span class="tax-val">{{ detail.order_name }}</span>
            </div>
            <div class="tax-row" v-if="detail.family">
              <span class="tax-key">Family</span>
              <span class="tax-val">{{ detail.family }}</span>
            </div>
            <div class="tax-row" v-if="detail.genus">
              <span class="tax-key">Genus</span>
              <span class="tax-val italic">{{ detail.genus }}</span>
            </div>
            <div class="tax-row">
              <span class="tax-key">Species</span>
              <span class="tax-val italic">{{ detail.scientific_name }}</span>
            </div>
          </div>
        </div>

        <!-- Conservation block -->
        <div class="dp-conservation" v-if="detail.iucn_status" :style="conservationStyle">
          <div class="cons-top">
            <span class="cons-label">Conservation</span>
            <span class="cons-badge" :style="iucnStyle(detail.iucn_status)">{{ detail.iucn_status }}</span>
          </div>
          <div class="cons-name">{{ iucnLabel(detail.iucn_status) }}</div>
          <div class="cons-bar">
            <div class="cons-bar-fill" :style="{ width: iucnBarWidth(detail.iucn_status) + '%', background: iucnStyle(detail.iucn_status).color }"></div>
          </div>
        </div>

        <!-- Wikipedia link -->
        <div class="dp-wiki" v-if="detail.wikipedia_url">
          <a :href="detail.wikipedia_url" target="_blank" rel="noopener">
            Read more on Wikipedia →
          </a>
        </div>

      </div>

      <div v-else-if="!loading" class="dp-loading">No data available</div>
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
const detail   = ref(null)
const rawData  = ref(null)
const loading  = ref(false)
const photoUrl = ref(null)

let abortController = null

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']

const CLASS_COLORS = {
  Mammalia: '#b05828', Reptilia: '#6a9848', Amphibia: '#8858b0', Aves: '#4880a8'
}

const IUCN_STYLES = {
  CR: { background: '#fde8e8', color: '#c02020' },
  EN: { background: '#fdeede', color: '#c05010' },
  VU: { background: '#fdf8dc', color: '#a08010' },
  NT: { background: '#f5f5dc', color: '#806010' },
  LC: { background: '#eaf3de', color: '#3a6818' },
}

const IUCN_LABELS = {
  CR: 'Critically Endangered', EN: 'Endangered', VU: 'Vulnerable',
  NT: 'Near Threatened',       LC: 'Least Concern', DD: 'Data Deficient'
}

function iucnStyle(code)  { return IUCN_STYLES[code] ?? { background: '#f1efe8', color: '#a09080' } }
function iucnLabel(code)  { return IUCN_LABELS[code] ?? code }
function iucnBarWidth(code) {
  return { CR: 95, EN: 75, VU: 55, NT: 38, LC: 18, DD: 30 }[code] ?? 20
}

function fmt(n) {
  if (!n) return '—'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'k'
  return n.toLocaleString()
}

const classColor = computed(() => CLASS_COLORS[detail.value?.class] ?? '#6a9848')

const conservationStyle = computed(() => {
  const s = iucnStyle(detail.value?.iucn_status)
  return { background: s.background + '88', borderColor: s.color + '44' }
})

const trendData = computed(() => {
  const t   = rawData.value?.trend ?? []
  const max = Math.max(...t.map(x => x.count), 1)
  return t.map(x => ({ ...x, pct: Math.round((x.count / max) * 100) }))
})

const trendLinePoints = computed(() => {
  const d = trendData.value
  if (!d.length) return ''
  const w = d.length * 8
  return d.map((t, i) => `${(i / (d.length - 1)) * (w - 2) + 1},${40 - (t.pct / 100) * 36}`).join(' ')
})

const trendAreaPoints = computed(() => {
  const d = trendData.value
  if (!d.length) return ''
  const w = d.length * 8
  const line = d.map((t, i) => `${(i / (d.length - 1)) * (w - 2) + 1},${40 - (t.pct / 100) * 36}`).join(' ')
  return `1,40 ${line} ${w - 1},40`
})

const seasonalData = computed(() => {
  const monthly = Array(12).fill(0)
  ;(rawData.value?.seasonal ?? []).forEach(s => {
    if (s.month >= 1 && s.month <= 12) monthly[s.month - 1] += s.count
  })
  const max   = Math.max(...monthly, 1)
  const threshold = max * 0.7
  return monthly.map((count, i) => ({
    month: i + 1,
    count,
    pct:    Math.round((count / max) * 100),
    isPeak: count >= threshold
  }))
})

const hasSeasonalData = computed(() => seasonalData.value.some(m => m.count > 0))

const peakMonths = computed(() => {
  const peaks = seasonalData.value
    .filter(m => m.isPeak && m.count > 0)
    .map(m => MONTH_NAMES[m.month - 1].slice(0, 3))
  if (!peaks.length) return null
  if (peaks.length === 1) return peaks[0]
  return `${peaks[0]} — ${peaks[peaks.length - 1]}`
})

const firstYear = computed(() => trendData.value[0]?.year ?? '—')
const lastYear  = computed(() => trendData.value[trendData.value.length - 1]?.year ?? '—')

async function fetchPhoto(speciesId) {
  photoUrl.value = null
  try {
    const resp = await get(`/api/species/${speciesId}/photo`)
    photoUrl.value = resp.photo_url || null
  } catch (e) {
    // No photo available
  }
}

watch(() => props.species, async (sp) => {
  if (abortController) abortController.abort()

  const speciesId = sp?.id || sp?.species_id
  if (!sp || !speciesId) {
    detail.value  = null
    rawData.value = null
    photoUrl.value = null
    return
  }

  abortController  = new AbortController()
  loading.value    = true
  detail.value     = null
  rawData.value    = null
  photoUrl.value   = null

  try {
    const resp    = await get(`/api/species/${String(speciesId)}`)
    rawData.value = resp
    detail.value  = resp.detail

    // Fetch photo (non-blocking — updates when ready)
    if (resp.detail?.photo_url) {
      photoUrl.value = resp.detail.photo_url
    } else {
      fetchPhoto(String(speciesId))
    }
  } catch (e) {
    if (e.name !== 'AbortError') console.error('Failed to load species detail:', e)
  } finally {
    loading.value = false
  }
}, { immediate: true })
</script>

<style scoped>
.detail-panel {
  position: absolute; top: 0; right: 0;
  width: 290px; height: 100%;
  background: #f5f2ea;
  border-left: 0.5px solid rgba(0,0,0,0.09);
  display: flex; flex-direction: column;
  z-index: 10; overflow: hidden;
}

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-bottom: 0.5px solid rgba(0,0,0,0.08);
  background: #ece8dc; flex-shrink: 0;
}

.back-btn {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; color: #b05828; background: none; border: none;
  cursor: pointer; font-family: inherit; padding: 0;
}

.xbtn {
  width: 22px; height: 22px; border-radius: 4px;
  border: 0.5px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.04);
  cursor: pointer; font-size: 11px; color: #908070;
}

.dp-loading {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; font-size: 12px; color: #a09080;
}

.dp-spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid rgba(0,0,0,0.08); border-top-color: #6a9848;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.dp-body { overflow-y: auto; flex: 1; display: flex; flex-direction: column; }

/* Photo */
.dp-photo-wrap {
  position: relative; width: 100%; height: 160px;
  background: #e8e4d8; flex-shrink: 0; overflow: hidden;
}

.dp-photo {
  width: 100%; height: 100%; object-fit: cover;
  display: block;
}

.dp-photo-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #b0a090;
}

.dp-iucn-overlay {
  position: absolute; bottom: 8px; left: 8px;
  font-size: 10px; font-weight: 600; padding: 3px 8px;
  border-radius: 4px; letter-spacing: 0.3px;
}

/* Name */
.dp-name-block { padding: 14px 14px 10px; }

.dp-class-pill {
  display: inline-block; font-size: 9px; font-weight: 600;
  letter-spacing: 0.8px; text-transform: uppercase;
  padding: 3px 8px; border-radius: 3px; margin-bottom: 8px;
}

.dp-name  { font-family: Georgia, serif; font-size: 20px; color: #2a2418; line-height: 1.2; margin-bottom: 3px; }
.dp-latin { font-size: 12px; color: #a09080; font-style: italic; }

/* Stats */
.dp-stats {
  display: flex; margin: 0 14px 14px;
  background: #ece8dc; border-radius: 8px; overflow: hidden;
  border: 0.5px solid rgba(0,0,0,0.07);
}
.dp-stat { flex: 1; padding: 10px 8px; text-align: center; }
.dp-stat + .dp-stat { border-left: 0.5px solid rgba(0,0,0,0.08); }
.dp-stat-num { font-size: 15px; font-family: Georgia, serif; color: #2a2418; line-height: 1; }
.dp-stat-lbl { font-size: 9px; color: #a09080; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

/* Sections */
.dp-section { padding: 0 14px 14px; }
.dp-section-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 9px; font-weight: 600; letter-spacing: 1px;
  color: #a09080; text-transform: uppercase; margin-bottom: 4px;
}
.dp-section-sub { font-size: 10px; color: #b0a090; margin-bottom: 8px; margin-top: -2px; }

.dp-description {
  font-size: 12px; color: #4a3828; line-height: 1.7;
  background: #ece8dc; border-radius: 6px; padding: 10px 12px;
  font-style: italic; border-left: 2px solid rgba(176,88,40,0.3);
}

/* Trend chart */
.trend-area { width: 100%; height: 50px; margin-bottom: 4px; }
.trend-svg  { width: 100%; height: 100%; }
.trend-labels { display: flex; justify-content: space-between; font-size: 9px; color: #b0a090; }

/* Seasonal */
.seasonal-bars   { display: flex; gap: 3px; align-items: flex-end; height: 44px; margin-bottom: 4px; }
.s-bar-wrap      { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.s-bar           { width: 100%; border-radius: 2px 2px 0 0; min-height: 2px; transition: opacity 0.2s; }
.seasonal-labels { display: flex; justify-content: space-between; font-size: 9px; color: #b0a090; margin-bottom: 6px; }

.peak-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; color: #706050;
  background: #ece8dc; padding: 5px 10px; border-radius: 12px;
  width: fit-content;
}

/* Taxonomy */
.dp-tax { background: #ece8dc; border-radius: 6px; overflow: hidden; }
.tax-row {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 7px 10px; font-size: 11px;
  border-bottom: 0.5px solid rgba(0,0,0,0.06);
}
.tax-row:last-child { border-bottom: none; }
.tax-key { color: #a09080; flex-shrink: 0; }
.tax-val { color: #2a2418; text-align: right; }
.italic  { font-style: italic; }

/* Conservation */
.dp-conservation {
  margin: 0 14px 14px; padding: 12px; border-radius: 8px;
  border: 0.5px solid;
}
.cons-top  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
.cons-label { font-size: 9px; font-weight: 600; letter-spacing: 1px; color: #a09080; text-transform: uppercase; }
.cons-badge { font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 3px; }
.cons-name  { font-size: 15px; font-family: Georgia, serif; color: #2a2418; margin-bottom: 8px; }
.cons-bar   { height: 4px; background: rgba(0,0,0,0.1); border-radius: 2px; overflow: hidden; }
.cons-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }

/* Wikipedia */
.dp-wiki { padding: 0 14px 20px; }
.dp-wiki a {
  font-size: 11px; color: #b05828; text-decoration: none;
  display: flex; align-items: center; gap: 4px;
}
.dp-wiki a:hover { text-decoration: underline; }
</style>
