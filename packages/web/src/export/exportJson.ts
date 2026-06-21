import type { NormalizedGraph } from "@archlens/core";

export function downloadGraphAsJson(graph: NormalizedGraph): void {
  const blob = new Blob([JSON.stringify(graph, null, 2)], { type: "application/json" });
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
