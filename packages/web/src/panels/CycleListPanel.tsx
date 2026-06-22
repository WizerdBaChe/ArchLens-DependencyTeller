import { useGraphStore } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./CycleListPanel.css";

export function CycleListPanel() {
  const graph = useGraphStore((s) => s.graph);
  const selectedCycleIndex = useGraphStore((s) => s.selectedCycleIndex);
  const selectCycle = useGraphStore((s) => s.selectCycle);
  const { t } = useLocale();

  if (!graph) return null;

  if (graph.cycles.length === 0) {
    return (
      <div className="cycle-list cycle-list--empty">
        <p>{t.cycleList.empty}</p>
      </div>
    );
  }

  return (
    <ul className="cycle-list">
      {graph.cycles.map((cycle, index) => (
        <li key={index}>
          <button
            type="button"
            className={`cycle-list__item ${selectedCycleIndex === index ? "is-selected" : ""}`}
            onClick={() => selectCycle(selectedCycleIndex === index ? null : index)}
          >
            <span className="cycle-list__index">{t.cycleList.cycleLabel(index)}</span>
            <span className="cycle-list__path">{cycle.join(" → ")}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
