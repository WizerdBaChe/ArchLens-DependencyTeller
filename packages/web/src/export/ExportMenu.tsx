import { useGraphStore } from "../store/useGraphStore";
import { downloadGraphAsJson } from "./exportJson";
import { downloadGraphAsCsv } from "./exportCsv";
import { useLocale } from "../i18n";
import "./ExportMenu.css";

export function ExportMenu() {
  const graph = useGraphStore((s) => s.graph);
  const { t } = useLocale();

  if (!graph) return null;

  return (
    <div className="export-menu">
      <button type="button" onClick={() => downloadGraphAsJson(graph)} title={t.exportMenu.titleJson}>
        {t.exportMenu.exportJson}
      </button>
      <button type="button" onClick={() => downloadGraphAsCsv(graph)} title={t.exportMenu.titleCsv}>
        {t.exportMenu.exportCsv}
      </button>
    </div>
  );
}
