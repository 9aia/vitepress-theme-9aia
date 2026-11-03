<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(defineProps<{ lines: string[]; label?: string; stream?: boolean }>(), {
  label: "$ tail -f wire",
  stream: true,
});

const shown = ref(props.lines.length);
let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  if (!props.stream) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  shown.value = 0;
  timer = setInterval(() => {
    shown.value++;
    if (shown.value >= props.lines.length && timer) clearInterval(timer);
  }, 380);
});

onUnmounted(() => timer && clearInterval(timer));
</script>

<template>
  <aside class="wire" aria-label="wire transcript">
    <p class="wire-label">{{ label }}</p>
    <pre
      class="wire-log"
    ><code><template v-for="(l, i) in lines" :key="i"><span v-if="i < shown">{{ l + '\n' }}</span></template><span class="cursor">▍</span></code></pre>
  </aside>
</template>

<style scoped>
.wire {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--radius-lg, 1.25rem);
  background: var(--vp-c-bg-soft);
  padding: 1rem 1.25rem;
  overflow: hidden;
}

.wire-label {
  margin: 0 0 0.625rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  color: var(--vp-c-text-3);
}

.wire-log {
  margin: 0;
}

.wire-log code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.72rem;
  line-height: 1.95;
  color: var(--vp-c-text-2);
  white-space: pre-wrap;
  word-break: break-all;
}

.cursor {
  color: var(--vp-c-brand-1);
  animation: wire-blink 1.2s steps(1) infinite;
}

@keyframes wire-blink {
  50% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    animation: none;
  }
}
</style>
