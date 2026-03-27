<template>
  <div class="sidebar">
    <div class="section">
      <div class="slabel">Animal class</div>
      <div
        v-for="cls in classes"
        :key="cls.key"
        class="frow"
        :class="{ on: selectedClass === cls.key || selectedClass === null }"
        @click="toggleClass(cls.key)"
      >
        <span class="dot" :style="{ background: cls.color }"></span>
        <span class="fname">{{ cls.label }}</span>
      </div>
    </div>

    <div class="section">
      <div class="slabel">Conservation status</div>
      <div v-for="s in statuses" :key="s.code" class="irow">
        <span class="ibadge" :style="{ background: s.bg, color: s.color }">{{ s.code }}</span>
        <span class="fname">{{ s.label }}</span>
      </div>
    </div>

    <div class="section">
      <div class="slabel">Overlays</div>
      <div v-for="ov in overlays" :key="ov.key" class="vrow" :class="{ on: ov.active }" @click="ov.active = !ov.active">
        <span class="fname">{{ ov.label }}</span>
      </div>
    </div>

    <div class="bottom">
      <div class="statpill">
        <div class="statnum">{{ sightingCount.toLocaleString() }}</div>
        <div class="statdesc">sightings loaded</div>
      </div>
      <div class="statpill">
        <div class="statnum">{{ speciesCount.toLocaleString() }}</div>
        <div class="statdesc">species tracked</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  selectedClass:  { type: String,  default: null },
  sightingCount:  { type: Number,  default: 0 },
  speciesCount:   { type: Number,  default: 0 },
})

const emit = defineEmits(['filter-class'])

const classes = [
  { key: 'Mammalia',  label: 'Mammals',    color: '#b05828' },
  { key: 'Aves',      label: 'Birds',      color: '#4880a8' },
  { key: 'Reptilia',  label: 'Reptiles',   color: '#6a9848' },
  { key: 'Amphibia',  label: 'Amphibians', color: '#8858b0' },
]

const statuses = [
  { code: 'CR', label: 'Critically endangered', bg: '#fde8e8', color: '#c02020' },
  { code: 'EN', label: 'Endangered',            bg: '#fdeede', color: '#c05010' },
  { code: 'VU', label: 'Vulnerable',            bg: '#fdf8dc', color: '#a08010' },
  { code: 'LC', label: 'Least concern',         bg: '#eaf3de', color: '#3a6818' },
]

const overlays = reactive([
  { key: 'sightings',  label: 'Sightings',         active: true  },
  { key: 'migration',  label: 'Migration routes',  active: false },
  { key: 'range',      label: 'Species range',     active: false },
  { key: 'heatmap',    label: 'Heatmap',           active: false },
])

function toggleClass(key) {
  emit('filter-class', props.selectedClass === key ? null : key)
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  background: var(--color-bg-sidebar);
  border-right: 0.5px solid var(--color-border);
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  height: 100%;
}
.section { display: flex; flex-direction: column; gap: 2px; }
.slabel {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.9px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.frow {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.frow.on { background: rgba(0,0,0,0.05); }
.dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.fname { font-size: 12px; color: var(--color-text-secondary); flex: 1; }
.irow { display: flex; align-items: center; gap: 7px; padding: 3px 6px; }
.ibadge {
  font-size: 9px;
  font-weight: 500;
  padding: 2px 5px;
  border-radius: 3px;
  min-width: 22px;
  text-align: center;
}
.vrow {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.vrow.on { background: rgba(0,0,0,0.05); }
.bottom {
  margin-top: auto;
  padding-top: 12px;
  border-top: 0.5px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.statpill {
  background: rgba(0,0,0,0.04);
  border: 0.5px solid rgba(0,0,0,0.08);
  border-radius: 4px;
  padding: 7px 9px;
}
.statnum {
  font-size: 17px;
  font-weight: 500;
  color: var(--color-reptile);
  text-shadow: var(--glow-stat);
  line-height: 1;
}
.statdesc { font-size: 10px; color: var(--color-text-muted); margin-top: 2px; }
</style>
