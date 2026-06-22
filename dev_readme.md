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
  web/    @archlens/web    — React + Vite UI. The only package that knows about React/ReactFlow.
```

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

26 unit + integration tests cover the parser (all 4 import styles), the resolver (relative /
index / alias / external resolution), Tarjan cycle detection (including self-loops and
diamond-shaped non-cycles), and one full end-to-end fixture project with a real circular
dependency, an alias import, and a deliberately broken import.

## Building for Production

```bash
npm run build -w @archlens/web
```

Output lands in `packages/web/dist/` — a fully static site. Serve with any static file
server (`npx serve packages/web/dist`); no backend required.

## Known MVP Boundaries (Intentionally Deferred)

- Only `.ts/.tsx/.js/.jsx/.vue` are parsed; other languages are out of scope.
- External (`node_modules`) packages are detected but not graphed as nodes.
- Image export (PNG/SVG of the graph) is not implemented; JSON and CSV export are.
- Multi-hop impact tracing beyond direct upstream/downstream is not implemented.

## Extension Points

- **New language support** — add a parser in `packages/core/src/parser/`, keep the same
  `RawImport[]` output shape, and wire it into `graphBuilder.ts`'s language dispatch.
- **New layout algorithm** — replace `packages/web/src/graph/layout.ts`; its only contract
  is `(nodes, edges) => Map<id, {x, y}>`.
- **New locale** — add `packages/web/src/i18n/locales/<code>.ts` implementing the `Locale`
  interface, then register it in `LocaleContext.tsx`.
- **CLI** — `@archlens/core`'s `analyzeProject` has no DOM/browser dependency, so a Node
  CLI can import it directly today.
