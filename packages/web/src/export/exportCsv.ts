import type { NormalizedGraph } from "@archlens/core";
import { sanitizeFileName, triggerDownload } from "./exportJson";

function csvEscape(value: string | number | boolean): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function downloadGraphAsCsv(graph: NormalizedGraph): void {
  const nodeHeader = ["id", "group", "tier", "tierReason", "fanin", "fanout", "isEntry", "isLeaf", "isCircular", "isIsolated"];
  const nodeRows = graph.nodes.map((n) =>
    [n.id, n.group, n.tier, n.tierReason, n.metrics.fanin, n.metrics.fanout, n.metrics.isEntry, n.metrics.isLeaf, n.metrics.isCircular, n.metrics.isIsolated]
      .map(csvEscape)
      .join(",")
  );

  const edgeHeader = ["id", "from", "to", "kind", "isCircular", "crossTier"];
  const edgeRows = graph.edges.map((e) =>
    [e.id, e.from, e.to, e.kind, e.isCircular, e.crossTier ?? false].map(csvEscape).join(",")
  );

  const csv = [
    "# nodes",
    nodeHeader.join(","),
    ...nodeRows,
    "",
    "# edges",
    edgeHeader.join(","),
    ...edgeRows,
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  triggerDownload(blob, `${sanitizeFileName(graph.project.name)}-dependency-report.csv`);
}
