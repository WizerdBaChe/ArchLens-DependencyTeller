import { useGraphStore } from "../store/useGraphStore";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { CycleListPanel } from "./CycleListPanel";
import { WarningListPanel } from "./WarningListPanel";
import { HotspotsPanel } from "./HotspotsPanel";
import { useLocale } from "../i18n";
import "./SidePanel.css";

type TabId = "node" | "cycles" | "warnings" | "hotspots" | "violations";

export function SidePanel() {
  const tab = useGraphStore((s) => s.sidePanelTab);
  const setTab = useGraphStore((s) => s.setSidePanelTab);
  const summary = useGraphStore((s) => s.summary);
  const { t } = useLocale();

  const TABS: { id: TabId; label: string }[] = [
    { id: "node", label: t.sidePanel.tabNode },
    { id: "cycles", label: t.sidePanel.tabCycles },
    { id: "warnings", label: t.sidePanel.tabWarnings },
    { id: "hotspots", label: t.sidePanel.tabHotspots },
    { id: "violations", label: t.sidePanel.tabViolations },
  ];

  const countFor = (id: TabId) => {
    if (!summary) return undefined;
    if (id === "cycles") return summary.totalCycles;
    if (id === "warnings") return summary.totalWarnings;
    return undefined;
  };

  return (
    <aside className="side-panel" aria-label={t.sidePanel.ariaLabel}>
      <div className="side-panel__tabs" role="tablist">
        {TABS.map((tabItem) => {
          const count = countFor(tabItem.id);
          return (
            <button
              key={tabItem.id}
              role="tab"
              aria-selected={tab === tabItem.id}
              className={`side-panel__tab ${tab === tabItem.id ? "is-active" : ""}`}
              onClick={() => setTab(tabItem.id)}
            >
              {tabItem.label}
              {typeof count === "number" && <span className="side-panel__count">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="side-panel__content scroll-region">
        {tab === "node" && <NodeDetailPanel />}
        {tab === "cycles" && <CycleListPanel />}
        {tab === "warnings" && <WarningListPanel />}
        {tab === "hotspots" && <HotspotsPanel />}
        {tab === "violations" && (
          <div className="violations-placeholder">
            <p>{t.violations.empty}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
