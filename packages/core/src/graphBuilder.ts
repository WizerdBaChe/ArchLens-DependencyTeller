/**
 * @module graphBuilder
 *
 * Responsibility: orchestration only. Calls the parser per file, calls the
 * resolver per import, and assembles raw GraphNode/GraphEdge lists. It does
 * NOT compute cycles or fan-in/out — those are analyzer concerns, kept in a
 * separate module so each piece can be tested and replaced independently.
 */
import { extractImports, inferLanguage } from "./parser/extractImports.js";
import { isBareSpecifier, resolveSpecifier } from "./resolver/resolveSpecifier.js";
import type {
  AliasConfig,
  GraphEdge,
  GraphNode,
  GraphWarning,
  InputFile,
  SupportedLanguage,
} from "./types.js";

// Extensions that bundlers handle as non-JS assets — not part of the module
// graph and should never produce UNRESOLVED_IMPORT warnings.
const NON_JS_ASSET_EXTENSIONS =
  /\.(css|scss|sass|less|svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?|ttf|eot|otf|json|json5|yaml|yml|toml|graphql|gql|d\.ts)$/i;

function isNonJsAssetImport(specifier: string): boolean {
  const bare = specifier.split("?")[0] as string; // strip ?inline, ?url, etc.
  return NON_JS_ASSET_EXTENSIONS.test(bare);
}

export interface BuildResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  warnings: GraphWarning[];
  languages: SupportedLanguage[];
}

function dirOf(path: string): string {
  return path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
}

export function buildGraph(files: InputFile[], alias: AliasConfig | undefined): BuildResult {
  const fileSet = new Set(files.map((f) => f.path));
  const languages = new Set<SupportedLanguage>();
  const warnings: GraphWarning[] = [];
  const edges: GraphEdge[] = [];
  let edgeCounter = 0;

  // Pre-create every node so isolated files (no edges at all) still appear.
  const nodes = new Map<string, GraphNode>(
    files.map((f) => [
      f.path,
      {
        id: f.path,
        label: f.path.includes("/") ? f.path.slice(f.path.lastIndexOf("/") + 1) : f.path,
        type: "file" as const,
        group: dirOf(f.path),
        metrics: { fanin: 0, fanout: 0, isEntry: false, isLeaf: false, isCircular: false },
      },
    ])
  );

  for (const file of files) {
    const language = file.language ?? inferLanguage(file.path);
    languages.add(language);

    const { imports, parseError } = extractImports(file.path, file.content, language);
    if (parseError) {
      warnings.push({
        code: "PARSE_ERROR",
        path: file.path,
        raw: parseError,
        message: `Failed to parse "${file.path}": ${parseError}`,
      });
      continue;
    }

    for (const rawImport of imports) {
      const outcome = resolveSpecifier(file.path, rawImport.specifier, fileSet, alias);

      if (outcome.status === "file") {
        edgeCounter += 1;
        edges.push({
          id: `e${edgeCounter}`,
          from: file.path,
          to: outcome.id,
          kind: rawImport.kind,
          isCircular: false, // filled in later by the analyzer once cycles are known
        });
      } else if (outcome.status === "unresolved") {
        // Bare specifiers that *look* like they should have resolved (e.g. an
        // alias-shaped path with no alias config) are flagged; genuinely
        // external bare specifiers are not graphed in MVP and are not warnings.
        if (!isBareSpecifier(rawImport.specifier) || rawImport.specifier.startsWith("@/")) {
          // Non-JS asset imports (CSS, images, fonts, JSON, etc.) are valid TS/TSX
          // syntax handled by bundlers, not part of the module graph — skip silently.
          if (!isNonJsAssetImport(rawImport.specifier)) {
            warnings.push({
              code: "UNRESOLVED_IMPORT",
              path: file.path,
              raw: rawImport.specifier,
              message: `Could not resolve "${rawImport.specifier}" imported from "${file.path}".`,
            });
          }
        }
      }
      // "external" outcomes are intentionally not graphed as nodes in MVP —
      // RPD scopes external/3rd-party dependency graphing out for now.
    }
  }

  return {
    nodes: [...nodes.values()],
    edges,
    warnings,
    languages: [...languages],
  };
}
