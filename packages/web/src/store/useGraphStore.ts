import { create } from "zustand";
import { analyzeProject } from "@archlens/core";
import type {
  AliasConfig,
  AnalysisError,
  AnalysisSummary,
  GraphNode,
  ImpactTrace,
  InputFile,
  NormalizedGraph,
} from "@archlens/core";
import { summarize, traceNodeImpact } from "@archlens/core";

export type AnalysisStatus = "idle" | "analyzing" | "ready" | "error";

/** Which architectural layers are shown. "all" includes shared + unknown. */
export type TierFilter = "all" | "frontend" | "backend";

interface GraphState {
  status: AnalysisStatus;
  projectName: string;
  graph: NormalizedGraph | null;
  summary: AnalysisSummary | null;
  error: AnalysisError | null;

  // UI selection state — derived/transient, lives alongside the graph
  // because it only makes sense in the context of a loaded graph.
  selectedNodeId: string | null;
  /** A collapsed group selected for neighbour-highlight (no side panel). */
  selectedGroup: string | null;
  selectedCycleIndex: number | null;
  searchQuery: string;
  tierFilter: TierFilter;
  sidePanelTab: "node" | "cycles" | "warnings";
  /** Directory groups currently collapsed into a single aggregate node. */
  collapsedGroups: Set<string>;

  // actions
  runAnalysis: (projectName: string, files: InputFile[], alias: AliasConfig) => void;
  selectNode: (nodeId: string | null) => void;
  selectGroup: (group: string | null) => void;
  selectCycle: (index: number | null) => void;
  setSearchQuery: (query: string) => void;
  setTierFilter: (filter: TierFilter) => void;
  setSidePanelTab: (tab: "node" | "cycles" | "warnings") => void;
  toggleGroupCollapsed: (group: string) => void;
  collapseAllGroups: () => void;
  expandAllGroups: () => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as AnalysisStatus,
  projectName: "",
  graph: null,
  summary: null,
  error: null,
  selectedNodeId: null,
  selectedGroup: null,
  selectedCycleIndex: null,
  searchQuery: "",
  tierFilter: "all" as TierFilter,
  sidePanelTab: "cycles" as const,
  collapsedGroups: new Set<string>(),
};

export const useGraphStore = create<GraphState>((set) => ({
  ...initialState,

  runAnalysis: (projectName, files, alias) => {
    set({ status: "analyzing", error: null });

    // Analysis is synchronous CPU work; yield to the next tick first so the
    // "analyzing" state actually paints before the main thread blocks.
    setTimeout(() => {
      const result = analyzeProject({ projectName, files, alias });
      if (result.ok) {
        set({
          status: "ready",
          projectName,
          graph: result.graph,
          summary: summarize(result.graph),
          error: null,
          selectedNodeId: null,
          selectedGroup: null,
          selectedCycleIndex: null,
          sidePanelTab: result.graph.cycles.length > 0 ? "cycles" : "warnings",
          collapsedGroups: new Set<string>(),
        });
      } else {
        set({ status: "error", error: result.error, graph: null, summary: null });
      }
    }, 0);
  },

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId, selectedGroup: null, sidePanelTab: nodeId ? "node" : "cycles" }),

  // Selecting a group highlights its neighbours only — no side panel, and it
  // clears any node selection so the two highlight sources never compete.
  selectGroup: (group) => set({ selectedGroup: group, selectedNodeId: null }),

  selectCycle: (index) => set({ selectedCycleIndex: index, selectedNodeId: null, selectedGroup: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  // Switching tier clears any node selection: the two highlight systems
  // (selection neighbourhood vs. tier visibility) would otherwise intersect
  // into a confusing, often-empty focus set. Returning to a clean tier overview
  // keeps the filter legible.
  setTierFilter: (filter) =>
    set((state) => ({
      tierFilter: filter,
      selectedNodeId: null,
      selectedGroup: null,
      sidePanelTab: state.sidePanelTab === "node" ? "cycles" : state.sidePanelTab,
    })),

  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),

  toggleGroupCollapsed: (group) =>
    set((state) => {
      const next = new Set(state.collapsedGroups);
      const expanding = next.has(group);
      if (expanding) next.delete(group);
      else next.add(group);
      return {
        collapsedGroups: next,
        // Expanding a selected group dissolves it into files; drop its selection.
        selectedGroup: expanding && state.selectedGroup === group ? null : state.selectedGroup,
      };
    }),

  collapseAllGroups: () =>
    set((state) => ({
      collapsedGroups: state.graph ? selectCollapsibleGroups(state) : new Set<string>(),
    })),

  expandAllGroups: () => set({ collapsedGroups: new Set<string>(), selectedGroup: null }),

  reset: () => set({ ...initialState, collapsedGroups: new Set<string>() }),
}));

// ---------------------------------------------------------------------------
// Derived selectors — kept here (not duplicated per-component) so every
// consumer agrees on what "selected node" or "impact trace" means.
// ---------------------------------------------------------------------------

export function selectSelectedNode(state: GraphState): GraphNode | null {
  if (!state.graph || !state.selectedNodeId) return null;
  return state.graph.nodes.find((n) => n.id === state.selectedNodeId) ?? null;
}

export function selectImpactTrace(state: GraphState): ImpactTrace | null {
  if (!state.graph || !state.selectedNodeId) return null;
  return traceNodeImpact(state.graph, state.selectedNodeId);
}

export function selectFilteredNodeIds(state: GraphState): Set<string> | null {
  if (!state.graph || !state.searchQuery.trim()) return null;
  const q = state.searchQuery.trim().toLowerCase();
  return new Set(
    state.graph.nodes.filter((n) => n.id.toLowerCase().includes(q)).map((n) => n.id)
  );
}

/**
 * Directory groups worth collapsing: a non-root group ("" = project root files
 * stays expanded) holding at least two nodes. Collapsing a single-node group
 * would just rename it, so those are excluded.
 */
export function selectCollapsibleGroups(state: GraphState): Set<string> {
  if (!state.graph) return new Set();
  const counts = new Map<string, number>();
  for (const n of state.graph.nodes) {
    if (!n.group) continue;
    counts.set(n.group, (counts.get(n.group) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, c]) => c >= 2).map(([g]) => g));
}

/** The distinct tiers present in the current graph (used to decide whether to show tier UI). */
export function selectPresentTiers(state: GraphState): Set<string> {
  if (!state.graph) return new Set();
  return new Set(state.graph.nodes.map((n) => n.tier));
}

/**
 * Node ids kept visible by the current tier filter (null = no tier filtering,
 * everything visible). "shared"/"unknown" stay visible in every mode so utility
 * modules don't vanish when focusing one side. This is the seam that turns the
 * three states (frontend-only / backend-only / both) into one canvas instead of
 * separate windows.
 */
export function selectTierVisibleNodeIds(state: GraphState): Set<string> | null {
  if (!state.graph || state.tierFilter === "all") return null;
  return new Set(
    state.graph.nodes
      .filter((n) => n.tier === state.tierFilter || n.tier === "shared" || n.tier === "unknown")
      .map((n) => n.id)
  );
}
