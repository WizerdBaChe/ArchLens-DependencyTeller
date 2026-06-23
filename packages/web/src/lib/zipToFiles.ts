import JSZip from "jszip";
import type { InputFile } from "@archlens/core";

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue", ".py", ".pyi"];
const MAX_FILES = 3000;
const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024; // skip generated/minified giants

export interface ZipReadOutcome {
  files: InputFile[];
  skipped: string[];
  truncated: boolean;
}

function isSupported(path: string): boolean {
  const lower = path.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function looksGenerated(path: string): boolean {
  return /(^|\/)(node_modules|dist|build|\.next|coverage|__pycache__|\.venv|venv|\.mypy_cache|\.pytest_cache)\//.test(path);
}

/** Reads a .zip File/Blob and returns project-relative source files, skipping non-code and generated paths. */
export async function zipToFiles(zipBlob: Blob): Promise<ZipReadOutcome> {
  const zip = await JSZip.loadAsync(zipBlob);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);

  const skipped: string[] = [];
  const files: InputFile[] = [];
  let truncated = false;

  for (const entry of entries) {
    if (files.length >= MAX_FILES) {
      truncated = true;
      break;
    }
    const path = stripTopLevelFolder(entry.name);
    if (looksGenerated(path) || !isSupported(path)) {
      continue;
    }
    const content = await entry.async("string");
    if (content.length > MAX_FILE_SIZE_BYTES) {
      skipped.push(path);
      continue;
    }
    files.push({ path, content });
  }

  return { files, skipped, truncated };
}

/**
 * GitHub-style exports often wrap everything in a single "<repo>-<branch>/"
 * root folder. Stripping it keeps node ids meaningful (e.g. "src/app.ts"
 * instead of "my-repo-main/src/app.ts").
 */
function stripTopLevelFolder(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const firstSlash = normalized.indexOf("/");
  if (firstSlash === -1) return normalized;
  return normalized.slice(firstSlash + 1);
}
