# vitepress-theme-9aia

Rounded, blue (`#00f`) VitePress theme — the 9aia docs look. Extends the
VitePress default theme with an oklch blue palette, pill buttons, rounded
cards/code/tables, and light + dark modes.

## Install

Distributed via git URL — no npm publish needed:

```bash
pnpm add github:9aia/vitepress-theme-9aia
# or pin a ref
pnpm add github:9aia/vitepress-theme-9aia#v0.1.0
```

## Usage

`.vitepress/theme/index.ts`:

```ts
export { default } from "vitepress-theme-9aia";
```

Or just the CSS, if you compose your own theme entry:

```ts
import DefaultTheme from "vitepress/theme";
import "vitepress-theme-9aia/style.css";

export default { extends: DefaultTheme };
```

## Development

Built with [Vite+](https://viteplus.dev):

- `pnpm run docs:dev` — preview the demo site in `docs/`
- `pnpm test` — unit tests
- `pnpm run check` — lint, format, typecheck
- `pnpm run build` — `vp pack`

## License

MIT
