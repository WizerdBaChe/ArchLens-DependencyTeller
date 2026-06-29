import { useGraphStore } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./ViolationsPanel.css";

export function ViolationsPanel() {
  const graph = useGraphStore((s) => s.graph);
  const selectNode = useGraphStore((s) => s.selectNode);
  const { t } = useLocale();

  const violations = graph?.violations ?? [];

  if (violations.length === 0) {
    return (
      <div className="violations-panel violations-panel--empty">
        <p>{t.violations.empty}</p>
      </div>
    );
  }

  return (
    <ul className="violations-panel">
      {violations.map((v) => (
        <li key={v.edgeId} className="violations-panel__item">
          <span className="violations-panel__rule">
            {t.violations.rule(v.fromLayer, v.toLayer)}
          </span>
          <div className="violations-panel__edge">
            <button
              type="button"
              className="violations-panel__node-btn"
              onClick={() => selectNode(v.from)}
            >
              {v.from}
            </button>
            <span className="violations-panel__arrow" aria-hidden>→</span>
            <button
              type="button"
              className="violations-panel__node-btn"
              onClick={() => selectNode(v.to)}
            >
              {v.to}
            </button>
          </div>
          {v.message && (
            <p className="violations-panel__message">{v.message}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
