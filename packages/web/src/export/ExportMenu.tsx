import { useState } from "react";
import { useGraphStore } from "../store/useGraphStore";
import { downloadGraphAsJson } from "./exportJson";
import { downloadGraphAsCsv } from "./exportCsv";
import { downloadGraphAsPng, downloadGraphAsSvg } from "./exportImage";
import { useLocale } from "../i18n";
import "./ExportMenu.css";

export function ExportMenu() {
  const graph = useGraphStore((s) => s.graph);
  const { t } = useLocale();
  // Image capture is async; guard against double-clicks while it runs.
  const [capturing, setCapturing] = useState(false);

  if (!graph) return null;

  const captureImage = async (kind: "png" | "svg") => {
    if (capturing) return;
    setCapturing(true);
    try {
      const download = kind === "png" ? downloadGraphAsPng : downloadGraphAsSvg;
      await download(graph.project.name);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="export-menu">
      <button type="button" onClick={() => downloadGraphAsJson(graph)} title={t.exportMenu.titleJson}>
        {t.exportMenu.exportJson}
      </button>
      <button type="button" onClick={() => downloadGraphAsCsv(graph)} title={t.exportMenu.titleCsv}>
        {t.exportMenu.exportCsv}
      </button>
      <button type="button" onClick={() => captureImage("png")} disabled={capturing} title={t.exportMenu.titlePng}>
        {t.exportMenu.exportPng}
      </button>
      <button type="button" onClick={() => captureImage("svg")} disabled={capturing} title={t.exportMenu.titleSvg}>
        {t.exportMenu.exportSvg}
      </button>
    </div>
  );
}
