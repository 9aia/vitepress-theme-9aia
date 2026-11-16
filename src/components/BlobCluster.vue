<script setup lang="ts">
import { ref } from "vue";
import { useMetablobs, type MetablobColor } from "./useMetablobs.ts";

// A "species" cluster — a small single-hue metaball field in a rounded
// card. Several can appear per page, so the field runs cheap: fewer
// blobs, capped DPR, reduced resolution, no pointer interaction.
// `contain` keeps blob centers inside a safe margin so metaballs read
// as trapped in the card rather than sliced by its edge, and
// `sizeVariety` mixes large and small blobs inside the field. The
// default slot renders an optional mono caption inside the card.
const props = withDefaults(
  defineProps<{
    color?: MetablobColor;
    count?: number;
    radius?: "a" | "b" | "c";
  }>(),
  { color: "periwinkle", count: 12, radius: "a" },
);

const canvas = ref<HTMLCanvasElement | null>(null);
useMetablobs(canvas, {
  count: props.count,
  colors: props.color,
  maxDpr: 1.5,
  resolutionScale: 0.6,
  interactive: false,
  contain: true,
  sizeVariety: 0.45,
});
</script>

<template>
  <div class="blob-cluster" :class="`blob-cluster--${radius}`">
    <canvas ref="canvas" class="blob-cluster-canvas" aria-hidden="true" />
    <p v-if="$slots.default" class="blob-cluster-label"><slot /></p>
  </div>
</template>

<style scoped>
.blob-cluster {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
}

.blob-cluster--a {
  border-radius: var(--radius-blob-a);
}
.blob-cluster--b {
  border-radius: var(--radius-blob-b);
}
.blob-cluster--c {
  border-radius: var(--radius-blob-c);
}

.blob-cluster-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.9;
  pointer-events: none;
}

.blob-cluster-label {
  position: absolute;
  left: 0.75rem;
  bottom: 0.625rem;
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
}
</style>
