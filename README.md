# vitepress-theme-9aia

The 9aia design language for VitePress — rounded, blue (`#00f`),
organism-aware. Extends the default theme with a token system, composable
motif patterns, and components: murmuration canvas, wire logs, strata
layers, specimen glyphs, spec rows, ledger registries.

See [DESIGN.md](./DESIGN.md) for the system.

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

All components are registered globally — use them in markdown directly:

```md
<Murmuration :count="80" />
<Layers :layers="[{ name: 'ledger', role: 'Durable work memory' }]" />
<Specimen name="myco" />
```

Compose piecemeal if you prefer:

```ts
import DefaultTheme from "vitepress/theme";
import "vitepress-theme-9aia/style.css"; // or tokens.css / patterns.css / ...
import { Murmuration } from "vitepress-theme-9aia/components";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("Murmuration", Murmuration);
  },
};
```

Opt into the manifest look per page:

```yaml
---
pageClass: doc-keys
---
```

## Development

Built with [Vite+](https://viteplus.dev):

- `pnpm run docs:dev` — preview the demo site in `docs/`
- `pnpm test` — unit tests
- `pnpm run check` — lint, format, typecheck
- `pnpm run build` — `vp pack`

## License

MIT
