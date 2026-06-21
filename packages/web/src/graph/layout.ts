import dagre from "dagre";
import type { GraphEdge, GraphNode } from "@archlens/core";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;

/** Computes a layered (top-to-bottom) layout. Pure function: same input → same positions. */
export function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, PositionedNode> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of edges) {
    g.setEdge(edge.from, edge.to);
  }

  dagre.layout(g);

  const positions = new Map<string, PositionedNode>();
  for (const node of nodes) {
    const pos = g.node(node.id);
    positions.set(node.id, { id: node.id, x: pos?.x ?? 0, y: pos?.y ?? 0 });
  }
  return positions;
}

export const NODE_DIMENSIONS = { width: NODE_WIDTH, height: NODE_HEIGHT };
