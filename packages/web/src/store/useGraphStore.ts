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

interface GraphState {
  status: AnalysisStatus;
  projectName: string;
  graph: NormalizedGraph | null;
  summary: AnalysisSummary | null;
  error: AnalysisError | null;

  // UI selection state — derived/transient, lives alongside the graph
  // because it only makes sense in the context of a loaded graph.
  selectedNodeId: string | null;
  selectedCycleIndex: number | null;
  searchQuery: string;
  sidePanelTab: "node" | "cycles" | "warnings";

  // actions
  runAnalysis: (projectName: string, files: InputFile[], alias: AliasConfig) => void;
  selectNode: (nodeId: string | null) => void;
  selectCycle: (index: number | null) => void;
  setSearchQuery: (query: string) => void;
  setSidePanelTab: (tab: "node" | "cycles" | "warnings") => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as AnalysisStatus,
  projectName: "",
  graph: null,
  summary: null,
  error: null,
  selectedNodeId: null,
  selectedCycleIndex: null,
  searchQuery: "",
  sidePanelTab: "cycles" as const,
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
          selectedCycleIndex: null,
          sidePanelTab: result.graph.cycles.length > 0 ? "cycles" : "warnings",
        });
      } else {
        set({ status: "error", error: result.error, graph: null, summary: null });
      }
    }, 0);
  },

  selectNode: (nodeId) =>
    set({ selectedNodeId: nodeId, sidePanelTab: nodeId ? "node" : "cycles" }),

  selectCycle: (index) => set({ selectedCycleIndex: index, selectedNodeId: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),

  reset: () => set({ ...initialState }),
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
