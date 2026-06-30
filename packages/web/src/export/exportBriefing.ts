import type { NormalizedGraph } from "@archlens/core";
import { sanitizeFileName, triggerDownload } from "./exportJson.js";

/** Cap on the unbounded list sections (cycles, isolated) so a large project
 *  can't bloat the briefing. Anything beyond is summarised as "…and N more". */
const LIST_CAP = 15;

/**
 * Builds a compact Markdown briefing suitable for pasting directly into an AI
 * prompt. Covers the facts an AI needs most: project scale, load-bearing
 * modules, contract violations, circular dependencies, and isolated files.
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

  // Contract violations (always listed in full — these are the actionable gate).
  if (violations.length > 0) {
    lines.push(`## Contract violations (${violations.length})`);
    for (const v of violations) {
      lines.push(`- [${v.fromLayer} → ${v.toLayer}] \`${v.from}\` → \`${v.to}\``);
      if (v.message) lines.push(`  _${v.message}_`);
    }
    lines.push("");
  }

  // Circular dependencies — list the files in each cycle, not just the count,
  // so the reader can act on them. Each cycle reads "a → b → a".
  if (cycles.length > 0) {
    lines.push(`## Circular dependencies (${cycles.length})`);
    for (const cycle of cycles.slice(0, LIST_CAP)) {
      lines.push(`- ${cycle.map((id) => `\`${id}\``).join(" → ")}`);
    }
    if (cycles.length > LIST_CAP) lines.push(`- …and ${cycles.length - LIST_CAP} more`);
    lines.push("");
  }

  // Isolated files (capped — usually few, but a large project shouldn't bloat
  // the briefing; the omitted count is stated rather than silently dropped).
  const isolated = nodes.filter((n) => n.metrics.isIsolated);
  if (isolated.length > 0) {
    lines.push(`## Isolated files (${isolated.length})`);
    for (const n of isolated.slice(0, LIST_CAP)) {
      lines.push(`- \`${n.id}\``);
    }
    if (isolated.length > LIST_CAP) lines.push(`- …and ${isolated.length - LIST_CAP} more`);
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
