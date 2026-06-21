# ArchLens Dependency

Interactive dependency graph & coupling analyzer for JavaScript/TypeScript projects.
Everything runs **in the browser** — no server, no upload of your source code.

## Architecture

```
packages/
  core/   @archlens/core   — pure analysis engine (parser → resolver → graph → analyzer)
                              Zero UI dependencies. Reusable from a CLI or editor extension later.
  web/    @archlens/web    — React + Vite UI. The only package that knows about React/ReactFlow.
```

The two packages talk through exactly one contract: `analyzeProject(input): AnalysisResult`,
defined in `packages/core/src/types.ts`. The web app's Zustand store
(`packages/web/src/store/useGraphStore.ts`) is the *only* file that calls it — every
component below that store only sees plain data, never the engine itself. That is the
seam that keeps the project low-coupling: you can replace the graph rendering library, the
input UI, or even move the engine into a Web Worker without touching the other side.

## Quick start

```bash
npm install                 # installs both workspace packages
npm run build -w @archlens/core   # build the engine once (web depends on its dist/ output)
npm run dev:web              # starts the Vite dev server for the UI
```

Open the printed local URL, then either:
- **Upload a .zip** of a real JS/TS project (drag-drop works), or
- **Paste files** using the block format shown in the placeholder:

  ```
  === src/app.ts ===
  import { Button } from "./components/Button";

  === src/components/Button.tsx ===
  export const Button = () => null;
  ```

Optional path aliases (tsconfig `"paths"`-style) can be entered as JSON, e.g. `{ "@/*": "src/*" }`.

## Running tests

```bash
npm test -w @archlens/core
```

26 unit + integration tests cover the parser (all 4 import styles), the resolver (relative /
index / alias / external resolution), Tarjan cycle detection (including self-loops and
diamond-shaped non-cycles), and one full end-to-end fixture project with a real circular
dependency, an alias import, and a deliberately broken import — mirroring the project's
acceptance criteria directly.

## Building for production

```bash
npm run build -w @archlens/web
```

Output lands in `packages/web/dist/` — a fully static site. Serve it with any static file
server (`npx serve packages/web/dist`); it does not need a backend.

## Known MVP boundaries (intentionally deferred)

- Only `.ts/.tsx/.js/.jsx` are parsed; other languages are out of scope for now.
- External (`node_modules`) packages are detected but not graphed as nodes — only internal
  project files appear in the visualization.
- Image export (PNG/SVG of the graph) is not implemented yet; JSON and CSV export are.
- Multi-hop impact tracing beyond direct upstream/downstream is not implemented yet.

## Extending it

- **New language support**: add a parser in `packages/core/src/parser/`, keep the same
  `RawImport[]` output shape, and wire it into `graphBuilder.ts`'s language dispatch.
- **New layout algorithm**: replace `packages/web/src/graph/layout.ts` — its only contract
  is `(nodes, edges) => Map<id, {x, y}>`.
- **CLI**: `@archlens/core`'s `analyzeProject` has no DOM/browser dependency, so a Node CLI
  can import it directly today.
