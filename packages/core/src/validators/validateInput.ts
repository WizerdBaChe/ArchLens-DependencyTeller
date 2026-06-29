/**
 * @module validators/validateInput
 *
 * Responsibility: pre-flight checks on ProjectInput, independent of parsing.
 * Keeps "never silently fail" guarantees in one place instead of scattered
 * across the pipeline.
 */
import type { GraphWarning, ProjectInput } from "../types.js";
import { matchesPattern } from "../util/matchPattern.js";

export interface ValidationOutcome {
  /** Files worth attempting to parse (supported extensions, deduplicated). */
  filesToParse: ProjectInput["files"];
  warnings: GraphWarning[];
}

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue", ".py", ".pyi"];

export function validateInput(input: ProjectInput): ValidationOutcome {
  const warnings: GraphWarning[] = [];
  const seen = new Set<string>();
  const filesToParse: ProjectInput["files"] = [];

  // Merge deprecated aliases so callers using the old field names still work.
  const excludePatterns = [
    ...(input.excludePatterns ?? []),
    ...(input.excludeGlobs ?? []),
  ];
  const includePatterns = [
    ...(input.includePatterns ?? []),
    ...(input.includeGlobs ?? []),
  ];

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

    if (excludePatterns.some((p) => matchesPattern(file.path, p))) continue;
    if (includePatterns.length > 0 && !includePatterns.some((p) => matchesPattern(file.path, p))) continue;

    filesToParse.push(file);
  }

  return { filesToParse, warnings };
}
