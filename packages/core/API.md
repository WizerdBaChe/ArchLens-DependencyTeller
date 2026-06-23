# @archlens/core — API Reference

> This document is for **consumers** of the package (CLI authors, editor extension developers, etc.).
> For contributor / architecture notes, see the root [`dev_readme.md`](../../dev_readme.md).

## Installation

```bash
npm install @archlens/core
```

The package is pure ESM (`"type": "module"`). Node ≥ 18 required.
It has **one runtime dependency**: `typescript` (used as a parser, not a type-checker).

---

## Quick example

```ts
import { analyzeProject } from "@archlens/core";
import { readFileSync, readdirSync } from "node:fs";

// You are responsible for reading files from disk.
// The package has no fs dependency — it works in Node, Deno, browser, and Web Workers.
const files = readdirSync("src", { recursive: true, withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => ({
    path: e.parentPath.replace(/\\/g, "/").replace(/^src\//, "src/") + "/" + e.name,
    content: readFileSync(e.parentPath + "/" + e.name, "utf8"),
  }));

const result = analyzeProject({
  projectName: "my-app",
  files,
  alias: { "@/*": "src/*" },        // optional: tsconfig-style path aliases
  excludePatterns: ["**/*.test.*"], // optional: skip test files
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
  process.exit(1);
}

const { graph } = result;
console.log(`${graph.nodes.length} nodes, ${graph.edges.length} edges`);
console.log(`${graph.cycles.length} circular dependency groups`);
```

---

## API

### `analyzeProject(input: ProjectInput): AnalysisResult`

Runs the full pipeline: validate → parse → resolve → build graph → detect cycles → compute metrics.

**Never throws.** Always returns `AnalysisResult` — an error state is explicit, not an exception.

#### `ProjectInput`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | `string` | Yes | Display name embedded in `graph.project.name` |
| `files` | `InputFile[]` | Yes | All source files to analyse |
| `alias` | `AliasConfig` | No | tsconfig-style path aliases, e.g. `{ "@/*": "src/*" }` |
| `excludePatterns` | `string[]` | No | Skip files whose path matches any pattern (supports `*` wildcard) |
| `includePatterns` | `string[]` | No | Only parse files matching at least one pattern |

> **Pattern matching note:** `excludePatterns` / `includePatterns` support `*` as a single wildcard segment.
> They do **not** support `**`, `?`, or `{a,b}` brace expansion.
> For complex filtering, pre-filter the `files` array before passing it in.

#### `InputFile`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | `string` | Yes | Project-relative, forward-slash path: `"src/components/Button.tsx"` |
| `content` | `string` | Yes | Raw UTF-8 file content |
| `language` | `SupportedLanguage` | No | Language hint; inferred from extension if omitted |

`SupportedLanguage`: `"ts" | "tsx" | "js" | "jsx" | "vue"`

Supported extensions (auto-detected from `path`):
`.ts` `.tsx` `.js` `.jsx` `.mts` `.cts` `.mjs` `.cjs` `.vue`

#### `AnalysisResult`

Discriminated union — always check `result.ok` first:

```ts
if (result.ok) {
  result.graph // NormalizedGraph
} else {
  result.error.code    // "NO_INPUT" | "NO_SUPPORTED_FILES" | "INTERNAL_ERROR"
  result.error.message // human-readable description
  result.error.details // GraphWarning[] | undefined — partial warnings if available
}
```

---

### `summarize(graph: NormalizedGraph, topN?: number): AnalysisSummary`

Derives project-level summary statistics from a normalized graph.

```ts
const summary = summarize(graph);
// summary.totalNodes, totalEdges, totalCycles, totalWarnings
// summary.topFanOut   — [{ id, fanout }] top-N nodes by outgoing edges
// summary.topFanIn    — [{ id, fanin  }] top-N nodes by incoming edges
```

`topN` defaults to `5`. Pass a larger number for full CLI-style listings.

---

### `traceNodeImpact(graph: NormalizedGraph, nodeId: string): ImpactTrace`

Returns the **direct (1-hop)** upstream and downstream neighbours of a node.

```ts
const trace = traceNodeImpact(graph, "src/components/Button.tsx");
trace.upstream   // string[] — node IDs that import Button
trace.downstream // string[] — node IDs that Button imports
```

> **Scope:** only direct edges are traversed. For transitive impact across multiple
> hops, collect results recursively or filter `graph.edges` directly:
>
> ```ts
> // All nodes reachable downstream from a starting node (BFS)
> function reachableFrom(graph, startId) {
>   const visited = new Set();
>   const queue = [startId];
>   while (queue.length) {
>     const id = queue.shift();
>     for (const e of graph.edges.filter(e => e.from === id && !visited.has(e.to))) {
>       visited.add(e.to);
>       queue.push(e.to);
>     }
>   }
>   return visited;
> }
> ```

---

## Key types

```ts
interface NormalizedGraph {
  project: ProjectMeta;   // name, root, languages detected, fileCount
  nodes:   GraphNode[];   // one per source file + one per unique external package
  edges:   GraphEdge[];   // resolved import relationships
  cycles:  Cycle[];       // each cycle is string[] where first === last node
  warnings: GraphWarning[]; // UNRESOLVED_IMPORT | PARSE_ERROR | DUPLICATE_PATH
}

interface GraphNode {
  id:      string;       // same as InputFile.path
  label:   string;       // filename without directory
  type:    "file" | "external";
  group:   string;       // directory portion of id
  metrics: NodeMetrics;  // fanin, fanout, isEntry, isLeaf, isCircular
}

interface GraphEdge {
  id:         string;
  from:       string;    // source node id
  to:         string;    // target node id
  kind:       "import" | "require" | "dynamic-import" | "export-from";
  isCircular: boolean;
  crossTier:  boolean;   // true when it joins a frontend node to a backend node (either way)
}
```

---

## Scope & known boundaries

| Topic | Behaviour |
|-------|-----------|
| External packages | Detected and classified as `type: "external"` nodes; their sub-graph is **not** resolved |
| Template expressions in `.vue` | `<template>` bindings (`:is`, `<component>`) are **not** analysed — only `<script>` blocks |
| CSS / image imports | Silently ignored (not part of the module graph) |
| Cycle representation | One representative path per SCC group; multiple independent paths within the same cycle are not enumerated |
| Impact tracing | Direct (1-hop) only — see `traceNodeImpact` notes above for multi-hop workaround |
| `excludePatterns` glob | `*` wildcard only — no `**`, `?`, or `{a,b}` |
