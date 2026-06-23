import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NodeTier } from "@archlens/core";
import { useLocale } from "../../i18n";
import "./DependencyNode.css";

export interface DependencyNodeData {
  label: string;
  group: string;
  /**
   * Architectural layer. Drives the node's SHAPE + background tint — an axis
   * kept fully separate from `role` (entry/leaf/circular), which owns the
   * border colour. The two never collide visually.
   */
  tier: NodeTier;
  fanin: number;
  fanout: number;
  isEntry: boolean;
  isLeaf: boolean;
  isCircular: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  /** Present when this file's directory can be folded back into a group node. */
  onCollapseGroup?: () => void;
}

export function DependencyNode({ data, selected }: NodeProps<DependencyNodeData>) {
  const role = data.isCircular ? "circular" : data.isEntry ? "entry" : data.isLeaf ? "leaf" : "default";
  const { t } = useLocale();

  return (
    <div
      className={[
        "dep-node",
        `dep-node--${role}`,
        `dep-node--tier-${data.tier}`,
        selected ? "is-selected" : "",
        data.isDimmed ? "is-dimmed" : "",
        data.isHighlighted ? "is-highlighted" : "",
      ].join(" ").trim()}
    >
      <Handle type="target" position={Position.Left} className="dep-node__port" />
      {data.onCollapseGroup && (
        <button
          type="button"
          className="dep-node__collapse"
          onClick={(e) => {
            e.stopPropagation();
            data.onCollapseGroup?.();
          }}
          aria-label={t.collapse.collapseGroupAria}
          title={t.collapse.collapseGroupHint(data.group)}
        >
          −
        </button>
      )}
      <div className="dep-node__group">{data.group || "/"}</div>
      <div className="dep-node__label" title={data.label}>{data.label}</div>
      <div className="dep-node__metrics">
        <span title={t.depNode.titleFanIn}>←{data.fanin}</span>
        <span title={t.depNode.titleFanOut}>{data.fanout}→</span>
      </div>
      <Handle type="source" position={Position.Right} className="dep-node__port" />
    </div>
  );
}
