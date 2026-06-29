#!/usr/bin/env node
/**
 * @archlens/cli — architecture contract gate for CI / pre-commit hooks.
 *
 * Usage:  archlens-dep [repoPath]
 *
 * Exit codes (matches DocsGap convention):
 *   0  — clean (no violations, no hard error)
 *   1  — hard error (path unreadable, unsupported project, internal error)
 *   2  — contract violations detected
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { analyzeProject, parseContract } from "@archlens/core";
import type { ArchitectureContract, InputFile } from "@archlens/core";

const SUPPORTED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx",
  ".mts", ".cts", ".mjs", ".cjs",
  ".vue", ".py", ".pyi",
]);

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build",
  ".cache", "coverage", ".venv", "__pycache__",
  ".next", ".nuxt", "out",
]);

function collectFiles(dir: string, root: string): InputFile[] {
  const result: InputFile[] = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        result.push(...collectFiles(fullPath, root));
      }
    } else if (entry.isFile() && SUPPORTED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      try {
        const content = readFileSync(fullPath, "utf-8");
        const relPath = relative(root, fullPath).replace(/\\/g, "/");
        result.push({ path: relPath, content });
      } catch {
        // skip unreadable files silently
      }
    }
  }
  return result;
}

function resolveRepoPath(): string {
  return process.argv[2] ?? ".";
}

function resolveProjectName(repoPath: string): string {
  const abs = repoPath === "." ? process.cwd() : repoPath;
  return abs.split(/[/\\]/).filter(Boolean).pop() ?? "project";
}

function main(): void {
  const repoPath = resolveRepoPath();

  // Verify the path exists
  if (!existsSync(repoPath) || !statSync(repoPath).isDirectory()) {
    process.stderr.write(`archlens-dep: "${repoPath}" is not a readable directory.\n`);
    process.exit(1);
  }

  const projectName = resolveProjectName(repoPath);
  const files = collectFiles(repoPath, repoPath);

  // Try to load archlens.contract.json
  let contract: ArchitectureContract | undefined;
  const contractPath = join(repoPath, "archlens.contract.json");
  if (existsSync(contractPath)) {
    try {
      const text = readFileSync(contractPath, "utf-8");
      const parsed = parseContract(text);
      if (parsed.ok) {
        contract = parsed.contract;
      } else {
        process.stderr.write(`archlens-dep: archlens.contract.json is invalid — ${parsed.error}\n`);
      }
    } catch {
      // skip — no contract mode
    }
  }

  const result = analyzeProject({ projectName, files, contract });

  if (!result.ok) {
    process.stderr.write(`archlens-dep: ${result.error.message}\n`);
    process.exit(1);
  }

  const { graph } = result;

  // Header
  process.stdout.write(`# ArchLens Dependency: ${graph.project.name}\n`);
  process.stdout.write(
    `Files: ${graph.project.fileCount}  Dependencies: ${graph.edges.length}  Cycles: ${graph.cycles.length}\n`,
  );
  if (contract) {
    process.stdout.write(`Contract: loaded (${contract.rules.length} rule(s))\n`);
  }
  process.stdout.write("\n");

  // Contract violations
  if (graph.violations.length > 0) {
    process.stdout.write(`## Contract violations (${graph.violations.length})\n`);
    for (const v of graph.violations) {
      process.stdout.write(`  [${v.fromLayer} → ${v.toLayer}] ${v.from} → ${v.to}\n`);
      if (v.message) process.stdout.write(`    ${v.message}\n`);
    }
    process.stdout.write("\n");
  }

  // Circular dependencies
  if (graph.cycles.length > 0) {
    process.stdout.write(`## Circular dependencies (${graph.cycles.length})\n`);
    for (let i = 0; i < graph.cycles.length; i++) {
      process.stdout.write(`  Cycle ${i + 1}: ${graph.cycles[i].join(" → ")}\n`);
    }
    process.stdout.write("\n");
  }

  // Isolated files
  const isolated = graph.nodes.filter((n) => n.metrics.isIsolated);
  if (isolated.length > 0) {
    process.stdout.write(`## Isolated files (${isolated.length})\n`);
    for (const n of isolated) {
      process.stdout.write(`  ${n.id}\n`);
    }
    process.stdout.write("\n");
  }

  if (graph.violations.length === 0 && graph.cycles.length === 0 && isolated.length === 0) {
    process.stdout.write("✓ No violations, cycles, or isolated files.\n");
  }

  // Exit codes: 2=violations, 0=clean
  process.exit(graph.violations.length > 0 ? 2 : 0);
}

main();
