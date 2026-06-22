import type { InputFile } from "@archlens/core";

const SUPPORTED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];
const MAX_FILES = 3000;
const MAX_FILE_SIZE_BYTES = 1.5 * 1024 * 1024;

export interface FolderReadOutcome {
  files: InputFile[];
  skipped: string[];
  truncated: boolean;
  folderName: string;
}

function isSupported(name: string): boolean {
  const lower = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  ".git",
  ".turbo",
  "out",
  ".cache",
]);

async function collectFiles(
  dirHandle: FileSystemDirectoryHandle,
  pathPrefix: string,
  files: InputFile[],
  skipped: string[],
  truncated: { value: boolean }
): Promise<void> {
  for await (const [name, handle] of dirHandle) {
    if (truncated.value) break;

    if (handle.kind === "directory") {
      if (SKIP_DIRS.has(name)) continue;
      await collectFiles(handle, `${pathPrefix}${name}/`, files, skipped, truncated);
    } else {
      if (!isSupported(name)) continue;
      if (files.length >= MAX_FILES) {
        truncated.value = true;
        break;
      }
      const file = await handle.getFile();
      if (file.size > MAX_FILE_SIZE_BYTES) {
        skipped.push(`${pathPrefix}${name}`);
        continue;
      }
      const content = await file.text();
      files.push({ path: `${pathPrefix}${name}`, content });
    }
  }
}

/** Uses the File System Access API to let the user pick a local folder and read source files. */
export async function folderToFiles(): Promise<FolderReadOutcome> {
  const dirHandle = await window.showDirectoryPicker({ mode: "read" });

  const files: InputFile[] = [];
  const skipped: string[] = [];
  const truncated = { value: false };

  await collectFiles(dirHandle, "", files, skipped, truncated);

  return { files, skipped, truncated: truncated.value, folderName: dirHandle.name };
}

export function isFolderPickerSupported(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}
