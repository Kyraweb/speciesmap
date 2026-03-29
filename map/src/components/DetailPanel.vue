<template>
  <transition name="slide">
    <div class="detail" v-if="species">
      <div class="dheader">
        <span class="dheadtitle">Species detail</span>
        <button class="xbtn" @click="$emit('close')">✕</button>
      </div>
      <div class="dbody">
        <div class="dname">{{ species.display_name || species.common_name || species.scientific_name }}</div>
        <div class="dlatin" v-if="species.common_name">{{ species.scientific_name }}</div>
        <div class="dtags">
          <span v-if="species.iucn_status" class="tag" :style="iucnStyle(species.iucn_status)">
            {{ species.iucn_status }} {{ iucnLabel(species.iucn_status) }}
          </span>
          <span class="tag class-tag">{{ species.class }}</span>
        </div>
        <div class="drow">
          <span class="dlabel">Sightings</span>
          <span class="dval">{{ species.individual_count ?? 1 }} recorded</span>
        </div>
        <div class="drow">
          <span class="dlabel">Country</span>
          <span class="dval">{{ species.country ?? '—' }}</span>
        </div>
        <div class="drow">
          <span class="dlabel">Last seen</span>
          <span class="dval">{{ formatDate(species.observed_at) }}</span>
        </div>
        <div class="drow">
          <span class="dlabel">Coordinates</span>
          <span class="dval">{{ species.lat?.toFixed(3) }}, {{ species.lng?.toFixed(3) }}</span>
        </div>
        <div class="drow">
          <span class="dlabel">Source</span>
          <span class="dval">GBIF</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
defineProps({ species: { type: Object, default: null } })
defineEmits(['close'])

const IUCN = {
  CR: { label: 'Critically endangered', bg: '#fde8e8', color: '#c02020' },
  EN: { label: 'Endangered',            bg: '#fdeede', color: '#c05010' },
  VU: { label: 'Vulnerable',            bg: '#fdf8dc', color: '#a08010' },
  NT: { label: 'Near threatened',       bg: '#f5f5dc', color: '#806010' },
  LC: { label: 'Least concern',         bg: '#eaf3de', color: '#3a6818' },
  DD: { label: 'Data deficient',        bg: '#f1efe8', color: '#a09080' },
}

function iucnStyle(code) {
  const s = IUCN[code] ?? { bg: '#f1efe8', color: '#a09080' }
  return { background: s.bg, color: s.color }
}

function iucnLabel(code) {
  return IUCN[code]?.label ?? ''
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}
</script>

<style scoped>
.detail {
  position: absolute;
  top: 0;
  right: 0;
  width: 260px;
  height: 100%;
  background: var(--color-bg-panel);
  border-left: 0.5px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 10;
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-enter-from, .slide-leave-to {
  transform: translateX(100%);
}
.dheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  border-bottom: 0.5px solid var(--color-border);
  background: var(--color-bg-sidebar);
  flex-shrink: 0;
}
.dheadtitle { font-size: 12px; color: var(--color-text-muted); }
.xbtn {
  width: 24px; height: 24px;
  border-radius: 4px;
  border: 0.5px solid var(--color-border);
  background: rgba(0,0,0,0.04);
  cursor: pointer;
  font-size: 12px;
  color: var(--color-text-muted);
}
.dbody {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow-y: auto;
  flex: 1;
}
.dname {
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--color-text-primary);
  text-shadow: 0 0 8px rgba(176, 88, 40, 0.3), 0 0 20px rgba(176, 88, 40, 0.12);
  margin-bottom: 3px;
  line-height: 1.3;
}
.dlatin {
  font-size: 11px;
  color: var(--color-text-muted);
  font-style: italic;
  margin-bottom: 10px;
}
.dtags { display: flex; gap: 5px; margin-bottom: 12px; flex-wrap: wrap; }
.tag { font-size: 10px; padding: 3px 7px; border-radius: 3px; }
.class-tag { background: var(--color-bg-card); color: var(--color-text-secondary); }
.drow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 0.5px solid var(--color-border);
  font-size: 12px;
}
.dlabel { color: var(--color-text-muted); }
.dval { color: var(--color-text-primary); font-weight: 500; text-align: right; max-width: 150px; }
</style>
