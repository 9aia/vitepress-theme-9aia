<script setup lang="ts">
const props = defineProps<{ name: string }>();

// Generative taxonomy — each name deterministically yields one organism
// form (blob, spore, cell, hypha, ring). Diversity of form, like specimens.
function rng(name: string) {
  let h = 2166136261;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const P2 = Math.PI * 2;
const pt = (a: number, r: number): [number, number] => [Math.cos(a) * r, Math.sin(a) * r];

function blobPath(rnd: () => number): string {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => pt((i / n) * P2, 6 + rnd() * 4.5));
  const mid = (i: number) => [
    (pts[i][0] + pts[(i + 1) % n][0]) / 2,
    (pts[i][1] + pts[(i + 1) % n][1]) / 2,
  ];
  let d = `M ${mid(n - 1)[0].toFixed(2)} ${mid(n - 1)[1].toFixed(2)}`;
  for (let i = 0; i < n; i++)
    d += ` Q ${pts[i][0].toFixed(2)} ${pts[i][1].toFixed(2)} ${mid(i)[0].toFixed(2)} ${mid(i)[1].toFixed(2)}`;
  return d + " Z";
}

function sporePath(rnd: () => number): string {
  // radiating spore — ring of tapered rays around a small core
  const n = 7 + Math.floor(rnd() * 4);
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * P2 + rnd() * 0.3;
    const r1 = 3.5 + rnd() * 2;
    const r2 = 7.5 + rnd() * 3.5;
    const [x1, y1] = pt(a - 0.12, r1);
    const [x2, y2] = pt(a, r2);
    const [x3, y3] = pt(a + 0.12, r1);
    d += `M ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} Z `;
  }
  return d;
}

function cellPath(rnd: () => number): string {
  // cell: membrane blob + off-center nucleus
  const mem = blobPath(rnd);
  const [nx, ny] = pt(rnd() * P2, 2 + rnd() * 2);
  const nr = 1.6 + rnd() * 1.4;
  return (
    mem +
    ` M ${(nx + nr).toFixed(2)} ${ny.toFixed(2)} a ${nr.toFixed(2)} ${nr.toFixed(2)} 0 1 0 ${(-2 * nr).toFixed(2)} 0 a ${nr.toFixed(2)} ${nr.toFixed(2)} 0 1 0 ${(2 * nr).toFixed(2)} 0 Z`
  );
}

function hyphaPath(rnd: () => number): string {
  // mycelium — a branching filament
  let d = "";
  const walk = (x: number, y: number, a: number, len: number, depth: number) => {
    if (depth <= 0 || len < 2) return;
    const [nx, ny] = [x + Math.cos(a) * len, y + Math.sin(a) * len];
    d += `M ${x.toFixed(2)} ${y.toFixed(2)} Q ${(x + Math.cos(a + (rnd() - 0.5)) * len * 0.6).toFixed(2)} ${(y + Math.sin(a + (rnd() - 0.5)) * len * 0.6).toFixed(2)} ${nx.toFixed(2)} ${ny.toFixed(2)} `;
    walk(nx, ny, a + (rnd() - 0.5) * 1.1, len * 0.62, depth - 1);
    if (rnd() > 0.45)
      walk(nx, ny, a + (rnd() > 0.5 ? 1 : -1) * (0.7 + rnd() * 0.7), len * 0.5, depth - 1);
  };
  walk(-8 + rnd() * 3, 6 - rnd() * 3, -Math.PI / 3 + rnd(), 9, 4);
  return d;
}

function ringPath(rnd: () => number): string {
  // annular colony — dashes on a circle
  const n = 6 + Math.floor(rnd() * 5);
  const r = 7.5 + rnd() * 1.5;
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * P2;
    const [x, y] = pt(a, r);
    const s = 1 + rnd() * 1.2;
    d += `M ${(x + s).toFixed(2)} ${y.toFixed(2)} a ${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(-2 * s).toFixed(2)} 0 a ${s.toFixed(2)} ${s.toFixed(2)} 0 1 0 ${(2 * s).toFixed(2)} 0 Z `;
  }
  return d;
}

const FORMS = [blobPath, sporePath, cellPath, hyphaPath, ringPath] as const;

const rnd = rng(props.name);
const form = FORMS[Math.floor(rnd() * FORMS.length)];
const path = form(rnd);
const strokeForm = form === hyphaPath;
</script>

<template>
  <svg class="specimen" viewBox="-12 -12 24 24" aria-hidden="true">
    <path :d="path" :class="{ stroke: strokeForm }" />
  </svg>
</template>

<style scoped>
.specimen {
  display: inline-block;
  width: 1rem;
  height: 1rem;
}

.specimen path {
  fill: var(--vp-c-brand-soft);
  stroke: var(--vp-c-brand-1);
  stroke-width: 1;
}

.specimen path.stroke {
  fill: none;
  stroke-width: 1.1;
  stroke-linecap: round;
}
</style>
