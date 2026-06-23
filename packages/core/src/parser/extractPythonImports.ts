/**
 * @module parser/extractPythonImports
 *
 * Responsibility: turn one Python file's source text into a flat list of raw
 * import specifiers, mirroring the contract of `extractImports` (the TS parser)
 * so the graph builder can branch on language and treat both uniformly.
 *
 * This is a deliberately lightweight, regex/line-based extractor — no real AST.
 * It is "good enough" to prove the interface and logic end-to-end; the parser
 * seam is language-agnostic so this can later be swapped for a tree-sitter /
 * AST implementation without touching the builder or resolver.
 *
 * Specifier shapes emitted (kept exactly as written, dotted form preserved):
 *   - `import a.b.c`            -> "a.b.c"
 *   - `import a as x, b.c`      -> "a", "b.c"
 *   - `from a.b import c, d`    -> "a.b"
 *   - `from . import x`         -> "."
 *   - `from ..pkg import y`     -> "..pkg"
 * Dotted/relative resolution into file paths is the resolver's job.
 */
import type { RawImport, ParseOutcome } from "./extractImports.js";

/**
 * Strips content that could contain `import`-looking text but is not code:
 * triple-quoted strings (docstrings / multiline strings) and `#` line comments.
 * Single-line string literals are left intact — an `import` keyword only counts
 * at statement start (handled by the per-line regexes), so a quoted "import" in
 * a normal assignment never matches the line-anchored patterns below.
 */
function stripNonCode(source: string): string {
  // Remove triple-quoted blocks (both """ and ''') including their content.
  let out = source.replace(/("""|''')[\s\S]*?\1/g, "");
  // Remove line comments (kept simple: a `#` not inside a string starts a comment).
  out = out.replace(/#.*$/gm, "");
  return out;
}

const IMPORT_RE = /^\s*import\s+(.+)$/;
const FROM_RE = /^\s*from\s+(\.*[\w.]*)\s+import\s+/;

/**
 * Parses one `import ...` clause body (everything after the `import` keyword)
 * into top-level module specifiers, handling comma lists and `as` aliases.
 *   "a.b as x, c.d"  ->  ["a.b", "c.d"]
 */
function parseImportClause(clause: string): string[] {
  return clause
    .split(",")
    .map((part) => part.trim())
    .map((part) => part.split(/\s+as\s+/)[0]!.trim()) // drop "as alias"
    .filter((mod) => /^[\w.]+$/.test(mod)); // ignore parenthesised / malformed tails
}

export function extractPythonImports(_path: string, content: string): ParseOutcome {
  const imports: RawImport[] = [];
  const code = stripNonCode(content);

  for (const rawLine of code.split("\n")) {
    // `from X import ...` — capture the module part X (may be relative: ".", "..pkg").
    const fromMatch = FROM_RE.exec(rawLine);
    if (fromMatch) {
      const specifier = fromMatch[1]!.trim();
      if (specifier) imports.push({ specifier, kind: "import" });
      continue;
    }

    // `import a.b.c, d as e`
    const importMatch = IMPORT_RE.exec(rawLine);
    if (importMatch) {
      for (const mod of parseImportClause(importMatch[1]!)) {
        imports.push({ specifier: mod, kind: "import" });
      }
    }
  }

  return { imports };
}
