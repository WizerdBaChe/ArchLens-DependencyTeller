import { useGraphStore } from "../store/useGraphStore";
import { useLocale } from "../i18n";
import "./WarningListPanel.css";

export function WarningListPanel() {
  const graph = useGraphStore((s) => s.graph);
  const { t } = useLocale();

  if (!graph) return null;

  if (graph.warnings.length === 0) {
    return (
      <div className="warning-list warning-list--empty">
        <p>{t.warningList.empty}</p>
      </div>
    );
  }

  return (
    <ul className="warning-list">
      {graph.warnings.map((warning, index) => (
        <li key={index} className="warning-list__item">
          <span className="warning-list__code">
            {t.warningList.codes[warning.code] ?? warning.code}
          </span>
          <span className="warning-list__message">{warning.message}</span>
        </li>
      ))}
    </ul>
  );
}
