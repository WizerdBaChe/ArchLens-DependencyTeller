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
import { useGraphStore, selectFilteredNodeIds } from "../store/useGraphStore";
import { computeLayout } from "./layout";
import { DependencyNode, type DependencyNodeData } from "./nodeTypes/DependencyNode";
import "./GraphView.css";

const nodeTypes = { dependency: DependencyNode };

function buildFocusSet(
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

export function GraphView() {
  const graph = useGraphStore((s) => s.graph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const selectedCycleIndex = useGraphStore((s) => s.selectedCycleIndex);
  const selectNode = useGraphStore((s) => s.selectNode);
  const filteredIds = useGraphStore(selectFilteredNodeIds);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState<DependencyNodeData>([]);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState([]);
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);

  const layout = useMemo(
    () => (graph ? computeLayout(graph.nodes, graph.edges) : new Map()),
    [graph]
  );

  const focusSet = useMemo(
    () =>
      graph
        ? buildFocusSet(graph.edges, selectedNodeId, selectedCycleIndex, graph.cycles, filteredIds)
        : null,
    [graph, selectedNodeId, selectedCycleIndex, filteredIds]
  );

  useEffect(() => {
    if (!graph) {
      setFlowNodes([]);
      setFlowEdges([]);
      return;
    }

    const nextNodes: Node<DependencyNodeData>[] = graph.nodes.map((n) => {
      const pos = layout.get(n.id);
      const isFocused = focusSet ? focusSet.has(n.id) : true;
      return {
        id: n.id,
        type: "dependency",
        position: { x: pos?.x ?? 0, y: pos?.y ?? 0 },
        data: {
          label: n.label,
          group: n.group,
          fanin: n.metrics.fanin,
          fanout: n.metrics.fanout,
          isEntry: n.metrics.isEntry,
          isLeaf: n.metrics.isLeaf,
          isCircular: n.metrics.isCircular,
          isDimmed: !isFocused,
          isHighlighted: !!focusSet?.has(n.id) && n.id !== selectedNodeId,
        },
      };
    });

    const nextEdges: Edge[] = graph.edges.map((e) => {
      const isFocused = focusSet ? focusSet.has(e.from) && focusSet.has(e.to) : true;
      return {
        id: e.id,
        source: e.from,
        target: e.to,
        animated: e.isCircular,
        style: {
          stroke: e.isCircular ? "var(--color-accent-amber)" : "var(--color-accent-cyan-dim)",
          strokeWidth: e.isCircular ? 2 : 1.25,
          strokeDasharray: e.isCircular ? "6 4" : undefined,
          opacity: isFocused ? 1 : 0.12,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: e.isCircular ? "#f5a524" : "#2c6e69", width: 14, height: 14 },
      };
    });

    setFlowNodes(nextNodes);
    setFlowEdges(nextEdges);

    requestAnimationFrame(() => flowInstanceRef.current?.fitView({ padding: 0.2, duration: 250 }));
  }, [graph, layout, focusSet, selectedNodeId, setFlowNodes, setFlowEdges]);

  if (!graph) return null;

  return (
    <div className="graph-view">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={(instance) => (flowInstanceRef.current = instance)}
        onNodeClick={(_, node) => selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
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
