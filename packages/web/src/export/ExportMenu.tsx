import { useGraphStore } from "../store/useGraphStore";
import { downloadGraphAsJson } from "./exportJson";
import { downloadGraphAsCsv } from "./exportCsv";
import "./ExportMenu.css";

export function ExportMenu() {
  const graph = useGraphStore((s) => s.graph);
  if (!graph) return null;

  return (
    <div className="export-menu">
      <button type="button" onClick={() => downloadGraphAsJson(graph)} title="Export full graph as JSON">
        Export JSON
      </button>
      <button type="button" onClick={() => downloadGraphAsCsv(graph)} title="Export node/edge summary as CSV">
        Export CSV
      </button>
    </div>
  );
}
