/**
 * @module types
 *
 * Source-of-truth data contracts for ArchLens Dependency.
 *
 * Design rule (low coupling): this file has zero imports. Every other module
 * in @archlens/core, and the web UI, depends on these shapes — but this file
 * depends on nothing. Changing internals elsewhere should never require
 * changing this file; changing this file is a deliberate schema change.
 */

// ---------------------------------------------------------------------------
// Input contracts (what callers give us)
// ---------------------------------------------------------------------------

/** A single source file handed to the analyzer. */
export interface InputFile {
  /** Project-relative, forward-slash path, e.g. "src/components/Button.tsx" */
  path: string;
  /** Raw file content (UTF-8 text). */
  content: string;
  /** Optional explicit language hint; inferred from extension if omitted. */
  language?: SupportedLanguage;
}

export type SupportedLanguage = "ts" | "tsx" | "js" | "jsx";

/** Alias map as authored by the user, e.g. { "@/*": "src/*" } (tsconfig-style). */
export type AliasConfig = Record<string, string>;

export interface ProjectInput {
  projectName: string;
  files: InputFile[];
  /** tsconfig-style path aliases. Optional. */
  alias?: AliasConfig;
  /** Glob-like prefixes/suffixes to exclude before parsing. Optional, MVP: simple substring/prefix match. */
  excludeGlobs?: string[];
  includeGlobs?: string[];
}

// ---------------------------------------------------------------------------
// Normalized graph model (the analysis output contract)
// ---------------------------------------------------------------------------

export type NodeKind = "file" | "external";

export interface NodeMetrics {
  fanin: number;
  fanout: number;
  isEntry: boolean;
  isLeaf: boolean;
  isCircular: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeKind;
  /** Directory grouping, e.g. "src/components". Empty string for project root files. */
  group: string;
  metrics: NodeMetrics;
}

export type EdgeKind = "import" | "require" | "dynamic-import" | "export-from";

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  isCircular: boolean;
}

/** A cycle is an ordered list of node ids where the first and last id are equal. */
export type Cycle = string[];

export type WarningCode =
  | "UNRESOLVED_IMPORT"
  | "PARSE_ERROR"
  | "EMPTY_FILE_SET"
  | "DUPLICATE_PATH";

export interface GraphWarning {
  code: WarningCode;
  path: string;
  raw: string;
  message: string;
}

export interface ProjectMeta {
  name: string;
  root: string;
  language: SupportedLanguage[];
  fileCount: number;
}

export interface NormalizedGraph {
  project: ProjectMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
  cycles: Cycle[];
  warnings: GraphWarning[];
}

// ---------------------------------------------------------------------------
// Analysis result wrapper (success/error state — never silently fail)
// ---------------------------------------------------------------------------

export type AnalysisResult =
  | { ok: true; graph: NormalizedGraph }
  | { ok: false; error: AnalysisError };

export interface AnalysisError {
  code: "NO_INPUT" | "NO_SUPPORTED_FILES" | "INTERNAL_ERROR";
  message: string;
  /** Any partial warnings collected before the failure, for debuggability. */
  details?: GraphWarning[];
}

// ---------------------------------------------------------------------------
// Derived view-model helpers (consumed by UI, computed from NormalizedGraph)
// ---------------------------------------------------------------------------

export interface ImpactTrace {
  nodeId: string;
  upstream: string[]; // who depends on this node (consumers)
  downstream: string[]; // what this node depends on
}

export interface AnalysisSummary {
  totalNodes: number;
  totalEdges: number;
  totalCycles: number;
  totalWarnings: number;
  topFanOut: Array<{ id: string; fanout: number }>;
  topFanIn: Array<{ id: string; fanin: number }>;
}
