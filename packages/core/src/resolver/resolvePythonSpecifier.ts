/**
 * @module resolver/resolvePythonSpecifier
 *
 * Responsibility: given a raw Python import specifier written inside a known
 * source file, decide what it points to. Mirrors `resolveSpecifier` (the JS/TS
 * resolver) and returns the same `ResolutionOutcome` shape so the builder can
 * stay language-agnostic.
 *
 * Python specifier shapes handled:
 *   - absolute dotted:  "a.b.c"   -> "a/b/c.py" or "a/b/c/__init__.py"
 *   - relative:         "."       -> current package (its __init__.py)
 *                       ".mod"    -> sibling module in current package
 *                       "..pkg.x" -> parent package's pkg/x
 * Unresolved absolute dotted imports are treated as external (stdlib / 3rd-party
 * site-packages) rather than warnings, matching how bare JS specifiers behave.
 */
import { normalizePath, type ResolutionOutcome } from "./resolveSpecifier.js";

const PY_EXTENSIONS = [".py", ".pyi"] as const;
const PY_INDEX_FILES = PY_EXTENSIONS.map((ext) => `__init__${ext}`);

/** Tries a path candidate against the file set, with .py/.pyi and __init__ fallback. */
function matchPython(candidate: string, fileSet: Set<string>): string | undefined {
  if (fileSet.has(candidate)) return candidate;
  for (const ext of PY_EXTENSIONS) {
    if (fileSet.has(candidate + ext)) return candidate + ext;
  }
  for (const indexFile of PY_INDEX_FILES) {
    const withInit = normalizePath(`${candidate}/${indexFile}`);
    if (fileSet.has(withInit)) return withInit;
  }
  return undefined;
}

/** Directory of a file path ("pkg/mod.py" -> "pkg", "mod.py" -> ""). */
function dirOf(path: string): string {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

/**
 * Resolves a relative specifier like ".", ".mod", "..pkg.sub".
 * Leading dots = how many package levels to climb (1 dot = current package).
 */
function resolveRelative(fromFile: string, specifier: string): string {
  const dotMatch = /^(\.+)(.*)$/.exec(specifier)!;
  const dots = dotMatch[1]!.length;
  const rest = dotMatch[2]!; // module path after the dots, e.g. "pkg.sub" or ""

  // One leading dot = the current package (the file's own directory). Each extra
  // dot climbs one more directory level.
  let baseDir = dirOf(fromFile);
  for (let i = 1; i < dots; i++) {
    baseDir = dirOf(baseDir);
  }

  const restPath = rest.replace(/\./g, "/");
  return normalizePath(restPath ? `${baseDir}/${restPath}` : baseDir);
}

export function resolvePythonSpecifier(
  fromFile: string,
  specifier: string,
  fileSet: Set<string>
): ResolutionOutcome {
  // 1. Relative imports (start with one or more dots).
  if (specifier.startsWith(".")) {
    const candidate = resolveRelative(fromFile, specifier);
    const match = matchPython(candidate, fileSet);
    return match ? { status: "file", id: match } : { status: "unresolved" };
  }

  // 2. Absolute dotted import — try to resolve it inside the project first.
  const candidate = specifier.replace(/\./g, "/");
  const match = matchPython(candidate, fileSet);
  if (match) return { status: "file", id: match };

  // 3. Not in the project — stdlib or an installed package. Top dotted segment
  //    is the package name (e.g. "flask.cli" -> "flask").
  const packageName = specifier.split(".")[0]!;
  return { status: "external", packageName };
}
