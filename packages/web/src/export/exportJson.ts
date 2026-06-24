import type { NormalizedGraph } from "@archlens/core";
import { wrap } from "../schema/archlensSchema";

export function downloadGraphAsJson(graph: NormalizedGraph): void {
  // 包進 ArchLens 系列共用信封（kind: "graph"），讓輸出與 web/diff/docsgap 一致，
  // 未來可被消費（Layer B）。payload 仍是原本完整的 NormalizedGraph。
  const envelope = wrap("graph", graph, {
    product: "dependency",
    name: graph.project.name,
    generatedAt: new Date().toISOString(),
  });
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: "application/json" });
  triggerDownload(blob, `${sanitizeFileName(graph.project.name)}-dependency-report.json`);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "project";
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
