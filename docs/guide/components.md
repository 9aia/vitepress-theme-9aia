---
pageClass: doc-keys
---

# Components

All components are registered globally — drop them in any markdown, no
imports needed.

## Murmuration

A live boids swarm — agents murmurating. Absolute-positioned; place it
inside a `position: relative` container.

```md
<Murmuration :count="80" />
```

<div style="position: relative; height: 16rem; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid var(--vp-c-divider);">
  <Murmuration :count="80" />
</div>

## WireLog

A streaming wire transcript card.

```md
<WireLog label="$ sturn sub repo.9aia" :lines="[
  '{&quot;op&quot;:&quot;claim&quot;,&quot;actor&quot;:&quot;devin&quot;}',
  '{&quot;op&quot;:&quot;snap&quot;,&quot;commit&quot;:&quot;6ba1484&quot;}'
]" />
```

<WireLog label="$ sturn sub repo.9aia" :lines='["{\"op\":\"claim\",\"actor\":\"devin\",\"ws\":\"site\"}","{\"op\":\"snap\",\"actor\":\"devin\",\"commit\":\"6ba1484\"}","{\"op\":\"join\",\"actor\":\"peregrin\"}"]' />

## Layers

Contiguous strata — one object, hairline-separated layers, depth ramp on
the left edge.

```md
<Layers :layers="[
  { name: 'ledger', role: 'Durable work memory', engines: ['myco', 'kuda'] },
  { name: 'wal', role: 'Ephemeral coordination', engines: ['sturn'] },
]" />
```

<Layers :layers='[{ name: "ledger", role: "Durable work memory — items, views, code cards, secrets", engines: ["myco", "kuda", "arca"] }, { name: "wal", role: "Ephemeral coordination — claims, ops, topics over VCS state", engines: ["sturn"] }, { name: "orchestrator", role: "Campaigns driving agent sessions across machines", engines: ["peregrin", "sepia"] }, { name: "queue", role: "Event-driven jobs, shipped as CI", engines: ["bupha", "mimus", "cicada"] }]' />

## Specimen

A deterministic organic blob per name — each organism its own silhouette.

```md
<Specimen name="myco" /> <Specimen name="sturn" /> <Specimen name="sepia" />
```

<Specimen name="myco" /> <Specimen name="sturn" /> <Specimen name="sepia" /> <Specimen name="cicada" /> <Specimen name="peregrin" /> <Specimen name="delphis" />

## SpecRows

Spec-sheet key/value rows.

```md
<SpecRows :rows="[
  { title: 'Ports are the architecture', details: 'Every concern is a trait + impl.' },
]" />
```

<SpecRows :rows='[{ title: "Ports are the architecture", details: "Every concern is a trait + impl; the boundaries are the codebase." }, { title: "VCS-native state", details: "Durable state lives in versioned history, not a private DB." }, { title: "Grown, not built", details: "The engine emerges from use; the domain is a preset, not the product." }]' />

## Ledger

A record-table registry — specimen glyph, status pill, keywords, links,
status filters.

```md
<Ledger :items="[
  { name: 'myco', description: 'Records engine for agent work', status: 'recent', keywords: ['rust', 'agents'], github: 'https://github.com/9aia/myco' },
]" />
```

<Ledger :items='[{ name: "myco", description: "Records engine for agent work — views + mutations", status: "recent", keywords: ["rust", "agents", "cli"], github: "https://github.com/9aia/myco" }, { name: "sturn", description: "Ephemeral coordination — claims/ops/topics over VCS state", status: "wip", keywords: ["rust", "git", "daemon"], github: "https://github.com/9aia/sturn" }, { name: "peregrin", description: "Campaigns driving agent sessions across machines", status: "recent", keywords: ["orchestration", "mcp"], github: "https://github.com/9aia/peregrin" }]' />

## Patterns

```md
<span class="dot">organism</span>
<span class="port">port</span>
<span class="key">name</span>
<p class="doc-end"></p>
```

<span class="dot">organism</span> <span class="port">port</span> <span class="key">name</span>

End a document page with `<p class="doc-end"></p>` for the YAML
document-end marker.

`pageClass: doc-keys` in frontmatter turns every `h2` on a page into a
`key:` with a port on its hairline — this page uses it.
