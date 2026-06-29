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

export type SupportedLanguage = "ts" | "tsx" | "js" | "jsx" | "vue" | "py";

/** Alias map as authored by the user, e.g. { "@/*": "src/*" } (tsconfig-style). */
export type AliasConfig = Record<string, string>;

export interface ProjectInput {
  projectName: string;
  files: InputFile[];
  /** tsconfig-style path aliases. Optional. */
  alias?: AliasConfig;
  /**
   * Substring/prefix patterns to exclude before parsing.
   * Supports `*` as a wildcard. Does NOT support `**` or `{a,b}` — for
   * advanced glob matching, pre-filter files before passing them in.
   * Example: `["src/generated/*", ".test."]`
   */
  excludePatterns?: string[];
  /**
   * When provided, only files matching at least one pattern are parsed.
   * Same matching rules as `excludePatterns`.
   */
  includePatterns?: string[];
  /** @deprecated Use `excludePatterns` instead. */
  excludeGlobs?: string[];
  /** @deprecated Use `includePatterns` instead. */
  includeGlobs?: string[];
}

// ---------------------------------------------------------------------------
// Normalized graph model (the analysis output contract)
// ---------------------------------------------------------------------------

export type NodeKind = "file" | "external";

/**
 * Architectural layer a node belongs to. Orthogonal to both `NodeKind`
 * (file vs external) and the visual "role" (entry/leaf/circular): a node has
 * exactly one tier AND one role at the same time. Language ≠ tier — a `.py`
 * file can be a Flask backend OR a PySide6/tkinter desktop GUI (frontend).
 */
export type NodeTier = "frontend" | "backend" | "shared" | "unknown";

/** How a node's tier was decided, surfaced in the UI so the inference is transparent. */
export type TierReason =
  | "framework-import" // highest confidence: a known framework import overrode the default
  | "extension-default" // decided by file extension alone
  | "user-override" // reserved: future manual assignment by the user
  | "fallback-unknown"; // nothing to go on

export interface NodeMetrics {
  fanin: number;
  fanout: number;
  isEntry: boolean;
  isLeaf: boolean;
  isCircular: boolean;
  /** fan-in 0 AND fan-out 0 — imported by nobody, imports nothing internal. */
  isIsolated: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  type: NodeKind;
  /** Directory grouping, e.g. "src/components". Empty string for project root files. */
  group: string;
  /** Architectural layer (frontend/backend/shared/unknown). Always set by the builder. */
  tier: NodeTier;
  /** Why `tier` was chosen — drives the "inferred from import flask" explanation in the UI. */
  tierReason: TierReason;
  /** The framework import that drove a `framework-import` decision, e.g. "flask". */
  tierEvidence?: string;
  metrics: NodeMetrics;
}

export type EdgeKind = "import" | "require" | "dynamic-import" | "export-from";

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  kind: EdgeKind;
  isCircular: boolean;
  /**
   * Whether this edge crosses the frontend/backend tier boundary.
   * Computed in index.ts via the tier lookup built after buildGraph().
   */
  crossTier?: boolean;
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
