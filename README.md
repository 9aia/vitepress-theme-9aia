# vitepress-theme-9aia

The 9aia design language for VitePress — rounded, blue (oklch indigo),
organism-aware. Extends the default theme with a token system, composable
motif patterns, and components: murmuration canvas, wire logs, strata
layers, specimen glyphs, spec rows, ledger registries, metaball hero.

See [DESIGN.md](./DESIGN.md) for the system.

## Install

Distributed via git URL — no npm publish needed:

```bash
pnpm add github:9aia/vitepress-theme-9aia
# or pin a ref
pnpm add github:9aia/vitepress-theme-9aia#c27ab44
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

## Options

- **Hero metaballs** — off by default. Opt in per home-layout page with
  `hero.blobs: true` in frontmatter (only 9aia.com uses it). The hero
  field renders in a single pastel; `<MetaBlobs colors="...">` accepts
  a preset name (`periwinkle`/`lavender`/`powder`/`cyan`/`mint`/`blush`/
  `indigo`), an rgb triple, or a list for custom mixes.
- **`<BlobCluster>`** — a "species" card: a small single-hue metaball
  field in a rounded container. `color` (same preset names or rgb
  triple), `count`, `radius` (`a`/`b`/`c`), optional caption via the
  default slot. Cheap enough to repeat down a page.
- **`themeConfig.externalSections`** — on a root-base site, same-origin
  links whose first path segment is listed (e.g. sibling docs sites at
  `/<name>/`) are left to the browser as full navigations instead of
  VitePress SPA routing, which would 404 on them. Sites with a non-root
  `base` (`/<name>/`) get this automatically for every path outside
  their base.
- **Search** — enable the built-in local provider per site:
  `themeConfig.search.provider: "local"`.

## Development

Built with [Vite+](https://viteplus.dev):

- `pnpm run docs:dev` — preview the demo site in `docs/`
- `pnpm run docs:build` — build the demo site
- `pnpm test` — unit tests
- `pnpm run check` — lint, format, typecheck
- `pnpm run build` — `vp pack`

## License

MIT
