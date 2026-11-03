# Getting started

## Install

```bash
pnpm add github:9aia/vitepress-theme-9aia
```

Pin a tag or commit for reproducible installs:

```bash
pnpm add github:9aia/vitepress-theme-9aia#v0.1.0
```

## Use

Create `.vitepress/theme/index.ts`:

```ts
export { default } from "vitepress-theme-9aia";
```

That's it — the theme extends the VitePress default theme, registers the
components globally, and applies the design language.

::: tip
Prefer composing your own entry? Import only the stylesheet:
`import "vitepress-theme-9aia/style.css"`. Each layer is also its own
export — `tokens.css`, `base.css`, `patterns.css`, `vitepress.css` — and
components come from `vitepress-theme-9aia/components`.
:::

## The language

The design system is four layers — see [DESIGN.md](https://github.com/9aia/vitepress-theme-9aia/blob/main/DESIGN.md):

- **tokens** — primitives → semantic roles → pattern tokens
- **patterns** — `.dot`, `.port`, `.key`, `doc-keys`, `.doc-end`
- **components** — Murmuration, WireLog, Layers, Specimen, SpecRows, Ledger
- **composition** — pages assemble them; the manifest is the reference
