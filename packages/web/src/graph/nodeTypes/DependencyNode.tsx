import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import { useLocale } from "../../i18n";
import "./DependencyNode.css";

export interface DependencyNodeData {
  label: string;
  group: string;
  fanin: number;
  fanout: number;
  isEntry: boolean;
  isLeaf: boolean;
  isCircular: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
}

export function DependencyNode({ data, selected }: NodeProps<DependencyNodeData>) {
  const role = data.isCircular ? "circular" : data.isEntry ? "entry" : data.isLeaf ? "leaf" : "default";
  const { t } = useLocale();

  return (
    <div
      className={[
        "dep-node",
        `dep-node--${role}`,
        selected ? "is-selected" : "",
        data.isDimmed ? "is-dimmed" : "",
        data.isHighlighted ? "is-highlighted" : "",
      ].join(" ").trim()}
    >
      <Handle type="target" position={Position.Left} className="dep-node__port" />
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
