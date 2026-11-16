# vitepress-theme-9aia — agent/dev map

The 9aia design language packaged as a VitePress theme — rounded,
blue (`#00f`), organism-aware. See [DESIGN.md](DESIGN.md) for the
system; [README.md](README.md) for consumer usage.

## Layout

| Path              | Role                                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/index.ts`    | theme entry — extends the default VitePress theme, registers components globally                             |
| `src/components/` | Vue components (Murmuration canvas, wire logs, strata layers, specimen glyphs, spec rows, ledger registries) |
| `src/*.css`       | token/pattern/base/vitepress stylesheets, each its own `exports` subpath                                     |
| `docs/`           | demo site exercising every component — not the org docs-worktree convention                                  |
| `tests/`          | unit tests (`vp test`)                                                                                       |

## Commands

```bash
pnpm install
pnpm run docs:dev     # preview the demo site in docs/
pnpm run docs:build   # build the demo site
pnpm test             # unit tests
pnpm run check        # lint + format + typecheck (vp check)
pnpm run build        # vp pack — the distributable bundle
```

## Rules

- Distributed via git URL (`github:9aia/vitepress-theme-9aia`) — no
  npm publish; consumers pin a ref.
- English everywhere; conventional commits.
- `docs/` is a demo/fixture site, not a Diátaxis docs worktree —
  `cypera.toml` exempts the docs-site contract rules.

## Boundary

This repo owns the VitePress theme only. Sibling
`slidev-theme-9aia` ports the same design language to Slidev;
`9aia.github.io` is the website that consumes the look.
