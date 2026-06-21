import { useGraphStore } from "../store/useGraphStore";
import "./SummaryCards.css";

export function SummaryCards() {
  const summary = useGraphStore((s) => s.summary);
  const selectCycle = useGraphStore((s) => s.selectCycle);
  const setSidePanelTab = useGraphStore((s) => s.setSidePanelTab);

  if (!summary) return null;

  const hasCycles = summary.totalCycles > 0;

  return (
    <div className="summary-cards" role="group" aria-label="Analysis summary">
      <div className="summary-card">
        <span className="summary-card__value">{summary.totalNodes}</span>
        <span className="summary-card__label">modules</span>
      </div>
      <div className="summary-card">
        <span className="summary-card__value">{summary.totalEdges}</span>
        <span className="summary-card__label">dependencies</span>
      </div>
      <button
        type="button"
        className={`summary-card summary-card--button ${hasCycles ? "summary-card--alert" : ""}`}
        onClick={() => {
          setSidePanelTab("cycles");
          selectCycle(null);
        }}
        title="View circular dependencies"
      >
        <span className="summary-card__value">{summary.totalCycles}</span>
        <span className="summary-card__label">cycles</span>
      </button>
      <button
        type="button"
        className="summary-card summary-card--button"
        onClick={() => setSidePanelTab("warnings")}
        title="View warnings"
      >
        <span className="summary-card__value">{summary.totalWarnings}</span>
        <span className="summary-card__label">warnings</span>
      </button>
    </div>
  );
}
