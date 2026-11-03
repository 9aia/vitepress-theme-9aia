# 9aia design language

An ecosystem rendered as a system: organisms that are machines. Blue `#00f`
is the brand; rounded is the material; the motifs are organic — dots,
ports, wires, strata, specimens, and the murmuration.

The language is four layers. Each depends only on the layers below it, so
consumers can take as much or as little as they need.

## Layer 1 — tokens (`tokens.css`)

Primitives → semantic roles → pattern tokens.

- **Primitives**: `--blue` (`#00f`), `--hue`, `--paper`, `--ink`, `--navy`.
  Re-theme everything by overriding these — every tint derives from them.
- **Semantic**: `--primary`, `--background`/`--foreground`, `--card`,
  `--secondary`, `--accent`, `--border`, `--ring`, `--chart-1..5`,
  `--sidebar*` — mirrored into `--vp-c-*` for VitePress.
- **Type voices**: `--font-serif` (the organism — editorial/display),
  `--font-sans` (prose), `--font-mono` (the machine — names, keys, data).
- **Radii**: a hierarchy, not a value — `--radius-sm` / `--radius` /
  `--radius-lg` / `999px` (buttons, pills, specimens).
- **Pattern tokens**: `--dot-size`, `--port-size`, `--port-stroke`,
  `--wire-width`, `--stratum-width`, `--glow`.

## Layer 2 — patterns (`patterns.css`)

Composable motif classes:

| Class       | Motif                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| `.dot`      | filled organism dot (with glow)                                                                               |
| `.port`     | hollow connector dot on a line                                                                                |
| `.key`      | mono `label:` in brand blue                                                                                   |
| `.doc-keys` | opt-in page class — every `h2` becomes a `key:` with a port on its hairline; the document reads as a manifest |
| `.doc-end`  | renders `...`, the YAML document-end marker                                                                   |

## Layer 3 — components (`src/components/`)

Registered globally by the theme's `enhanceApp` — usable in any markdown
without imports. All props are typed (`LayerItem`, `SpecRow`, `LedgerItem`).

| Component       | Motif                                                                          | Props                                  |
| --------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| `<Murmuration>` | agents murmurate, not merge — live boids swarm canvas                          | `count?: number`                       |
| `<WireLog>`     | the wire — streaming op transcript card                                        | `lines: string[]`, `label?`, `stream?` |
| `<Layers>`      | strata — contiguous layer diagram                                              | `layers: LayerItem[]`                  |
| `<Specimen>`    | deterministic organic blob per name                                            | `name: string`                         |
| `<SpecRows>`    | spec-sheet key/value rows                                                      | `rows: SpecRow[]`                      |
| `<Ledger>`      | record-table registry — specimen, status pill, keywords, links, status filters | `items: LedgerItem[]`, `filterable?`   |

## Layer 4 — composition

Pages compose patterns and components; the homepage of `9aia.github.io` is
the reference implementation (`pageClass: doc-keys`, murmuration masthead,
`layers:`/`mission:`/`principles:`/`products:`/`stack:`/`contact:` manifest).

## Principles

- **Spend motion in one place.** The murmuration is the only ambient
  animation; the wire streams once on load. Everything else is quiet.
- **Every section a different value type.** Diagram, scalar, list, table,
  mapping — the manifest conceit gives variety without visual noise.
- **Serif is the organism, mono is the machine.** The naming tension
  (fungi/starlings as binaries) is the brand; typography carries it.
- **Blue glows in the dark.** Light mode is pure `#00f`; dark mode is a
  navy field with a brighter, bioluminescent accent.
