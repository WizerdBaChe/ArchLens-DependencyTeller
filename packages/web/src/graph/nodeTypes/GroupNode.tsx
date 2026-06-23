import { Handle, Position } from "reactflow";
import type { NodeProps } from "reactflow";
import type { NodeTier } from "@archlens/core";
import { useLocale } from "../../i18n";
import "./GroupNode.css";

export interface GroupNodeData {
  group: string;
  label: string;
  memberCount: number;
  /** Tiers spanned by the members — drives the side accent stripe(s). */
  tiers: NodeTier[];
  isCircular: boolean;
  isDimmed: boolean;
  isHighlighted: boolean;
  /** Expands this group back into individual file nodes. */
  onExpand: () => void;
}

export function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const { t } = useLocale();
  const tierClass = data.tiers.length === 1 ? `group-node--tier-${data.tiers[0]}` : "group-node--tier-mixed";

  return (
    <div
      className={[
        "group-node",
        tierClass,
        data.isCircular ? "group-node--circular" : "",
        selected ? "is-selected" : "",
        data.isDimmed ? "is-dimmed" : "",
        data.isHighlighted ? "is-highlighted" : "",
      ]
        .join(" ")
        .trim()}
      title={t.collapse.bodyHint}
    >
      <Handle type="target" position={Position.Left} className="group-node__port" />
      <div className="group-node__icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.2 1.4H11.5c.83 0 1.5.67 1.5 1.5V10c0 .83-.67 1.5-1.5 1.5h-9C1.67 11.5 1 10.83 1 10V3.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>
      <div className="group-node__body">
        <div className="group-node__label" title={data.label}>
          {data.label || "/"}
        </div>
        <div className="group-node__meta">{t.collapse.memberCount(data.memberCount)}</div>
      </div>
      <button
        type="button"
        className="group-node__expand"
        onClick={(e) => {
          e.stopPropagation();
          data.onExpand();
        }}
        aria-label={t.collapse.expandAria}
        title={t.collapse.expandAria}
      >
        +
      </button>
      <Handle type="source" position={Position.Right} className="group-node__port" />
    </div>
  );
}
