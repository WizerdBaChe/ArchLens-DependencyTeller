# ArchLens Dependency — Developer Guide

> This file is for contributors and maintainers. For the public-facing overview, see [README.md](README.md).

## API Reference

For how to **consume** `@archlens/core` from a CLI, VS Code extension, or other host, see
[`packages/core/API.md`](packages/core/API.md).

## Architecture

```text
packages/
  core/   @archlens/core   — pure analysis engine (parser → resolver → graph → analyzer)
                              Zero UI dependencies. Reusable from a CLI or editor extension.
                              Parses JS/TS/Vue and Python; classifies each node into an
                              architectural tier (frontend / backend / shared / unknown).
  web/    @archlens/web    — React + Vite UI. The only package that knows about React/ReactFlow.
```

### Tiers (frontend / backend)

`packages/core/src/analyzer/inferTier.ts` classifies every node into a tier so a mixed
frontend + backend project is readable on one canvas. The guiding rule is **language ≠ tier**:
a `.py` file can be a Flask backend *or* a desktop GUI, so classification layers explicit
signals (config-derived roots) over an extension default (`.py` → backend, web extensions →
frontend). Tier drives the node *shape/tint* (an axis orthogonal to the role border colour),
the All/Frontend/Backend filter, and the vertical banding in the layout.

### Hierarchical collapse

The graph view can fold a directory's files into a single aggregate "group" node and back.
The fold is a pure transform — `packages/web/src/graph/collapseGraph.ts` turns the real graph
plus a set of collapsed group names into a *display graph* (aggregate nodes + remapped,
deduped edges). Collapse state lives in the Zustand store (`collapsedGroups`); the view never
mutates the underlying graph.

The two packages talk through exactly one contract: `analyzeProject(input): AnalysisResult`,
defined in `packages/core/src/types.ts`. The web app's Zustand store
(`packages/web/src/store/useGraphStore.ts`) is the *only* file that calls it — every
component below that store only sees plain data, never the engine itself. That is the
seam that keeps the project low-coupling: you can replace the graph rendering library, the
input UI, or even move the engine into a Web Worker without touching the other side.

### i18n

All UI text lives in `packages/web/src/i18n/locales/`. Each locale is a single TypeScript
file that implements the `Locale` interface defined in `en-US.ts`. The active locale is
provided via `LocaleContext` and consumed with the `useLocale()` hook. To add a new
language, create `locales/<code>.ts` implementing `Locale`, then register it in
`LocaleContext.tsx`.

## Quick Start

```bash
npm install                           # install both workspace packages
npm run build -w @archlens/core       # build the engine (web depends on its dist/)
npm run dev                           # start the Vite dev server
```

## Running Tests

```bash
npm test -w @archlens/core
```

56 unit + integration tests across 7 files cover the JS/TS parser (all import styles), the
Python import extractor, the resolver (relative / index / alias / external, plus Python
specifier resolution), tier inference, Tarjan cycle detection (including self-loops and
diamond-shaped non-cycles), Vue `<script>` extraction, and a full end-to-end fixture project
with a real circular dependency, an alias import, and a deliberately broken import.

## Building for Production

```bash
npm run build -w @archlens/web
```

Output lands in `packages/web/dist/` — a fully static site. Serve with any static file
server (`npx serve packages/web/dist`); no backend required.

## Known Boundaries (Intentionally Deferred)

- `.ts/.tsx/.js/.jsx/.mts/.cts/.mjs/.cjs/.vue` and `.py/.pyi` are parsed; other languages are
  out of scope.
- External packages (`node_modules` / installed Python packages) are detected but not graphed
  as nodes.
- Tier inference uses extension defaults + config signals; it does not deep-analyse build
  tooling to confirm a module's runtime.

### Closed since MVP

- **Image export** — PNG and SVG export of the rendered graph now exist alongside JSON/CSV.
  `packages/web/src/export/exportImage.ts` serialises the live ReactFlow viewport with
  `html-to-image` (client-side only — no network), so the output is WYSIWYG.
- **Cross-tier edges** — `GraphEdge.crossTier` is now set by the engine: `true` when an edge
  joins a concrete `frontend` node to a concrete `backend` node (either direction). Edges
  touching `shared`/`unknown` are not crossings. The web view renders these magenta/dashed and
  the legend explains them; CSV export carries the column.
- **Multi-hop impact tracing** — the node detail panel has a hop-depth selector (1 / 2 / 3 /
  All). Depth 1 is the original direct-neighbour behaviour; higher values walk the graph
  transitively. The walk is a web-side BFS (`reachableImpact` in `useGraphStore.ts`); the core
  `traceNodeImpact` stays 1-hop by design.

## Extension Points

- **New language support** — add a parser in `packages/core/src/parser/` (see
  `extractImports.ts` for JS/TS and `extractPythonImports.ts` for the Python pattern), keep the
  same `RawImport[]` output shape, extend `SupportedLanguage` in `types.ts`, and wire it into
  `graphBuilder.ts`'s language dispatch. Add the file's tier rule in `analyzer/inferTier.ts`.
- **New layout algorithm** — replace `packages/web/src/graph/layout.ts`; its contract is
  `(nodes: LayoutNode[], edges: LayoutEdge[]) => Map<id, {x, y}>`, where each `LayoutNode`
  carries `{ id, width, height, tier? }` (tier drives the frontend/backend banding).
- **New locale** — add `packages/web/src/i18n/locales/<code>.ts` implementing the `Locale`
  interface, then register it in `LocaleContext.tsx`.
- **CLI** — `@archlens/core`'s `analyzeProject` has no DOM/browser dependency, so a Node
  CLI can import it directly today.
