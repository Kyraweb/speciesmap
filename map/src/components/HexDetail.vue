<template>
  <transition name="slide">
    <div class="hexdetail" v-if="hexIndex">
      <div class="hd-header">
        <span class="hd-title">Hex detail</span>
        <button class="xbtn" @click="$emit('close')">✕</button>
      </div>

      <div v-if="loading" class="hd-loading">Loading...</div>

      <div v-else-if="data" class="hd-body">
        <!-- Score -->
        <div class="hd-score-block">
          <div class="hd-score" :style="{ color: scoreColor(data.summary?.biodiversity_score) }">
            {{ Math.round(data.summary?.biodiversity_score || 0) }}
          </div>
          <div class="hd-score-label">biodiversity score</div>
        </div>

        <!-- Stats grid -->
        <div class="hd-stats">
          <div class="stat"><div class="stat-num">{{ data.summary?.species_count }}</div><div class="stat-lbl">species</div></div>
          <div class="stat"><div class="stat-num">{{ data.summary?.sighting_count?.toLocaleString() }}</div><div class="stat-lbl">sightings</div></div>
          <div class="stat"><div class="stat-num threatened">{{ data.summary?.threatened_count }}</div><div class="stat-lbl">threatened</div></div>
        </div>

        <!-- Class breakdown -->
        <div class="hd-section">
          <div class="hd-section-label">By class</div>
          <div class="class-bars">
            <div v-for="cls in classBreakdown" :key="cls.name" class="class-row">
              <span class="class-dot" :style="{ background: cls.color }"></span>
              <span class="class-name">{{ cls.name }}</span>
              <div class="class-bar-wrap">
                <div class="class-bar" :style="{ width: cls.pct + '%', background: cls.color }"></div>
              </div>
              <span class="class-count">{{ cls.count }}</span>
            </div>
          </div>
        </div>

        <!-- Top species -->
        <div class="hd-section">
          <div class="hd-section-label">Top species</div>
          <div class="species-list">
            <div v-for="sp in data.species?.slice(0, 8)" :key="sp.scientific_name" class="sp-row">
              <div class="sp-name">{{ sp.common_name || sp.scientific_name }}</div>
              <div class="sp-meta">
                <span v-if="sp.iucn_status" class="sp-badge" :style="iucnStyle(sp.iucn_status)">{{ sp.iucn_status }}</span>
                <span class="sp-count">{{ sp.sighting_count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Seasonal chart -->
        <div class="hd-section" v-if="seasonalData.length">
          <div class="hd-section-label">Monthly activity</div>
          <div class="seasonal-bars">
            <div v-for="m in seasonalData" :key="m.month" class="s-bar-wrap">
              <div class="s-bar" :style="{ height: m.pct + '%', background: '#6a9848' }"></div>
            </div>
          </div>
          <div class="seasonal-labels">
            <span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span>
            <span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span>
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
  hexIndex: { type: String, default: null }
})
defineEmits(['close'])

const { get } = useApi()
const data    = ref(null)
const loading = ref(false)

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

function scoreColor(score) {
  if (!score) return '#a09080'
  if (score < 15) return '#a09080'
  if (score < 25) return '#6a9848'
  if (score < 40) return '#567a38'
  return '#3a5820'
}

const classBreakdown = computed(() => {
  if (!data.value?.summary) return []
  const s = data.value.summary
  const total = (s.mammal_count || 0) + (s.reptile_count || 0) + (s.amphibian_count || 0)
  if (!total) return []
  return [
    { name: 'Mammals',    count: s.mammal_count,    color: '#b05828', pct: Math.round((s.mammal_count / total) * 100) },
    { name: 'Birds',      count: s.bird_count,      color: '#4880a8', pct: Math.round((s.bird_count / total) * 100) },
    { name: 'Reptiles',   count: s.reptile_count,   color: '#6a9848', pct: Math.round((s.reptile_count / total) * 100) },
    { name: 'Amphibians', count: s.amphibian_count, color: '#8858b0', pct: Math.round((s.amphibian_count / total) * 100) },
  ].filter(c => c.count > 0)
})

const seasonalData = computed(() => {
  if (!data.value?.seasonal) return []
  const monthly = Array(12).fill(0)
  data.value.seasonal.forEach(s => {
    if (s.month >= 1 && s.month <= 12) {
      monthly[s.month - 1] += s.sighting_count
    }
  })
  const max = Math.max(...monthly, 1)
  return monthly.map((count, i) => ({
    month: i + 1,
    count,
    pct: Math.round((count / max) * 100)
  }))
})

watch(() => props.hexIndex, async (newIndex) => {
  if (!newIndex) return
  loading.value = true
  data.value    = null
  try {
    data.value = await get(`/api/hex/${newIndex}`)
  } catch (e) {
    console.error('Failed to load hex detail:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hexdetail {
  position: absolute;
  top: 0; right: 0;
  width: 270px;
  height: 100%;
  background: #f0ece0;
  border-left: 0.5px solid rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  z-index: 10;
  overflow: hidden;
}

.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }

.hd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  border-bottom: 0.5px solid rgba(0,0,0,0.08);
  background: #e8e4d8;
  flex-shrink: 0;
}

.hd-title  { font-size: 12px; color: #a09080; }
.xbtn {
  width: 24px; height: 24px;
  border-radius: 4px;
  border: 0.5px solid rgba(0,0,0,0.1);
  background: rgba(0,0,0,0.04);
  cursor: pointer;
  font-size: 12px;
  color: #908070;
}

.hd-loading { padding: 20px; font-size: 12px; color: #a09080; text-align: center; }

.hd-body {
  overflow-y: auto;
  flex: 1;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hd-score-block { text-align: center; padding: 8px 0; }
.hd-score {
  font-family: Georgia, serif;
  font-size: 44px;
  line-height: 1;
  text-shadow: 0 0 12px currentColor;
}
.hd-score-label { font-size: 11px; color: #a09080; margin-top: 3px; }

.hd-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: rgba(0,0,0,0.08);
  border-radius: 6px;
  overflow: hidden;
}

.stat {
  background: #e8e4d8;
  padding: 9px 8px;
  text-align: center;
}

.stat-num {
  font-size: 16px;
  font-weight: 500;
  color: #6a9848;
  text-shadow: 0 0 8px rgba(106,152,72,0.4);
  line-height: 1;
}

.stat-num.threatened { color: #c05010; text-shadow: 0 0 8px rgba(192,80,16,0.4); }
.stat-lbl { font-size: 9px; color: #a09080; margin-top: 2px; }

.hd-section { display: flex; flex-direction: column; gap: 7px; }
.hd-section-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.8px;
  color: #a09080;
  text-transform: uppercase;
}

.class-bars { display: flex; flex-direction: column; gap: 5px; }
.class-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #706050;
}
.class-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.class-name { width: 70px; flex-shrink: 0; }
.class-bar-wrap {
  flex: 1;
  height: 4px;
  background: rgba(0,0,0,0.08);
  border-radius: 2px;
  overflow: hidden;
}
.class-bar { height: 100%; border-radius: 2px; transition: width 0.5s; }
.class-count { font-size: 10px; color: #a09080; width: 30px; text-align: right; }

.species-list { display: flex; flex-direction: column; gap: 2px; }
.sp-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 0.5px solid rgba(0,0,0,0.05);
  font-size: 11px;
}
.sp-name { color: #2a2418; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-meta { display: flex; align-items: center; gap: 5px; flex-shrink: 0; }
.sp-badge { font-size: 8px; padding: 1px 4px; border-radius: 2px; }
.sp-count { font-size: 10px; color: #a09080; }

.seasonal-bars {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 36px;
}
.s-bar-wrap { flex: 1; height: 100%; display: flex; align-items: flex-end; }
.s-bar { width: 100%; border-radius: 1px 1px 0 0; min-height: 2px; }
.seasonal-labels {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #b0a090;
  margin-top: 2px;
}
</style>
