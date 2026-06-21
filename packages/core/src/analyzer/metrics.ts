/**
 * @module analyzer/metrics
 *
 * Responsibility: derive per-node metrics and project-level summaries from
 * nodes + edges. No parsing, no resolution — just graph math.
 */
import type { AnalysisSummary, GraphEdge, GraphNode, ImpactTrace } from "../types.js";

export interface FanCounts {
  fanin: Map<string, number>;
  fanout: Map<string, number>;
}

export function computeFanCounts(nodeIds: string[], edges: GraphEdge[]): FanCounts {
  const fanin = new Map<string, number>(nodeIds.map((id) => [id, 0]));
  const fanout = new Map<string, number>(nodeIds.map((id) => [id, 0]));

  for (const edge of edges) {
    fanout.set(edge.from, (fanout.get(edge.from) ?? 0) + 1);
    if (fanin.has(edge.to)) {
      fanin.set(edge.to, (fanin.get(edge.to) ?? 0) + 1);
    }
  }
  return { fanin, fanout };
}

export function buildSummary(nodes: GraphNode[], totalEdges: number, totalCycles: number, totalWarnings: number, topN = 5): AnalysisSummary {
  const byFanOut = [...nodes].sort((a, b) => b.metrics.fanout - a.metrics.fanout).slice(0, topN);
  const byFanIn = [...nodes].sort((a, b) => b.metrics.fanin - a.metrics.fanin).slice(0, topN);

  return {
    totalNodes: nodes.length,
    totalEdges,
    totalCycles,
    totalWarnings,
    topFanOut: byFanOut.map((n) => ({ id: n.id, fanout: n.metrics.fanout })),
    topFanIn: byFanIn.map((n) => ({ id: n.id, fanin: n.metrics.fanin })),
  };
}

/** Single-node upstream/downstream trace — direct dependents and dependencies only (1 hop, MVP scope). */
export function traceImpact(nodeId: string, edges: GraphEdge[]): ImpactTrace {
  const upstream = edges.filter((e) => e.to === nodeId).map((e) => e.from);
  const downstream = edges.filter((e) => e.from === nodeId).map((e) => e.to);
  return { nodeId, upstream, downstream };
}
