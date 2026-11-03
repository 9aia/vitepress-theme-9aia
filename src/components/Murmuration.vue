<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = withDefaults(defineProps<{ count?: number }>(), { count: 64 });

const el = ref<HTMLCanvasElement>();
let raf = 0;
let ro: ResizeObserver | undefined;
let io: IntersectionObserver | undefined;

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

onMounted(() => {
  const canvas = el.value!;
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let w = 0;
  let h = 0;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.max(1, w * dpr);
    canvas.height = Math.max(1, h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const accent = getComputedStyle(canvas).getPropertyValue("--vp-c-brand-1").trim() || "#0000ff";

  const N = props.count;
  const boids: Boid[] = Array.from({ length: N }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.4,
    vy: (Math.random() - 0.5) * 1.4,
  }));

  const PERCEPTION = 72;
  const SEPARATION = 24;
  const MAX_SPEED = 1.5;
  const MIN_SPEED = 0.55;

  const step = () => {
    for (const b of boids) {
      let ax = 0,
        ay = 0,
        cx = 0,
        cy = 0,
        sx = 0,
        sy = 0,
        n = 0;
      for (const o of boids) {
        if (o === b) continue;
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > PERCEPTION * PERCEPTION) continue;
        n++;
        ax += o.vx;
        ay += o.vy;
        cx += o.x;
        cy += o.y;
        if (d2 < SEPARATION * SEPARATION) {
          sx -= dx / (d2 + 0.01);
          sy -= dy / (d2 + 0.01);
        }
      }
      if (n > 0) {
        b.vx += (ax / n - b.vx) * 0.03 + (cx / n - b.x) * 0.0006 + sx * 0.05;
        b.vy += (ay / n - b.vy) * 0.03 + (cy / n - b.y) * 0.0006 + sy * 0.05;
      }
      b.vx += (Math.random() - 0.5) * 0.03;
      b.vy += (Math.random() - 0.5) * 0.03;
      const sp = Math.hypot(b.vx, b.vy) || 0.001;
      const clamp = Math.min(Math.max(sp, MIN_SPEED), MAX_SPEED) / sp;
      b.vx *= clamp;
      b.vy *= clamp;
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -20) b.x = w + 20;
      if (b.x > w + 20) b.x = -20;
      if (b.y < -20) b.y = h + 20;
      if (b.y > h + 20) b.y = -20;
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const a = boids[i],
          b = boids[j];
        const dx = a.x - b.x,
          dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d > 64) continue;
        ctx.globalAlpha = (1 - d / 64) * 0.14;
        ctx.strokeStyle = accent;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent;
    ctx.shadowColor = accent;
    ctx.shadowBlur = 7;
    for (const b of boids) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  };

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    for (let i = 0; i < 500; i++) step();
    draw();
    return;
  }

  let running = true;
  const loop = () => {
    if (!running) return;
    step();
    draw();
    raf = requestAnimationFrame(loop);
  };
  io = new IntersectionObserver(([e]) => {
    running = e.isIntersecting;
    if (running) {
      cancelAnimationFrame(raf);
      loop();
    }
  });
  io.observe(canvas);
  loop();
});

onUnmounted(() => {
  cancelAnimationFrame(raf);
  ro?.disconnect();
  io?.disconnect();
});
</script>

<template>
  <canvas ref="el" class="murmuration" aria-hidden="true" />
</template>

<style scoped>
.murmuration {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.85;
  mask-image: linear-gradient(to bottom, black 55%, transparent 98%);
  -webkit-mask-image: linear-gradient(to bottom, black 55%, transparent 98%);
}
</style>
