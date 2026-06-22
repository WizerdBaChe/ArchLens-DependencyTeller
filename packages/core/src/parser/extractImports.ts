/**
 * @module parser/extractImports
 *
 * Responsibility: turn one file's source text into a flat list of raw import
 * specifiers (the strings exactly as written in code, before any path
 * resolution). Resolution is a separate concern — see resolver/.
 */
import ts from "typescript";
import type { EdgeKind, SupportedLanguage } from "../types.js";

export interface RawImport {
  /** The specifier exactly as written, e.g. "./Button", "@/lib/api", "react" */
  specifier: string;
  kind: EdgeKind;
}

export interface ParseOutcome {
  imports: RawImport[];
  /** Set when the file could not be parsed as valid syntax at all. */
  parseError?: string;
}

const SCRIPT_KIND_BY_LANGUAGE: Record<SupportedLanguage, ts.ScriptKind> = {
  ts: ts.ScriptKind.TS,
  tsx: ts.ScriptKind.TSX,
  js: ts.ScriptKind.JS,
  jsx: ts.ScriptKind.JSX,
  // Vue SFC content is extracted and re-tagged as "ts" or "js" by extractVueScript
  // before reaching this function, so this entry is a safety fallback only.
  vue: ts.ScriptKind.JS,
};

export function inferLanguage(path: string): SupportedLanguage {
  const lower = path.toLowerCase();
  if (lower.endsWith(".tsx")) return "tsx";
  if (lower.endsWith(".ts") || lower.endsWith(".mts") || lower.endsWith(".cts")) return "ts";
  if (lower.endsWith(".jsx")) return "jsx";
  return "js"; // .js, .mjs, .cjs, and any unrecognised extension
}

/**
 * Extracts raw import specifiers from source text without resolving them.
 * Uses the TypeScript compiler's parser in "don't typecheck, just parse"
 * mode, so it tolerates JS/JSX/TS/TSX uniformly.
 */
export function extractImports(
  path: string,
  content: string,
  language: SupportedLanguage = inferLanguage(path)
): ParseOutcome {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      /* setParentNodes */ true,
      SCRIPT_KIND_BY_LANGUAGE[language]
    );
  } catch (err) {
    return { imports: [], parseError: err instanceof Error ? err.message : String(err) };
  }

  const imports: RawImport[] = [];

  const visit = (node: ts.Node): void => {
    // import x from "y"; import "y"; import type x from "y";
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      imports.push({ specifier: node.moduleSpecifier.text, kind: "import" });
    }
    // export { x } from "y"; export * from "y";
    else if (
      (ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push({ specifier: node.moduleSpecifier.text, kind: "export-from" });
    }
    // require("y")
    else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0] as ts.Expression)
    ) {
      imports.push({ specifier: (node.arguments[0] as ts.StringLiteral).text, kind: "require" });
    }
    // import("y")  (dynamic import)
    else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length >= 1 &&
      ts.isStringLiteral(node.arguments[0] as ts.Expression)
    ) {
      imports.push({ specifier: (node.arguments[0] as ts.StringLiteral).text, kind: "dynamic-import" });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  // Surface fatal syntax errors (TS still produces a best-effort AST, so we
  // only flag truly broken files where nothing usable was parsed at all).
  const diagnostics = (sourceFile as unknown as { parseDiagnostics?: ts.Diagnostic[] }).parseDiagnostics;
  const hasFatalError = Array.isArray(diagnostics) && diagnostics.length > 0 && imports.length === 0;

  return {
    imports,
    parseError: hasFatalError ? "Syntax could not be parsed" : undefined,
  };
}
