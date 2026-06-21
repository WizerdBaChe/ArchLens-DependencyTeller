import { describe, expect, it } from "vitest";
import { detectCycles, markCircularMembers } from "../analyzer/detectCycles.js";
import type { GraphEdge } from "../types.js";

function edge(from: string, to: string): GraphEdge {
  return { id: `${from}->${to}`, from, to, kind: "import", isCircular: false };
}

describe("detectCycles", () => {
  it("finds no cycles in an acyclic graph", () => {
    const edges = [edge("a", "b"), edge("b", "c")];
    expect(detectCycles(["a", "b", "c"], edges)).toEqual([]);
  });

  it("detects a direct 2-node cycle", () => {
    const edges = [edge("a", "b"), edge("b", "a")];
    const cycles = detectCycles(["a", "b"], edges);
    expect(cycles).toHaveLength(1);
    expect(cycles[0]![0]).toBe(cycles[0]![cycles[0]!.length - 1]);
    expect(new Set(cycles[0])).toEqual(new Set(["a", "b"]));
  });

  it("detects a 3-node cycle", () => {
    const edges = [edge("a", "b"), edge("b", "c"), edge("c", "a")];
    const cycles = detectCycles(["a", "b", "c"], edges);
    expect(cycles).toHaveLength(1);
    expect(new Set(cycles[0])).toEqual(new Set(["a", "b", "c"]));
  });

  it("detects a self-loop", () => {
    const edges = [edge("a", "a")];
    const cycles = detectCycles(["a"], edges);
    expect(cycles).toEqual([["a", "a"]]);
  });

  it("does not flag a diamond dependency (b and c both depend on shared d) as circular", () => {
    const edges = [edge("a", "b"), edge("a", "c"), edge("b", "d"), edge("c", "d")];
    expect(detectCycles(["a", "b", "c", "d"], edges)).toEqual([]);
  });

  it("marks circular members correctly", () => {
    const cycles = [["a", "b", "a"]];
    const { circularNodeIds, circularEdgeKeys } = markCircularMembers(cycles);
    expect(circularNodeIds).toEqual(new Set(["a", "b"]));
    expect(circularEdgeKeys.has("a->b")).toBe(true);
    expect(circularEdgeKeys.has("b->a")).toBe(true);
  });
});
