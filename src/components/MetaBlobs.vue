<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMetablobs, type MetablobPalette } from "./useMetablobs.ts";

// `colors` accepts a pastel preset name ("mint", "periwinkle", ...), an
// rgb triple, or a list mixing both — a single entry renders the whole
// field in one hue. Omit for the default 6-hue mix. The hero layout
// passes a single pastel so the field reads as one organism.
const props = withDefaults(defineProps<{ colors?: MetablobPalette }>(), {
  colors: undefined,
});
const canvas = ref<HTMLCanvasElement | null>(null);

// Mount inside .VPHero so the absolute canvas covers the hero box;
// .main keeps z-index:10 so hero text stays above the blobs. This
// onMounted is registered before useMetablobs' own, so the canvas is
// already in place when the composable measures it.
onMounted(() => {
  document.querySelector(".VPHero")?.appendChild(canvas.value!);
});

// Mild radius variety keeps the hero field organic without breaking
// the single-hue read; full-bleed drift (no `contain`).
useMetablobs(canvas, { colors: props.colors, sizeVariety: 0.2 });
</script>

<template>
  <canvas ref="canvas" class="metablobs" aria-hidden="true" />
</template>

<style scoped>
.metablobs {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.9;
  pointer-events: none;
}
</style>
