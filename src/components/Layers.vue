<script setup lang="ts">
import Specimen from "./Specimen.vue";
import type { LayerItem } from "./types.ts";

defineProps<{ layers: LayerItem[] }>();
</script>

<template>
  <div class="layers">
    <div v-for="layer in layers" :key="layer.name" class="layer">
      <span class="stratum" aria-hidden="true" />
      <div class="cell">
        <div class="head">
          <span class="name"><Specimen :name="layer.name" />{{ layer.name }}</span>
          <span class="engines" v-if="layer.engines?.length">
            <code v-for="e in layer.engines" :key="e" class="engine">{{ e }}</code>
          </span>
        </div>
        <p class="role">{{ layer.role }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layers {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-lg, 1.25rem);
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.layer {
  display: flex;
  align-items: stretch;
  transition: background 0.15s ease;
}

.layer + .layer {
  border-top: 1px solid var(--vp-c-divider);
}

.layer:hover {
  background: var(--vp-c-bg);
}

.stratum {
  flex: none;
  width: var(--stratum-width, 4px);
  background: var(--vp-c-brand-1);
}

/* depth: later layers sit deeper, so opacity ramps down the stack */
.layer:nth-child(1) .stratum {
  opacity: 0.35;
}

.layer:nth-child(2) .stratum {
  opacity: 0.55;
}

.layer:nth-child(3) .stratum {
  opacity: 0.75;
}

.layer:nth-child(n + 4) .stratum {
  opacity: 1;
}

.cell {
  flex: 1;
  min-width: 0;
  padding: 0.875rem 1.125rem;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cell .name {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
}

.engines {
  display: inline-flex;
  gap: 6px;
  flex-wrap: wrap;
}

.engines .engine {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.cell .role {
  margin: 4px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
}
</style>
