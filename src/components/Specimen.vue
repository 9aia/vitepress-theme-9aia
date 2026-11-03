<script setup lang="ts">
const props = defineProps<{ name: string }>();

// Deterministic organic blob per name — each organism its own silhouette.
function specimen(name: string): string {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rnd = () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const n = 9;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 6 + rnd() * 4.5;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const mid = (i: number) => [
    (pts[i][0] + pts[(i + 1) % n][0]) / 2,
    (pts[i][1] + pts[(i + 1) % n][1]) / 2,
  ];
  let d = `M ${mid(n - 1)[0].toFixed(2)} ${mid(n - 1)[1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    d += ` Q ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} ${mid(i)[0].toFixed(2)} ${mid(i)[1].toFixed(2)}`;
  }
  return d + " Z";
}

const d = specimen(props.name);
</script>

<template>
  <svg class="specimen" viewBox="-12 -12 24 24" aria-hidden="true">
    <path :d="d" />
  </svg>
</template>

<style scoped>
.specimen {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
  stroke-width: 1.2;
}
</style>
