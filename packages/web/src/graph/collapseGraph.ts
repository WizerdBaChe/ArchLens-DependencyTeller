import type { GraphEdge, GraphNode, NodeTier } from "@archlens/core";

/**
 * A node in the *display* graph. Either a real file node (kind "file", carrying
 * the original GraphNode) or an aggregate standing in for a collapsed directory
 * group (kind "group", carrying the member count and the tiers it spans).
 */
export type DisplayNode =
  | { kind: "file"; id: string; node: GraphNode }
  | {
      kind: "group";
      id: string;
      group: string;
      label: string;
      memberCount: number;
      tiers: NodeTier[];
      isCircular: boolean;
    };

export interface DisplayEdge {
  id: string;
  from: string;
  to: string;
  isCircular: boolean;
  /** Crosses the frontend/backend boundary (sticky across a folded bundle). */
  crossTier: boolean;
}

export interface DisplayGraph {
  nodes: DisplayNode[];
  edges: DisplayEdge[];
  /** Maps every real node id to the display id it currently resolves to. */
  resolve: (realId: string) => string;
}

const GROUP_PREFIX = "group:";

/** Display id for a collapsed group. Namespaced so it can never collide with a file id. */
export function groupDisplayId(group: string): string {
  return GROUP_PREFIX + group;
}

export function isGroupDisplayId(id: string): boolean {
  return id.startsWith(GROUP_PREFIX);
}

/**
 * Folds the real graph into a display graph given the set of collapsed groups.
 * Members of a collapsed group disappear into one aggregate node; intra-group
 * edges vanish and inter-group edges are rehomed onto the aggregate (deduped,
 * self-loops dropped). Pure: same inputs → same output.
 */
export function buildDisplayGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  collapsedGroups: Set<string>
): DisplayGraph {
  // Only collapse groups that are both requested and actually present.
  const presentGroups = new Set(nodes.map((n) => n.group).filter(Boolean));
  const active = new Set([...collapsedGroups].filter((g) => presentGroups.has(g)));

  const idToDisplay = new Map<string, string>();
  for (const n of nodes) {
    idToDisplay.set(n.id, active.has(n.group) ? groupDisplayId(n.group) : n.id);
  }

  // --- Display nodes ---
  const displayNodes: DisplayNode[] = [];
  const groupAgg = new Map<
    string,
    { members: GraphNode[]; tiers: Set<NodeTier>; circular: boolean }
  >();

  for (const n of nodes) {
    if (active.has(n.group)) {
      let agg = groupAgg.get(n.group);
      if (!agg) {
        agg = { members: [], tiers: new Set(), circular: false };
        groupAgg.set(n.group, agg);
      }
      agg.members.push(n);
      agg.tiers.add(n.tier);
      if (n.metrics.isCircular) agg.circular = true;
    } else {
      displayNodes.push({ kind: "file", id: n.id, node: n });
    }
  }

  for (const [group, agg] of groupAgg) {
    displayNodes.push({
      kind: "group",
      id: groupDisplayId(group),
      group,
      label: group,
      memberCount: agg.members.length,
      tiers: [...agg.tiers],
      isCircular: agg.circular,
    });
  }

  // --- Display edges (remapped + deduped, self-loops dropped) ---
  const seen = new Map<string, DisplayEdge>();
  for (const e of edges) {
    const from = idToDisplay.get(e.from) ?? e.from;
    const to = idToDisplay.get(e.to) ?? e.to;
    if (from === to) continue; // intra-group edge collapses away
    const key = `${from} ${to}`;
    const existing = seen.get(key);
    if (existing) {
      // Keep circular / cross-tier flags sticky so a folded bundle still reads
      // as circular or boundary-crossing if any member edge was.
      if (e.isCircular) existing.isCircular = true;
      if (e.crossTier) existing.crossTier = true;
      continue;
    }
    seen.set(key, {
      id: `d:${from}->${to}`,
      from,
      to,
      isCircular: e.isCircular,
      crossTier: e.crossTier ?? false,
    });
  }

  return {
    nodes: displayNodes,
    edges: [...seen.values()],
    resolve: (realId: string) => idToDisplay.get(realId) ?? realId,
  };
}
