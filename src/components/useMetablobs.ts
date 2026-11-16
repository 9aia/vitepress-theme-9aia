import { onMounted, onUnmounted, type Ref } from "vue";

// Shared WebGL metaball field — the rendering core behind MetaBlobs
// (hero) and BlobCluster (species cards). One fragment-shader pass loops
// every blob per pixel, so resolution is the main cost: callers on small
// containers pass a low `resolutionScale`/`maxDpr`, and the composable
// additionally degrades DPR + resolution on compact viewports
// (< `mobileWidth` or `pointer: coarse`).
//
// Ported from gaia-docus `app/components/MetaBlobs.vue` — 26 drifting
// blobs, mouse repulsion, wobble, reduced-motion + offscreen/hidden
// gating — with the gaia-docus pastel palette.

// Pastel presets — the gaia-docus MetaBlobs family, matching the
// `--pastel-*` primitives in tokens.css. Triples are shader-space 0..1.
export const METABLOB_PRESETS = {
  periwinkle: [0.62, 0.68, 0.96],
  lavender: [0.74, 0.62, 0.95],
  powder: [0.58, 0.8, 0.95],
  cyan: [0.5, 0.82, 0.9],
  mint: [0.68, 0.88, 0.82],
  blush: [0.93, 0.68, 0.82],
  indigo: [0.52, 0.58, 0.94],
} as const satisfies Record<string, readonly [number, number, number]>;

export type MetablobPreset = keyof typeof METABLOB_PRESETS;
export type MetablobRgb = readonly [number, number, number];
export type MetablobColor = MetablobPreset | MetablobRgb;
export type MetablobPalette = MetablobColor | MetablobColor[];

// The original six-hue mix — the default when no `colors` are given, so
// existing MetaBlobs usage keeps its look.
const DEFAULT_PALETTE: MetablobRgb[] = [
  METABLOB_PRESETS.periwinkle,
  METABLOB_PRESETS.lavender,
  METABLOB_PRESETS.powder,
  METABLOB_PRESETS.mint,
  METABLOB_PRESETS.blush,
  METABLOB_PRESETS.indigo,
];

const isRgb = (v: unknown): v is MetablobRgb =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === "number");

// Normalize the flexible `colors` prop into a flat list of RGB triples:
// a preset name, an rgb triple, or a list mixing presets and triples.
// Blob colors cycle through the list, so a single entry = one hue.
export function resolveMetablobColors(input?: MetablobPalette): [number, number, number][] {
  let items: MetablobColor[];
  if (input === undefined) {
    items = [...DEFAULT_PALETTE];
  } else if (isRgb(input)) {
    items = [input];
  } else if (Array.isArray(input)) {
    items = input as MetablobColor[];
  } else {
    items = [input];
  }
  const resolved: [number, number, number][] = items.map((c) => {
    if (typeof c === "string") {
      return [...(METABLOB_PRESETS[c as MetablobPreset] ?? METABLOB_PRESETS.periwinkle)] as [
        number,
        number,
        number,
      ];
    }
    return [...c] as [number, number, number];
  });
  // an empty list would leave blobs colorless — fall back to periwinkle
  return resolved.length > 0
    ? resolved
    : [[...METABLOB_PRESETS.periwinkle] as [number, number, number]];
}

export interface MetablobsOptions {
  /** blob count — default 26 (hero); small containers pass ~10-14 */
  count?: number;
  /** palette — preset name(s), rgb triple(s); default is the 6-hue mix */
  colors?: MetablobPalette;
  /** devicePixelRatio ceiling — default 2; compact viewports cap at 1.25 */
  maxDpr?: number;
  /** extra backing-store scale — default 1; compact viewports add ×0.75 */
  resolutionScale?: number;
  /** mouse repulsion — default true; false skips the pointermove listener */
  interactive?: boolean;
  /** viewport width below which the compact profile kicks in — default 768 */
  mobileWidth?: number;
}

export function useMetablobs(
  canvas: Ref<HTMLCanvasElement | null>,
  options: MetablobsOptions = {},
): void {
  let cleanup: (() => void) | null = null;
  onMounted(() => {
    // `!` satisfies the closure narrowing; the runtime check stays.
    const el = canvas.value!;
    if (!el) return;
    const count = options.count ?? 26;
    const palette = resolveMetablobColors(options.colors);
    const maxDpr = options.maxDpr ?? 2;
    const resolutionScale = options.resolutionScale ?? 1;
    const interactive = options.interactive ?? true;
    const mobileWidth = options.mobileWidth ?? 768;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const gl = el.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    // Blob count is baked into the uniform array sizes, so the fragment
    // body is templated per instance.
    const fragBody = `
precision highp float;
uniform vec2 u_res;
uniform vec3 u_blobs[${count}];   // x, y (px), radius
uniform vec3 u_cols[${count}];
void main() {
  vec2 uv = gl_FragCoord.xy;
  float f = 0.0;
  float best = 0.0;
  vec3 col = vec3(0.0);
  for (int i = 0; i < ${count}; i++) {
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
      fragBody.replace(
        "EDGE",
        deriv
          ? "float aa = max(fwidth(f) * 3.0, 0.04); float a = pow(smoothstep(0.9 - aa, 0.9 + aa, f), 1.6) * 0.85;"
          : "float a = pow(smoothstep(0.86, 1.0, f), 1.6) * 0.85;",
      );

    const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0., 1.); }
`;

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

    const parts = Array.from({ length: count }, (_, i) => {
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
        c: palette[i % palette.length],
      };
    });
    gl.uniform3fv(uCols, new Float32Array(parts.flatMap((p) => p.c)));

    const field = new Float32Array(count * 3);
    const mouse = { x: -9999, y: -9999 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = false;
    let w = 0,
      h = 0;

    function resize() {
      // Compact profile: small viewports and coarse pointers can't afford
      // a full-res fragment loop — cap DPR and shrink the backing store.
      const compact = window.innerWidth < mobileWidth || coarse;
      const dpr = Math.min(window.devicePixelRatio || 1, compact ? Math.min(maxDpr, 1.25) : maxDpr);
      const scale = resolutionScale * (compact ? 0.75 : 1);
      const rect = el.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      el.width = Math.max(1, Math.round(w * dpr * scale));
      el.height = Math.max(1, Math.round(h * dpr * scale));
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
    if (interactive) addEventListener("pointermove", onPointerMove);

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
      const fieldScale = Math.max(0.45, Math.min(Math.min(w, h * 1.4) / 900, 1.15));
      for (let i = 0; i < count; i++) {
        const p = parts[i];
        const wx = Math.sin(t / 7800 + p.wob) * 14;
        const wy = Math.cos(t / 9600 + p.wob) * 10;
        field[i * 3] = (p.x * w + wx) * (el.width / w);
        field[i * 3 + 1] = ((1 - p.y) * h - wy) * (el.height / h);
        field[i * 3 + 2] = p.r * fieldScale * (el.width / w);
      }
      gl!.uniform3fv(uBlobs, field);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (running) raf = requestAnimationFrame(frame);
    }

    // Pause when offscreen (IntersectionObserver) OR when the tab is
    // hidden — rAF throttles anyway, but skipping frames keeps the GL
    // context from waking for nothing.
    let intersecting = false;
    let visible = !document.hidden;
    const sync = () => {
      const on = intersecting && visible;
      if (on === running) return;
      running = on;
      if (on) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    };
    const onVisibility = () => {
      visible = !document.hidden;
      sync();
    };

    let io: IntersectionObserver | null = null;
    if (reduce) {
      frame();
    } else {
      io = new IntersectionObserver(([e]) => {
        intersecting = e.isIntersecting;
        sync();
      });
      io.observe(el);
      document.addEventListener("visibilitychange", onVisibility);
    }

    cleanup = () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("resize", onResize);
      if (interactive) removeEventListener("pointermove", onPointerMove);
    };
  });

  onUnmounted(() => cleanup?.());
}
