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

That's it — the theme extends the VitePress default theme, so everything
in the default theme keeps working.

::: tip
Prefer composing your own entry? Import only the stylesheet:
`import "vitepress-theme-9aia/style.css"`.
:::

## What's inside

| Token       | Value                        |
| ----------- | ---------------------------- |
| `--primary` | `#0000ff`                    |
| `--radius`  | `0.75rem`                    |
| Buttons     | pill (`999px`)               |
| Dark mode   | deeper navy, brighter accent |

Inline `code`, tables, and custom blocks all pick up the rounded style.
