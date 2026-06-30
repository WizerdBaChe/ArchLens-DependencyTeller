import { matchesPattern } from "../util/matchPattern.js";
import type { GraphNode, ArchitectureContract } from "../types.js";

/**
 * Maps each node's id (path) to the layer names it belongs to.
 * A node may belong to multiple layers if its path matches multiple globs.
 * Nodes with no matching layer are absent from the map.
 */
export function assignLayers(
  nodes: GraphNode[],
  layers: ArchitectureContract["layers"]
): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of nodes) {
    const hit = Object.entries(layers)
      .filter(([, globs]) => globs.some((g) => matchesPattern(n.id, g)))
      .map(([name]) => name);
    if (hit.length) out.set(n.id, hit);
  }
  return out;
}
