import { useGraphStore } from "../store/useGraphStore";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { CycleListPanel } from "./CycleListPanel";
import { WarningListPanel } from "./WarningListPanel";
import "./SidePanel.css";

const TABS = [
  { id: "node" as const, label: "Node" },
  { id: "cycles" as const, label: "Cycles" },
  { id: "warnings" as const, label: "Warnings" },
];

export function SidePanel() {
  const tab = useGraphStore((s) => s.sidePanelTab);
  const setTab = useGraphStore((s) => s.setSidePanelTab);
  const summary = useGraphStore((s) => s.summary);

  const countFor = (id: typeof TABS[number]["id"]) => {
    if (!summary) return undefined;
    if (id === "cycles") return summary.totalCycles;
    if (id === "warnings") return summary.totalWarnings;
    return undefined;
  };

  return (
    <aside className="side-panel" aria-label="Analysis details">
      <div className="side-panel__tabs" role="tablist">
        {TABS.map((t) => {
          const count = countFor(t.id);
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`side-panel__tab ${tab === t.id ? "is-active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {typeof count === "number" && <span className="side-panel__count">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="side-panel__content scroll-region">
        {tab === "node" && <NodeDetailPanel />}
        {tab === "cycles" && <CycleListPanel />}
        {tab === "warnings" && <WarningListPanel />}
      </div>
    </aside>
  );
}
