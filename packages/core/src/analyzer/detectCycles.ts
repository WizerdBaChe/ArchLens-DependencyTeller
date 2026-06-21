/**
 * @module analyzer/detectCycles
 *
 * Responsibility: given the resolved edge list, find every circular
 * dependency. Uses Tarjan's SCC algorithm so it scales to large graphs
 * (linear time in nodes + edges) rather than naive path enumeration.
 *
 * A strongly-connected component with >1 node is a cycle group. We then
 * extract one representative concrete cycle path per group (not all possible
 * paths — RPD's example schema shows one path per cycle, e.g. ["a","b","a"]).
 */
import type { Cycle, GraphEdge } from "../types.js";

export function detectCycles(nodeIds: string[], edges: GraphEdge[]): Cycle[] {
  const adjacency = new Map<string, string[]>();
  for (const id of nodeIds) adjacency.set(id, []);
  for (const edge of edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from)!.push(edge.to);
  }

  // --- Tarjan's SCC ---
  let index = 0;
  const indices = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const onStack = new Map<string, boolean>();
  const stack: string[] = [];
  const sccs: string[][] = [];

  const strongConnect = (v: string): void => {
    indices.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.set(v, true);

    for (const w of adjacency.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.get(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const component: string[] = [];
      let w: string;
      do {
        w = stack.pop()!;
        onStack.set(w, false);
        component.push(w);
      } while (w !== v);
      sccs.push(component);
    }
  };

  for (const id of nodeIds) {
    if (!indices.has(id)) strongConnect(id);
  }

  // A self-loop (a node importing itself) is also a cycle even though Tarjan
  // reports it as a size-1 SCC; detect that separately.
  const selfLoops = new Set(
    edges.filter((e) => e.from === e.to).map((e) => e.from)
  );

  const cycles: Cycle[] = [];

  for (const component of sccs) {
    if (component.length > 1) {
      cycles.push(extractRepresentativePath(component, adjacency));
    } else if (selfLoops.has(component[0]!)) {
      const node = component[0]!;
      cycles.push([node, node]);
    }
  }

  return cycles;
}

/** Walks one concrete cycle path inside a strongly-connected component. */
function extractRepresentativePath(
  component: string[],
  adjacency: Map<string, string[]>
): Cycle {
  const componentSet = new Set(component);
  const start = component[0]!;
  const path: string[] = [start];
  const visited = new Set<string>([start]);
  let current = start;

  // Bounded walk — component size is the max possible distinct hops.
  for (let i = 0; i < component.length; i += 1) {
    const neighbors = (adjacency.get(current) ?? []).filter((n) => componentSet.has(n));
    const backToStart = neighbors.find((n) => n === start);
    const unvisitedNext = neighbors.find((n) => !visited.has(n));

    if (backToStart && path.length > 1) {
      path.push(start);
      return path;
    }
    if (unvisitedNext) {
      path.push(unvisitedNext);
      visited.add(unvisitedNext);
      current = unvisitedNext;
    } else if (neighbors.length > 0) {
      path.push(neighbors[0]!);
      return path;
    } else {
      break;
    }
  }
  // Fallback: close the loop back to start even if we couldn't trace cleanly.
  path.push(start);
  return path;
}

/** Marks edges/nodes that participate in any detected cycle. */
export function markCircularMembers(cycles: Cycle[]): {
  circularNodeIds: Set<string>;
  circularEdgeKeys: Set<string>;
} {
  const circularNodeIds = new Set<string>();
  const circularEdgeKeys = new Set<string>();

  for (const cycle of cycles) {
    for (const id of cycle) circularNodeIds.add(id);
    for (let i = 0; i < cycle.length - 1; i += 1) {
      circularEdgeKeys.add(`${cycle[i]}->${cycle[i + 1]}`);
    }
  }
  return { circularNodeIds, circularEdgeKeys };
}
