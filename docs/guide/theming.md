# Theming

The theme is plain CSS custom properties. Override any token in your own
stylesheet after the theme import.

```ts
import Theme from "vitepress-theme-9aia";
import "./overrides.css";

export default Theme;
```

```css
/* overrides.css */
:root {
  --primary: rebeccapurple;
  --radius: 1.25rem;
}
```

## Palette

- `--primary` — brand accent, `#00f` in light mode
- `--ring` — hover/focus accent
- `--secondary` — soft background tint (feature hover, table headers)
- `--accent` — inline code and sidebar hover background
- `--border` — hairlines everywhere
- `--sidebar` — sidebar background
- `--chart-1` … `--chart-5` — light → dark blue ramp
- `--radius` — corner radius for cards, code blocks, tables, blocks

## Dark mode

The `.dark` scope redefines every token — a navy-tinted background and a
brighter blue accent, since pure `#00f` is too dark on dark surfaces.
