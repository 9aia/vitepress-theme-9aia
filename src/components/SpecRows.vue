<script setup lang="ts">
import type { SpecRow } from "./types.ts";

defineProps<{ rows: SpecRow[] }>();
</script>

<template>
  <dl class="spec-rows">
    <div v-for="r in rows" :key="r.title" class="row">
      <dt class="term">{{ r.title }}</dt>
      <dd class="def" v-html="r.details" />
    </div>
  </dl>
</template>

<style scoped>
.spec-rows {
  margin: 0;
}

.row {
  display: grid;
  gap: 4px;
  padding: 0.75rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.row:first-child {
  border-top: none;
  padding-top: 0;
}

.term {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--vp-c-text-1);
}

.def {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}

@media (min-width: 40rem) {
  .row {
    grid-template-columns: 17rem 1fr;
    gap: 1.5rem;
    align-items: baseline;
  }
}
</style>
