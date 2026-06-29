/**
 * @module resolver/resolveSpecifier
 *
 * Responsibility: given a raw specifier (e.g. "./api", "@/lib/api", "react")
 * written inside a known source file, decide what it points to:
 *   - a project file (returns its normalized id)
 *   - an external package (node_modules — not graphed in MVP, but counted)
 *   - unresolved (kept as a warning, never silently dropped)
 */
import type { AliasConfig } from "../types.js";

export type ResolutionOutcome =
  | { status: "file"; id: string }
  | { status: "external"; packageName: string }
  | { status: "unresolved" };

const RESOLVABLE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue"] as const;
const INDEX_FILES = RESOLVABLE_EXTENSIONS.map((ext) => `index${ext}`);

// TypeScript ESM convention: import specifiers use .js/.mjs/.cjs even when the
// actual source file on disk is .ts/.tsx/.mts/.cts (NodeNext/bundler resolution).
// When the exact candidate isn't found, try the TS counterpart before giving up.
const TS_ESM_REMAP: Record<string, string[]> = {
  ".js": [".ts", ".tsx"],
  ".mjs": [".mts"],
  ".cjs": [".cts"],
};

/** Normalizes "./a/../b" and backslashes into a clean forward-slash path. */
export function normalizePath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function joinRelative(fromFile: string, specifier: string): string {
  const fromDir = fromFile.includes("/") ? fromFile.slice(0, fromFile.lastIndexOf("/")) : "";
  return normalizePath(`${fromDir}/${specifier}`);
}

/** Tries a candidate path against the known file set, with extension/index fallback. */
function matchAgainstFileSet(candidate: string, fileSet: Set<string>): string | undefined {
  if (fileSet.has(candidate)) return candidate;

  // TypeScript ESM: .js/.mjs/.cjs in specifiers often points to .ts/.mts/.cts on disk.
  for (const [jsExt, tsExts] of Object.entries(TS_ESM_REMAP)) {
    if (candidate.endsWith(jsExt)) {
      const base = candidate.slice(0, -jsExt.length);
      for (const tsExt of tsExts) {
        if (fileSet.has(base + tsExt)) return base + tsExt;
      }
    }
  }

  for (const ext of RESOLVABLE_EXTENSIONS) {
    if (fileSet.has(candidate + ext)) return candidate + ext;
  }
  for (const indexFile of INDEX_FILES) {
    const withIndex = normalizePath(`${candidate}/${indexFile}`);
    if (fileSet.has(withIndex)) return withIndex;
  }
  return undefined;
}

/** Applies the longest-matching alias prefix (tsconfig "paths"-style, e.g. "@/*": "src/*"). */
function applyAlias(specifier: string, alias: AliasConfig | undefined): string | undefined {
  if (!alias) return undefined;
  let bestMatch: { prefix: string; target: string } | undefined;

  for (const [aliasKey, aliasTarget] of Object.entries(alias)) {
    const keyPrefix = aliasKey.replace(/\*$/, "");
    const targetPrefix = aliasTarget.replace(/\*$/, "");
    if (specifier === keyPrefix || specifier.startsWith(keyPrefix)) {
      if (!bestMatch || keyPrefix.length > bestMatch.prefix.length) {
        bestMatch = { prefix: keyPrefix, target: targetPrefix };
      }
    }
  }
  if (!bestMatch) return undefined;
  const rest = specifier.slice(bestMatch.prefix.length);
  return normalizePath(`${bestMatch.target}${rest}`);
}

export function isBareSpecifier(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("/");
}

export function resolveSpecifier(
  fromFile: string,
  specifier: string,
  fileSet: Set<string>,
  alias: AliasConfig | undefined
): ResolutionOutcome {
  // 1. Relative / absolute-in-project specifiers.
  if (!isBareSpecifier(specifier)) {
    const candidate = specifier.startsWith("/")
      ? normalizePath(specifier.slice(1))
      : joinRelative(fromFile, specifier);
    const match = matchAgainstFileSet(candidate, fileSet);
    return match ? { status: "file", id: match } : { status: "unresolved" };
  }

  // 2. Alias specifiers (checked before treating as external).
  const aliasedPath = applyAlias(specifier, alias);
  if (aliasedPath) {
    const match = matchAgainstFileSet(aliasedPath, fileSet);
    return match ? { status: "file", id: match } : { status: "unresolved" };
  }

  // 3. Everything else is an external package (node_modules-style).
  const packageName = specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : (specifier.split("/")[0] as string);
  return { status: "external", packageName };
}
