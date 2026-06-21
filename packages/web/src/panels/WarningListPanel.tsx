import { useGraphStore } from "../store/useGraphStore";
import "./WarningListPanel.css";

const CODE_LABEL: Record<string, string> = {
  UNRESOLVED_IMPORT: "Unresolved import",
  PARSE_ERROR: "Parse error",
  EMPTY_FILE_SET: "Empty input",
  DUPLICATE_PATH: "Duplicate path",
};

export function WarningListPanel() {
  const graph = useGraphStore((s) => s.graph);
  if (!graph) return null;

  if (graph.warnings.length === 0) {
    return (
      <div className="warning-list warning-list--empty">
        <p>No warnings. Every import resolved cleanly. ✓</p>
      </div>
    );
  }

  return (
    <ul className="warning-list">
      {graph.warnings.map((warning, index) => (
        <li key={index} className="warning-list__item">
          <span className="warning-list__code">{CODE_LABEL[warning.code] ?? warning.code}</span>
          <span className="warning-list__message">{warning.message}</span>
        </li>
      ))}
    </ul>
  );
}
