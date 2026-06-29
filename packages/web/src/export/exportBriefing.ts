import type { NormalizedGraph } from "@archlens/core";
import { sanitizeFileName, triggerDownload } from "./exportJson.js";

/**
 * Builds a compact Markdown briefing suitable for pasting directly into an AI
 * prompt. Covers the four facts an AI needs most: project scale, load-bearing
 * modules, contract violations, and isolated files.
 */
export function buildBriefingMarkdown(graph: NormalizedGraph, topN = 10): string {
  const { project, nodes, edges, cycles, violations } = graph;
  const lines: string[] = [];

  // Project overview
  lines.push(`## Project: ${project.name}`);
  lines.push(`- Files: ${project.fileCount}`);
  lines.push(`- Dependencies: ${edges.length}`);
  lines.push(`- Cycles: ${cycles.length}`);
  if (violations.length > 0) lines.push(`- Violations: ${violations.length}`);
  lines.push("");

  // Load-bearing modules (fan-in top N)
  const byFanIn = [...nodes]
    .filter((n) => n.metrics.fanin > 0)
    .sort((a, b) => b.metrics.fanin - a.metrics.fanin)
    .slice(0, topN);
  lines.push(`## Load-bearing modules (fan-in top ${byFanIn.length})`);
  if (byFanIn.length === 0) {
    lines.push("- (none)");
  } else {
    for (const n of byFanIn) {
      lines.push(`- \`${n.id}\`  fan-in: ${n.metrics.fanin}  fan-out: ${n.metrics.fanout}`);
    }
  }
  lines.push("");

  // Contract violations
  if (violations.length > 0) {
    lines.push(`## Contract violations (${violations.length})`);
    for (const v of violations) {
      lines.push(`- [${v.fromLayer} → ${v.toLayer}] \`${v.from}\` → \`${v.to}\``);
      if (v.message) lines.push(`  _${v.message}_`);
    }
    lines.push("");
  }

  // Isolated files
  const isolated = nodes.filter((n) => n.metrics.isIsolated);
  if (isolated.length > 0) {
    lines.push(`## Isolated files (${isolated.length})`);
    for (const n of isolated) {
      lines.push(`- \`${n.id}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadBriefing(graph: NormalizedGraph): void {
  const md = buildBriefingMarkdown(graph);
  triggerDownload(
    new Blob([md], { type: "text/markdown" }),
    `${sanitizeFileName(graph.project.name)}-ai-briefing.md`,
  );
}
