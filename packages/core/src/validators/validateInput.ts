/**
 * @module validators/validateInput
 *
 * Responsibility: pre-flight checks on ProjectInput, independent of parsing.
 * Keeps "never silently fail" guarantees in one place instead of scattered
 * across the pipeline.
 */
import type { GraphWarning, ProjectInput } from "../types.js";

export interface ValidationOutcome {
  /** Files worth attempting to parse (supported extensions, deduplicated). */
  filesToParse: ProjectInput["files"];
  warnings: GraphWarning[];
}

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function matchesGlob(path: string, glob: string): boolean {
  // MVP-level matching: supports "*" wildcard and plain prefix/substring.
  const pattern = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${pattern}$`).test(path) || path.includes(glob.replace(/\*/g, ""));
}

export function validateInput(input: ProjectInput): ValidationOutcome {
  const warnings: GraphWarning[] = [];
  const seen = new Set<string>();
  const filesToParse: ProjectInput["files"] = [];

  for (const file of input.files) {
    if (seen.has(file.path)) {
      warnings.push({
        code: "DUPLICATE_PATH",
        path: file.path,
        raw: file.path,
        message: `Duplicate file path "${file.path}" — later occurrence ignored.`,
      });
      continue;
    }
    seen.add(file.path);

    const isSupported = SUPPORTED_EXTENSIONS.some((ext) => file.path.toLowerCase().endsWith(ext));
    if (!isSupported) continue;

    if (input.excludeGlobs?.some((g) => matchesGlob(file.path, g))) continue;
    if (input.includeGlobs?.length && !input.includeGlobs.some((g) => matchesGlob(file.path, g))) continue;

    filesToParse.push(file);
  }

  return { filesToParse, warnings };
}
