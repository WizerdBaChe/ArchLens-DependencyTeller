/**
 * @module index
 *
 * Public API surface of @archlens/core. Consumers (web UI, future CLI,
 * future VS Code extension) should only ever import from this file —
 * everything else under src/ is an internal implementation detail and may
 * change without notice. This is the low-coupling seam the RPD asks for.
 */
import { buildGraph } from "./graphBuilder.js";
import { detectCycles, markCircularMembers } from "./analyzer/detectCycles.js";
import { buildSummary, computeFanCounts, traceImpact } from "./analyzer/metrics.js";
import { validateInput } from "./validators/validateInput.js";
import type {
  AnalysisResult,
  AnalysisSummary,
  GraphEdge,
  ImpactTrace,
  NormalizedGraph,
  ProjectInput,
} from "./types.js";

export * from "./types.js";

/**
 * Runs the full pipeline: validate → parse → resolve → build graph →
 * detect cycles → compute metrics. Always returns a result — never throws —
 * so the UI can render an explicit error state instead of crashing.
 */
export function analyzeProject(input: ProjectInput): AnalysisResult {
  try {
    if (!input.files || input.files.length === 0) {
      return {
        ok: false,
        error: { code: "NO_INPUT", message: "No files were provided for analysis." },
      };
    }

    const { filesToParse, warnings: validationWarnings } = validateInput(input);

    if (filesToParse.length === 0) {
      return {
        ok: false,
        error: {
          code: "NO_SUPPORTED_FILES",
          message: "No supported source files (.ts, .tsx, .js, .jsx, .mts, .cts, .mjs, .cjs, .vue, .py, .pyi) were found among the provided input.",
          details: validationWarnings,
        },
      };
    }

    const { nodes, edges, warnings: buildWarnings, languages } = buildGraph(
      filesToParse,
      input.alias
    );

    const nodeIds = nodes.map((n) => n.id);
    const cycles = detectCycles(nodeIds, edges);
    const { circularNodeIds, circularEdgeKeys } = markCircularMembers(cycles);
    const { fanin, fanout } = computeFanCounts(nodeIds, edges);

    const finalEdges: GraphEdge[] = edges.map((edge) => ({
      ...edge,
      isCircular: circularEdgeKeys.has(`${edge.from}->${edge.to}`),
    }));

    const finalNodes = nodes.map((node) => {
      const fin = fanin.get(node.id) ?? 0;
      const fout = fanout.get(node.id) ?? 0;
      return {
        ...node,
        metrics: {
          fanin: fin,
          fanout: fout,
          isEntry: fin === 0 && fout > 0,
          isLeaf: fout === 0 && fin > 0,
          isCircular: circularNodeIds.has(node.id),
        },
      };
    });

    const graph: NormalizedGraph = {
      project: {
        name: input.projectName,
        root: "/",
        language: languages,
        fileCount: filesToParse.length,
      },
      nodes: finalNodes,
      edges: finalEdges,
      cycles,
      warnings: [...validationWarnings, ...buildWarnings],
    };

    return { ok: true, graph };
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: err instanceof Error ? err.message : "Unknown internal error during analysis.",
      },
    };
  }
}

/**
 * Derives project-level summary statistics from a normalized graph.
 * @param topN How many nodes to include in the top fan-in / fan-out rankings.
 *             Defaults to 5. Pass a larger value for CLI-style full rankings.
 */
export function summarize(graph: NormalizedGraph, topN = 5): AnalysisSummary {
  return buildSummary(graph.nodes, graph.edges.length, graph.cycles.length, graph.warnings.length, topN);
}

/**
 * Returns the direct (1-hop) upstream and downstream neighbours of a node.
 *
 * **Scope:** only direct edges are traversed — if you need transitive impact
 * across multiple hops, collect results recursively or filter `graph.edges`
 * directly.
 */
export function traceNodeImpact(graph: NormalizedGraph, nodeId: string): ImpactTrace {
  return traceImpact(nodeId, graph.edges);
}
