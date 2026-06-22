import { useGraphStore } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./SummaryCards.css";

export function SummaryCards() {
  const summary = useGraphStore((s) => s.summary);
  const selectCycle = useGraphStore((s) => s.selectCycle);
  const setSidePanelTab = useGraphStore((s) => s.setSidePanelTab);
  const { t } = useLocale();

  if (!summary) return null;

  const hasCycles = summary.totalCycles > 0;

  return (
    <div className="summary-cards" role="group" aria-label={t.summary.ariaLabel}>
      <div className="summary-card">
        <span className="summary-card__value">{summary.totalNodes}</span>
        <span className="summary-card__label">{t.summary.modules}</span>
      </div>
      <div className="summary-card">
        <span className="summary-card__value">{summary.totalEdges}</span>
        <span className="summary-card__label">{t.summary.dependencies}</span>
      </div>
      <button
        type="button"
        className={`summary-card summary-card--button ${hasCycles ? "summary-card--alert" : ""}`}
        onClick={() => {
          setSidePanelTab("cycles");
          selectCycle(null);
        }}
        title={t.summary.titleCycles}
      >
        <span className="summary-card__value">{summary.totalCycles}</span>
        <span className="summary-card__label">{t.summary.cycles}</span>
      </button>
      <button
        type="button"
        className="summary-card summary-card--button"
        onClick={() => setSidePanelTab("warnings")}
        title={t.summary.titleWarnings}
      >
        <span className="summary-card__value">{summary.totalWarnings}</span>
        <span className="summary-card__label">{t.summary.warnings}</span>
      </button>
    </div>
  );
}
