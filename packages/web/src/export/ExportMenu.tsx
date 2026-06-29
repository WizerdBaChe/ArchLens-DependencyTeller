import { useEffect, useRef, useState } from "react";
import { useGraphStore } from "../store/useGraphStore";
import { downloadGraphAsJson } from "./exportJson";
import { downloadGraphAsCsv } from "./exportCsv";
import { downloadGraphAsPng, downloadGraphAsSvg } from "./exportImage";
import { downloadBriefing } from "./exportBriefing";
import { useLocale } from "../i18n";
import "./ExportMenu.css";

export function ExportMenu() {
  const graph = useGraphStore((s) => s.graph);
  const { t } = useLocale();
  // Image capture is async; guard against double-clicks while it runs.
  const [capturing, setCapturing] = useState(false);
  // Collapsed into a single dropdown so the topbar can stay on one row even at
  // narrow widths (four inline export buttons were the widest topbar block).
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape — standard dropdown dismissal.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

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

  const run = (fn: () => void | Promise<void>) => {
    setOpen(false);
    void fn();
  };

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        type="button"
        className="export-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.exportMenu.exportAria}
        onClick={() => setOpen((v) => !v)}
      >
        {t.exportMenu.exportLabel}
        <span className="export-menu__caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="export-menu__list" role="menu">
          <button type="button" role="menuitem" onClick={() => run(() => downloadGraphAsJson(graph))} title={t.exportMenu.titleJson}>
            {t.exportMenu.exportJson}
          </button>
          <button type="button" role="menuitem" onClick={() => run(() => downloadGraphAsCsv(graph))} title={t.exportMenu.titleCsv}>
            {t.exportMenu.exportCsv}
          </button>
          <button type="button" role="menuitem" onClick={() => run(() => captureImage("png"))} disabled={capturing} title={t.exportMenu.titlePng}>
            {t.exportMenu.exportPng}
          </button>
          <button type="button" role="menuitem" onClick={() => run(() => captureImage("svg"))} disabled={capturing} title={t.exportMenu.titleSvg}>
            {t.exportMenu.exportSvg}
          </button>
          <button type="button" role="menuitem" onClick={() => run(() => downloadBriefing(graph))} title={t.exportMenu.titleBriefing}>
            {t.exportMenu.exportBriefing}
          </button>
        </div>
      )}
    </div>
  );
}
