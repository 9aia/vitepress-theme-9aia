# Theming

The theme is a token cascade. Override primitives and every semantic and
pattern token follows.

```ts
import Theme from "vitepress-theme-9aia";
import "./overrides.css";

export default Theme;
```

```css
/* overrides.css */
:root {
  --blue: rebeccapurple; /* every blue tint shifts */
  --radius: 1.25rem;
}
```

## Primitives

- `--blue` — the brand anchor, `#00f` by default
- `--hue` — the oklch hue every ramp/tint derives from (`264`)
- `--paper`, `--ink`, `--navy` — light bg, light fg, dark bg

## Semantic

- `--primary`, `--primary-foreground`, `--ring`
- `--background`, `--foreground`, `--card`, `--secondary`, `--accent`
- `--border`, `--input`, `--muted`, `--muted-foreground`
- `--sidebar*` — sidebar surface, text, accent
- `--chart-1` … `--chart-5` — light → dark ramp

## Pattern tokens

- `--radius-sm` / `--radius` / `--radius-lg` — the radii hierarchy
- `--dot-size`, `--port-size`, `--port-stroke`, `--wire-width`,
  `--stratum-width` — motif dimensions
- `--glow` — the accent box-shadow used by organism dots
- `--font-serif` / `--font-sans` / `--font-mono` — the three type voices

## Dark mode

`.dark` redefines every semantic token — a navy field with a brighter,
bioluminescent accent, since pure `#00f` is too dark on dark surfaces.
