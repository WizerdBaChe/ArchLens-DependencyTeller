import dagre from "dagre";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

/** A node to lay out: an id, its rendered footprint, and its tier (for banding). */
export interface LayoutNode {
  id: string;
  width: number;
  height: number;
  /** Architectural layer — drives vertical banding so tiers don't interleave. */
  tier?: string;
}

export interface LayoutEdge {
  from: string;
  to: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 56;
const BAND_GAP = 120;
/** Vertical band order: lower index = higher on canvas. */
const TIER_BAND_ORDER = ["backend", "shared", "frontend", "unknown"];

/** Computes a layered (left-to-right) layout. Pure function: same input → same positions. */
export function computeLayout(
  nodes: LayoutNode[],
  edges: LayoutEdge[]
): Map<string, PositionedNode> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 36, ranksep: 90, marginx: 40, marginy: 40 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: node.width, height: node.height });
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

  return applyTierBands(nodes, positions);
}

/**
 * Separates tiers into stacked horizontal bands so a mixed frontend/backend
 * graph never interleaves the two vertically (the "crossed wires" problem).
 * dagre keeps full control of x (dependency depth) and of relative y within a
 * tier; we only translate each tier's whole block downward so the bands sit one
 * under another. No-op when the graph spans a single tier.
 */
function applyTierBands(
  nodes: LayoutNode[],
  positions: Map<string, PositionedNode>
): Map<string, PositionedNode> {
  const tiers = new Set(nodes.map((n) => n.tier).filter(Boolean) as string[]);
  if (tiers.size < 2) return positions;

  // Per-tier vertical extent from dagre's output.
  const extent = new Map<string, { min: number; max: number }>();
  for (const node of nodes) {
    if (!node.tier) continue;
    const pos = positions.get(node.id);
    if (!pos) continue;
    const half = node.height / 2;
    const e = extent.get(node.tier);
    const top = pos.y - half;
    const bottom = pos.y + half;
    if (!e) extent.set(node.tier, { min: top, max: bottom });
    else {
      e.min = Math.min(e.min, top);
      e.max = Math.max(e.max, bottom);
    }
  }

  // Order the present tiers and stack them, threading any unranked tiers last.
  const ordered = [...tiers].sort((a, b) => {
    const ia = TIER_BAND_ORDER.indexOf(a);
    const ib = TIER_BAND_ORDER.indexOf(b);
    return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
  });

  // Shift each tier so its band starts just below the previous one.
  const shift = new Map<string, number>();
  let cursor = 0;
  for (const tier of ordered) {
    const e = extent.get(tier);
    if (!e) continue;
    shift.set(tier, cursor - e.min);
    cursor += e.max - e.min + BAND_GAP;
  }

  const banded = new Map<string, PositionedNode>();
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const dy = node.tier ? shift.get(node.tier) ?? 0 : 0;
    banded.set(node.id, { id: node.id, x: pos.x, y: pos.y + dy });
  }
  return banded;
}

export const NODE_DIMENSIONS = { width: NODE_WIDTH, height: NODE_HEIGHT };
export const GROUP_DIMENSIONS = { width: 220, height: 64 };
