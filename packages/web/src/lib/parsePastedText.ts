import type { InputFile } from "@archlens/core";

/**
 * Paste format (documented in the UI placeholder):
 *
 *   === src/app.ts ===
 *   import { Button } from "./components/Button";
 *
 *   === src/components/Button.tsx ===
 *   export const Button = () => null;
 *
 * Each "=== path ===" line starts a new file block; everything until the
 * next marker (or end of text) is that file's content.
 */
const FILE_MARKER = /^===\s*(.+?)\s*===$/;

export interface PasteParseOutcome {
  files: InputFile[];
  /** True if the text had content but no recognizable "=== path ===" markers. */
  noMarkersFound: boolean;
}

export function parsePastedText(raw: string): PasteParseOutcome {
  const lines = raw.split(/\r?\n/);
  const files: InputFile[] = [];

  let currentPath: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (currentPath) {
      files.push({ path: currentPath, content: buffer.join("\n") });
    }
    buffer = [];
  };

  for (const line of lines) {
    const match = FILE_MARKER.exec(line.trim());
    if (match) {
      flush();
      currentPath = match[1] as string;
    } else if (currentPath) {
      buffer.push(line);
    }
  }
  flush();

  return { files, noMarkersFound: files.length === 0 && raw.trim().length > 0 };
}
