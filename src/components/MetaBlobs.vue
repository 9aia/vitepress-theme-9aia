<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
// Ported from gaia-docus `app/components/MetaBlobs.vue` — same WebGL
// metaball field (26 drifting blobs, mouse repulsion, wobble, reduced-
// motion + offscreen gating) with the gaia-docus pastel palette.
const canvas = ref<HTMLCanvasElement | null>(null);
let cleanup: (() => void) | null = null;

onUnmounted(() => cleanup?.());

const N = 26;

// Pastel palette — same hues as gaia-docus MetaBlobs.
const BLOB_COLORS: [number, number, number][] = [
  [0.62, 0.68, 0.96], // periwinkle
  [0.74, 0.62, 0.95], // lavender
  [0.58, 0.8, 0.95], // powder blue
  [0.68, 0.88, 0.82], // mint
  [0.93, 0.68, 0.82], // blush
  [0.52, 0.58, 0.94], // indigo pastel
];

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0., 1.); }
`;

const FRAG_BODY = `
precision highp float;
uniform vec2 u_res;
uniform vec3 u_blobs[${N}];   // x, y (px), radius
uniform vec3 u_cols[${N}];
void main() {
  vec2 uv = gl_FragCoord.xy;
  float f = 0.0;
  float best = 0.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${N}; i++) {
    float d = distance(uv, u_blobs[i].xy);
    float infl = min((u_blobs[i].z * u_blobs[i].z) / max(d * d, 1.0), 4.0);
    f += infl;
    if (infl > best) { best = infl; col = u_cols[i]; }
  }
  EDGE
  gl_FragColor = vec4(col, a);
}
`;

const fragSrc = (deriv: boolean) =>
  (deriv ? "#extension GL_OES_standard_derivatives : enable\n" : "") +
  FRAG_BODY.replace(
    "EDGE",
    deriv
      ? "float aa = max(fwidth(f) * 3.0, 0.04); float a = pow(smoothstep(0.9 - aa, 0.9 + aa, f), 1.6) * 0.85;"
      : "float a = pow(smoothstep(0.86, 1.0, f), 1.6) * 0.85;",
  );

onMounted(() => {
  const el = canvas.value!;
  // Mount inside .VPHero so the absolute canvas covers the hero box;
  // .main keeps z-index:10 so hero text stays above the blobs.
  document.querySelector(".VPHero")?.appendChild(el);
  const gl = el.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl) return;

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(
    prog,
    compile(gl.FRAGMENT_SHADER, fragSrc(!!gl.getExtension("OES_standard_derivatives"))),
  );
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "u_res");
  const uBlobs = gl.getUniformLocation(prog, "u_blobs");
  const uCols = gl.getUniformLocation(prog, "u_cols");
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const parts = Array.from({ length: N }, (_, i) => {
    const vx = (Math.random() - 0.5) * 0.0055;
    const vy = (Math.random() - 0.5) * 0.0045;
    return {
      x: Math.random(),
      y: Math.random(),
      r: 30 + Math.random() * 46,
      vx0: vx,
      vy0: vy,
      vx,
      vy,
      wob: Math.random() * Math.PI * 2,
      c: BLOB_COLORS[i % BLOB_COLORS.length],
    };
  });
  gl.uniform3fv(uCols, new Float32Array(parts.flatMap((p) => p.c)));

  const field = new Float32Array(N * 3);
  const mouse = { x: -9999, y: -9999 };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0;
  let running = false;
  let w = 0,
    h = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = el.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    el.width = w * dpr;
    el.height = h * dpr;
    gl!.viewport(0, 0, el.width, el.height);
    gl!.uniform2f(uRes, el.width, el.height);
  }
  resize();
  const onResize = () => resize();
  const onPointerMove = (e: PointerEvent) => {
    const rect = el.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = rect.height - (e.clientY - rect.top); // gl coords
  };
  addEventListener("resize", onResize);
  addEventListener("pointermove", onPointerMove);

  let last = 0;

  function frame(t = 0) {
    // delta-time — velocities are per second, refresh-rate independent
    const dt = Math.min((t - last) / 1000, 0.1) || 0;
    last = t;
    // natural repulsion — force → velocity, damped back toward cruise
    for (const p of parts) {
      const px = p.x * w;
      const py = (1 - p.y) * h;
      const dx = px - mouse.x;
      const dy = py - mouse.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / 240);
      p.vx += ((dx / d) * f * f * 32.0 * dt) / w;
      p.vy += ((dy / d) * f * f * 32.0 * dt) / h;
      // spring back to cruise velocity + speed cap
      const k = Math.pow(0.93, dt * 60);
      p.vx = p.vx0 + (p.vx - p.vx0) * k;
      p.vy = p.vy0 + (p.vy - p.vy0) * k;
      const sp = Math.hypot(p.vx * w, p.vy * h);
      if (sp > 5) {
        p.vx *= 5 / sp;
        p.vy *= 5 / sp;
      }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.x < -0.1) p.x = 1.1;
      if (p.x > 1.1) p.x = -0.1;
      if (p.y < -0.1) p.y = 1.1;
      if (p.y > 1.1) p.y = -0.1;
    }
    const scale = Math.max(0.45, Math.min(Math.min(w, h * 1.4) / 900, 1.15));
    for (let i = 0; i < N; i++) {
      const p = parts[i];
      const wx = Math.sin(t / 7800 + p.wob) * 14;
      const wy = Math.cos(t / 9600 + p.wob) * 10;
      field[i * 3] = (p.x * w + wx) * (el.width / w);
      field[i * 3 + 1] = ((1 - p.y) * h - wy) * (el.height / h);
      field[i * 3 + 2] = p.r * scale * (el.width / w);
    }
    gl!.uniform3fv(uBlobs, field);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (running) raf = requestAnimationFrame(frame);
  }

  let io: IntersectionObserver | null = null;
  if (reduce) {
    frame();
  } else {
    io = new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    });
    io.observe(el);
  }

  cleanup = () => {
    cancelAnimationFrame(raf);
    io?.disconnect();
    removeEventListener("resize", onResize);
    removeEventListener("pointermove", onPointerMove);
  };
});
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
