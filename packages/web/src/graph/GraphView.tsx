import { useEffect, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphEdge } from "@archlens/core";
import {
  useGraphStore,
  selectFilteredNodeIds,
  selectTierVisibleNodeIds,
  selectCollapsibleGroups,
  selectViolatingEdgeIds,
} from "../store/useGraphStore";
import { computeLayout, NODE_DIMENSIONS, GROUP_DIMENSIONS } from "./layout";
import { DependencyNode, type DependencyNodeData } from "./nodeTypes/DependencyNode";
import { GroupNode, type GroupNodeData } from "./nodeTypes/GroupNode";
import { buildDisplayGraph, groupDisplayId } from "./collapseGraph";
import { CollapseControls } from "./CollapseControls";
import { TierOverlay } from "./TierOverlay";
import "./GraphView.css";

const nodeTypes = { dependency: DependencyNode, group: GroupNode };

function buildBaseFocusSet(
  edges: GraphEdge[],
  selectedNodeId: string | null,
  selectedCycleIndex: number | null,
  cycles: string[][],
  filteredIds: Set<string> | null
): Set<string> | null {
  if (filteredIds) return filteredIds;

  if (selectedNodeId) {
    const set = new Set([selectedNodeId]);
    for (const e of edges) {
      if (e.from === selectedNodeId) set.add(e.to);
      if (e.to === selectedNodeId) set.add(e.from);
    }
    return set;
  }

  if (selectedCycleIndex !== null && cycles[selectedCycleIndex]) {
    return new Set(cycles[selectedCycleIndex]);
  }

  return null;
}

/**
 * Combines the base focus set (search / selection / cycle) with the tier-filter
 * visibility set. Both are "subset of visible ids, or null = all"; the result is
 * their intersection. This keeps tier filtering and the existing dim/highlight
 * mechanism on one code path instead of two competing systems.
 */
function buildFocusSet(
  edges: GraphEdge[],
  selectedNodeId: string | null,
  selectedCycleIndex: number | null,
  cycles: string[][],
  filteredIds: Set<string> | null,
  tierVisibleIds: Set<string> | null
): Set<string> | null {
  const base = buildBaseFocusSet(edges, selectedNodeId, selectedCycleIndex, cycles, filteredIds);
  if (!tierVisibleIds) return base;
  if (!base) return tierVisibleIds;
  return new Set([...base].filter((id) => tierVisibleIds.has(id)));
}

export function GraphView() {
  const graph = useGraphStore((s) => s.graph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedGroup = useGraphStore((s) => s.selectedGroup);
  const selectedCycleIndex = useGraphStore((s) => s.selectedCycleIndex);
  const selectNode = useGraphStore((s) => s.selectNode);
  const selectGroup = useGraphStore((s) => s.selectGroup);
  const collapsedGroups = useGraphStore((s) => s.collapsedGroups);
  const collapsibleGroups = useGraphStore(selectCollapsibleGroups);
  const toggleGroupCollapsed = useGraphStore((s) => s.toggleGroupCollapsed);
  const filteredIds = useGraphStore(selectFilteredNodeIds);
  const tierVisibleIds = useGraphStore(selectTierVisibleNodeIds);
  const violatingEdgeIds = useGraphStore(selectViolatingEdgeIds);
  const edgeStyle = useGraphStore((s) => s.edgeStyle);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<DependencyNodeData | GroupNodeData>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  // Whether this graph's initial fitView has run. Collapse/expand never refit —
  // the camera stays exactly where the user left it (any auto-reframe drifts
  // unpredictably as content changes), so the viewport only fits once on load.
  const hasFitRef = useRef(false);

  // Fold the real graph into the display graph (group aggregates + remapped edges).
  const display = useMemo(
    () => (graph ? buildDisplayGraph(graph.nodes, graph.edges, collapsedGroups) : null),
    [graph, collapsedGroups]
  );

  const layout = useMemo(
    () =>
      display
        ? computeLayout(
            display.nodes.map((n) => ({
              id: n.id,
              width: n.kind === "group" ? GROUP_DIMENSIONS.width : NODE_DIMENSIONS.width,
              height: n.kind === "group" ? GROUP_DIMENSIONS.height : NODE_DIMENSIONS.height,
              // A single-tier group bands with that tier; mixed groups stay
              // unbanded (treated as a bridge between bands).
              tier: n.kind === "group" ? (n.tiers.length === 1 ? n.tiers[0] : undefined) : n.node.tier,
            })),
            display.edges
          )
        : new Map(),
    [display]
  );

  const selectedGroupDisplayId = useMemo(
    () => (selectedGroup ? groupDisplayId(selectedGroup) : null),
    [selectedGroup]
  );

  // Focus is computed on the real graph, then projected onto display ids so a
  // collapsed group lights up when any member is in focus. A selected group is
  // resolved directly on the display graph (the aggregate node + its neighbours).
  const focusSet = useMemo(() => {
    if (!graph || !display) return null;

    if (selectedGroupDisplayId) {
      const set = new Set([selectedGroupDisplayId]);
      for (const e of display.edges) {
        if (e.from === selectedGroupDisplayId) set.add(e.to);
        if (e.to === selectedGroupDisplayId) set.add(e.from);
      }
      return set;
    }

    const realFocus = buildFocusSet(
      graph.edges,
      selectedNodeId,
      selectedCycleIndex,
      graph.cycles,
      filteredIds,
      tierVisibleIds
    );
    if (!realFocus) return null;
    const projected = new Set<string>();
    for (const id of realFocus) projected.add(display.resolve(id));
    return projected;
  }, [graph, display, selectedGroupDisplayId, selectedNodeId, selectedCycleIndex, filteredIds, tierVisibleIds]);

  const selectedDisplayId = useMemo(
    () => selectedGroupDisplayId ?? (selectedNodeId && display ? display.resolve(selectedNodeId) : null),
    [selectedGroupDisplayId, selectedNodeId, display]
  );

  // Each new graph fits once; arm the one-shot fit for its first render.
  useEffect(() => {
    hasFitRef.current = false;
  }, [graph]);

  useEffect(() => {
    if (!display) {
      setFlowNodes([]);
      setFlowEdges([]);
      return;
    }

    const nextNodes: Node<DependencyNodeData | GroupNodeData>[] = display.nodes.map((dn) => {
      const pos = layout.get(dn.id);
      const isFocused = focusSet ? focusSet.has(dn.id) : true;
      const position = { x: pos?.x ?? 0, y: pos?.y ?? 0 };

      if (dn.kind === "group") {
        return {
          id: dn.id,
          type: "group",
          position,
          selected: dn.id === selectedDisplayId,
          data: {
            group: dn.group,
            label: dn.label,
            memberCount: dn.memberCount,
            tiers: dn.tiers,
            isCircular: dn.isCircular,
            isDimmed: !isFocused,
            isHighlighted: !!focusSet?.has(dn.id) && dn.id !== selectedDisplayId,
            onExpand: () => toggleGroupCollapsed(dn.group),
          },
        };
      }

      const n = dn.node;
      // A file node whose directory is collapsible carries a collapse affordance,
      // so any expanded group can be folded back without the "expand all" round-trip.
      const collapsible = collapsibleGroups.has(n.group);
      return {
        id: dn.id,
        type: "dependency",
        position,
        selected: dn.id === selectedDisplayId,
        data: {
          label: n.label,
          group: n.group,
          tier: n.tier,
          fanin: n.metrics.fanin,
          fanout: n.metrics.fanout,
          isEntry: n.metrics.isEntry,
          isLeaf: n.metrics.isLeaf,
          isCircular: n.metrics.isCircular,
          isDimmed: !isFocused,
          isHighlighted: !!focusSet?.has(dn.id) && dn.id !== selectedDisplayId,
          onCollapseGroup: collapsible ? () => toggleGroupCollapsed(n.group) : undefined,
        },
      };
    });

    const nextEdges: Edge[] = display.edges.map((e) => {
      const isFocused = focusSet ? focusSet.has(e.from) && focusSet.has(e.to) : true;
      // Edge colour priority: violation (red, contract breach) > circular (amber) >
      // cross-tier (magenta, frontend↔backend) > normal (cyan dim).
      const isViolating = violatingEdgeIds.has(e.id);
      const stroke = isViolating
        ? "var(--color-accent-red)"
        : e.isCircular
        ? "var(--color-accent-amber)"
        : e.crossTier
        ? "var(--color-accent-magenta)"
        : "var(--color-accent-cyan-dim)";
      const markerColor = isViolating
        ? "#e5484d"
        : e.isCircular
        ? "#f5a524"
        : e.crossTier
        ? "#d6409f"
        : "#2c6e69";
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        // "smoothstep" routes orthogonally (right-angle bends), "default" is the
        // original soft bezier curve. User-toggleable via CollapseControls.
        type: edgeStyle === "smoothstep" ? "smoothstep" : "default",
        animated: e.isCircular,
        style: {
          stroke,
          strokeWidth: isViolating || e.isCircular || e.crossTier ? 2 : 1.25,
          strokeDasharray: isViolating ? "4 2" : e.isCircular ? "6 4" : e.crossTier ? "2 3" : undefined,
          opacity: isFocused ? 1 : 0.12,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: markerColor, width: 14, height: 14 },
      };
    });

    setFlowNodes(nextNodes);
    setFlowEdges(nextEdges);

    // Fit exactly once per graph (its first render). Collapse/expand, selection,
    // tier filter and search all leave the camera untouched — no auto-reframe,
    // so the viewport never drifts on its own.
    if (!hasFitRef.current) {
      hasFitRef.current = true;
      requestAnimationFrame(() => flowInstanceRef.current?.fitView({ padding: 0.2, duration: 250 }));
    }
  }, [display, layout, focusSet, selectedDisplayId, collapsibleGroups, violatingEdgeIds, edgeStyle, setFlowNodes, setFlowEdges, toggleGroupCollapsed]);

  if (!graph) return null;

  return (
    <div className="graph-view">
      <TierOverlay />
      <CollapseControls />
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => (flowInstanceRef.current = instance)}
        onNodeClick={(_, node) => {
          // Group body click highlights neighbours only (no side panel); the
          // in-node "+" button owns expansion.
          if (node.type === "group") {
            const data = node.data as GroupNodeData;
            selectGroup(data.group);
            return;
          }
          selectNode(node.id);
        }}
        onPaneClick={() => {
          selectNode(null);
          selectGroup(null);
        }}
        nodeTypes={nodeTypes}
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--color-grid-line)" />
        <Controls showInteractive={false} />
        {graph.nodes.length > 40 && (
          <MiniMap pannable zoomable maskColor="rgba(10,16,32,0.75)" nodeColor="#233252" />
        )}
      </ReactFlow>
    </div>
  );
}
