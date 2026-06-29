import type { GraphEdge, ArchitectureContract, Violation } from "../types.js";

/**
 * Checks all edges against the contract rules and returns every violation.
 * Pure function: no side-effects, can be tested in isolation.
 *
 * @param edges       Final edges (with isCircular/crossTier already set).
 * @param layerOf     Node-id → layer names, from assignLayers().
 * @param contract    The parsed architecture contract.
 */
export function checkContract(
  edges: GraphEdge[],
  layerOf: Map<string, string[]>,
  contract: ArchitectureContract
): Violation[] {
  const violations: Violation[] = [];

  contract.rules.forEach((rule, ruleIndex) => {
    if (rule.type !== "forbid") return;
    for (const e of edges) {
      const fromLayers = layerOf.get(e.from) ?? [];
      const toLayers = layerOf.get(e.to) ?? [];
      if (fromLayers.includes(rule.from) && toLayers.includes(rule.to)) {
        violations.push({
          edgeId: e.id,
          from: e.from,
          to: e.to,
          fromLayer: rule.from,
          toLayer: rule.to,
          ruleIndex,
          message: rule.message ?? `${rule.from} → ${rule.to} is forbidden`,
        });
      }
    }
  });

  return violations;
}
