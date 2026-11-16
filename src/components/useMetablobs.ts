import { onMounted, onUnmounted, type Ref } from "vue";

// Shared WebGL metaball field — the rendering core behind MetaBlobs
// (hero) and BlobCluster (species cards). One fragment-shader pass loops
// every blob per pixel, so resolution is the main cost: the soft
// low-fi profile (reduced DPR + resolutionScale < 1) is the default
// everywhere, and the composable degrades further on compact viewports
// (< `mobileWidth` or `pointer: coarse`).
//
// Ported from gaia-docus `app/components/MetaBlobs.vue` — 26 drifting
// blobs, pointer repulsion + click pulse, wobble, reduced-motion +
// offscreen/hidden gating — with the gaia-docus pastel palette.

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
  /** blob count — default scales with field area (~1 per 20k px²,
      clamped 20–64); small containers pass an explicit count */
  count?: number;
  /** palette — preset name(s), rgb triple(s); default is the 6-hue mix */
  colors?: MetablobPalette;
  /** devicePixelRatio ceiling — default 1.5; compact viewports cap at 1.25 */
  maxDpr?: number;
  /** backing-store scale — default 0.7 (soft low-fi baseline); compact
      viewports add ×0.75 */
  resolutionScale?: number;
  /** pointer repulsion — default true; false skips the pointermove/
      pointerdown/pointerout listeners */
  interactive?: boolean;
  /** viewport width below which the compact profile kicks in — default 768 */
  mobileWidth?: number;
  /** keep blob centers inside a safe inner margin (max blob radius +
      padding) so metaballs never get sliced by the container edge —
      default false (full-bleed, wrap-around drift) */
  contain?: boolean;
  /** per-blob radius spread as a fraction of the base radius — 0 keeps
      the stock 30–76px spread, 0.45 spans roughly 0.55×–1.45× —
      default 0 */
  sizeVariety?: number;
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
    // Default count scales with field area (~1 blob per 20k px², floor
    // 20 / cap 64) so big hero fields on laptop+ screens stay dense;
    // callers like BlobCluster pass an explicit count.
    const rect0 = el.getBoundingClientRect();
    const count =
      options.count ?? Math.min(64, Math.max(20, Math.round((rect0.width * rect0.height) / 20000)));
    const palette = resolveMetablobColors(options.colors);
    const maxDpr = options.maxDpr ?? 1.5;
    const resolutionScale = options.resolutionScale ?? 0.7;
    const interactive = options.interactive ?? true;
    const mobileWidth = options.mobileWidth ?? 768;
    const contain = options.contain ?? false;
    const sizeVariety = options.sizeVariety ?? 0;
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
      let vx = (Math.random() - 0.5) * 0.0055;
      let vy = (Math.random() - 0.5) * 0.0045;
      // near-zero cruise velocity leaves a blob crawling in place —
      // in small containers the whole field can settle into a static
      // clump. Give stalled blobs a fresh direction at readable speed.
      if (Math.hypot(vx, vy) < 0.002) {
        const a = Math.random() * Math.PI * 2;
        vx = Math.cos(a) * 0.003;
        vy = Math.sin(a) * 0.003;
      }
      return {
        x: Math.random(),
        y: Math.random(),
        r: (30 + Math.random() * 46) * (1 + (Math.random() * 2 - 1) * sizeVariety),
        vx0: vx,
        vy0: vy,
        vx,
        vy,
        wob: Math.random() * Math.PI * 2,
        // per-blob wobble frequency — a shared frequency makes the whole
        // field slide in synchronized waves that reads as convergence
        wf: 0.6 + Math.random() * 0.8,
        ci: i % palette.length,
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
      // Soft low-fi is the baseline on every viewport — the field reads
      // as a dreamy low-res texture, not sharp sprites. Compact
      // viewports and coarse pointers degrade further: lower DPR cap,
      // ×0.75 backing-store scale.
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
    // pointer coords in canvas space, gl convention (y up from bottom)
    const pointerPos = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: rect.height - (e.clientY - rect.top) };
    };
    const onPointerMove = (e: PointerEvent) => {
      const p = pointerPos(e);
      mouse.x = p.x;
      mouse.y = p.y;
    };
    // pointer leaving the window releases the repulsion — otherwise
    // blobs keep drifting away from the last cursor position forever
    const onPointerOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        mouse.x = -9999;
        mouse.y = -9999;
      }
    };
    // click/tap fires a brief stronger, wider pull — `clickUntil`
    // shares the rAF timestamp clock (DOMHighResTimeStamp)
    let clickUntil = 0;
    const onPointerDown = (e: PointerEvent) => {
      const p = pointerPos(e);
      mouse.x = p.x;
      mouse.y = p.y;
      clickUntil = performance.now() + 400;
    };
    addEventListener("resize", onResize);
    if (interactive) {
      addEventListener("pointermove", onPointerMove);
      addEventListener("pointerdown", onPointerDown);
      addEventListener("pointerout", onPointerOut);
    }

    let last = 0;

    function frame(t = 0) {
      // delta-time — velocities are per second, refresh-rate independent.
      // Clamp tighter than a dropped frame so a hiccup reads as a
      // slow-motion beat, not a teleport.
      const dt = Math.min((t - last) / 1000, 0.06) || 0;
      last = t;
      // blob radius scales with the field's smaller dimension so every
      // container — hero or card — gets the same proportional blob size
      const fieldScale = Math.max(0.15, Math.min(Math.min(w, h) / 1000, 1.15));

      // pointer repulsion — blobs drift gently away from the cursor; a
      // click/tap widens the radius and ~quadruples the push briefly
      const clicking = t < clickUntil;
      const pointerRange = clicking ? 380 : 240;
      const pointerAccel = clicking ? 48 : 12; // px/s² at zero distance
      // contain margin in px — max blob radius (× iso-field overshoot
      // ~1.15) + absolute wobble/headroom; normalized per axis below
      const padPx = contain ? Math.max(...parts.map((q) => q.r)) * fieldScale * 1.15 + 18 : 0;
      // clamp so a tiny container can't invert the margins
      const mx = w > 0 ? Math.min(padPx / w, 0.45) : 0;
      const my = h > 0 ? Math.min(padPx / h, 0.45) : 0;
      // contained fields only: short-range separation keeps blobs from
      // merging into one static clump — metaballs fuse visually well
      // before their radii touch, so minDist stays above r1+r2. They
      // remain distinct drifters, just bounded. Equal-and-opposite
      // impulses, O(n²) but n ≤ ~14 in containers.
      // multi-species fields (hero): same-species blobs drift together
      // and can merge; different species can't merge — they repel and
      // compete for space. Equal-and-opposite impulses, O(n²).
      if (!contain && palette.length > 1) {
        const SAME_PULL = 12; // px/s² — own kind drifts together
        const OTHER_PUSH = 35; // px/s² — other species can't merge
        for (let i = 0; i < count; i++) {
          const a = parts[i];
          const ax = a.x * w;
          const ay = (1 - a.y) * h;
          const ar = a.r * fieldScale;
          for (let j = i + 1; j < count; j++) {
            const b = parts[j];
            const dx = b.x * w - ax;
            const dy = (1 - b.y) * h - ay;
            const d = Math.hypot(dx, dy);
            if (d < 1) continue;
            const touch = ar + b.r * fieldScale;
            const same = a.ci === b.ci;
            const range = same ? touch * 1.6 : touch * 2 + 8;
            if (d >= range) continue;
            // same kind pulls together; other species push apart
            const s = ((1 - d / range) * (same ? SAME_PULL : -OTHER_PUSH) * dt) / d;
            a.vx += (dx * s) / w;
            a.vy += (dy * s) / h;
            b.vx -= (dx * s) / w;
            b.vy -= (dy * s) / h;
          }
        }
      } else if (contain) {
        const SEP_ACCEL = 120; // px/s² at contact, fading to 0 at minDist
        for (let i = 0; i < count; i++) {
          const a = parts[i];
          const ax = a.x * w;
          const ay = (1 - a.y) * h;
          const ar = a.r * fieldScale;
          for (let j = i + 1; j < count; j++) {
            const b = parts[j];
            const dx = b.x * w - ax;
            const dy = (1 - b.y) * h - ay;
            const d = Math.hypot(dx, dy);
            const minD = (ar + b.r * fieldScale) * 1.2;
            if (d < 1 || d >= minD) continue;
            const s = ((1 - d / minD) * SEP_ACCEL * dt) / d;
            a.vx += (dx * s) / w;
            a.vy += (dy * s) / h;
            b.vx -= (dx * s) / w;
            b.vy -= (dy * s) / h;
          }
        }
      }
      const k = Math.pow(0.93, dt * 60);
      for (const p of parts) {
        const px = p.x * w;
        const py = (1 - p.y) * h;
        const dx = px - mouse.x;
        const dy = py - mouse.y;
        const d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / pointerRange);
        p.vx += ((dx / d) * f * f * pointerAccel * dt) / w;
        p.vy += ((dy / d) * f * f * pointerAccel * dt) / h;
        // spring back to cruise velocity + speed cap
        p.vx = p.vx0 + (p.vx - p.vx0) * k;
        p.vy = p.vy0 + (p.vy - p.vy0) * k;
        const sp = Math.hypot(p.vx * w, p.vy * h);
        if (sp > 5) {
          p.vx *= 5 / sp;
          p.vy *= 5 / sp;
        }
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (contain) {
          // reflect off the safe inner margin so blobs read as
          // trapped/enclosed instead of wrap-around drifters
          if (p.x < mx) {
            p.x = mx;
            p.vx = Math.abs(p.vx) * 0.6;
          } else if (p.x > 1 - mx) {
            p.x = 1 - mx;
            p.vx = -Math.abs(p.vx) * 0.6;
          }
          if (p.y < my) {
            p.y = my;
            p.vy = Math.abs(p.vy) * 0.6;
          } else if (p.y > 1 - my) {
            p.y = 1 - my;
            p.vy = -Math.abs(p.vy) * 0.6;
          }
        } else {
          if (p.x < -0.1) p.x = 1.1;
          if (p.x > 1.1) p.x = -0.1;
          if (p.y < -0.1) p.y = 1.1;
          if (p.y > 1.1) p.y = -0.1;
        }
      }
      for (let i = 0; i < count; i++) {
        const p = parts[i];
        const wx = Math.sin((t / 7800) * p.wf + p.wob) * 14;
        const wy = Math.cos((t / 9600) * p.wf + p.wob) * 10;
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
      // reset the dt baseline on resume — otherwise the first frame
      // after a pause integrates the whole gap as one jump
      last = 0;
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
      if (interactive) {
        removeEventListener("pointermove", onPointerMove);
        removeEventListener("pointerdown", onPointerDown);
        removeEventListener("pointerout", onPointerOut);
      }
    };
  });

  onUnmounted(() => cleanup?.());
}
