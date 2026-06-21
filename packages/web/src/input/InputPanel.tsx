import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { useGraphStore } from "../store/useGraphStore";
import { zipToFiles } from "../lib/zipToFiles";
import { parsePastedText } from "../lib/parsePastedText";
import { parseAliasConfig } from "../lib/parseAliasConfig";
import "./InputPanel.css";

type InputMode = "zip" | "paste";

const PASTE_PLACEHOLDER = `=== src/app.ts ===
import { Button } from "./components/Button";

=== src/components/Button.tsx ===
export const Button = () => null;`;

const ALIAS_PLACEHOLDER = `{ "@/*": "src/*" }`;

export function InputPanel() {
  const runAnalysis = useGraphStore((s) => s.runAnalysis);
  const status = useGraphStore((s) => s.status);
  const storeError = useGraphStore((s) => s.error);

  const [mode, setMode] = useState<InputMode>("zip");
  const [projectName, setProjectName] = useState("my-project");
  const [pasteText, setPasteText] = useState("");
  const [aliasText, setAliasText] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setLocalNotice("Only .zip files are supported in this mode.");
      return;
    }
    setZipFile(file);
    setLocalNotice(null);
    if (!projectName || projectName === "my-project") {
      setProjectName(file.name.replace(/\.zip$/i, ""));
    }
  }, [projectName]);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFiles(file);
    },
    [handleFiles]
  );

  const handleAnalyze = useCallback(async () => {
    setLocalNotice(null);
    const { alias, error: aliasError } = parseAliasConfig(aliasText);
    if (aliasError) {
      setLocalNotice(aliasError);
      return;
    }

    if (mode === "zip") {
      if (!zipFile) {
        setLocalNotice("Choose or drop a .zip file first.");
        return;
      }
      const { files, skipped, truncated } = await zipToFiles(zipFile);
      if (files.length === 0) {
        setLocalNotice("No .ts/.tsx/.js/.jsx files were found inside that archive.");
        return;
      }
      if (skipped.length > 0 || truncated) {
        setLocalNotice(
          `Analyzing ${files.length} files. ${skipped.length > 0 ? `${skipped.length} oversized file(s) skipped. ` : ""}${truncated ? "File count limit reached — analysis covers the first files found." : ""}`
        );
      }
      runAnalysis(projectName, files, alias);
    } else {
      const { files, noMarkersFound } = parsePastedText(pasteText);
      if (noMarkersFound) {
        setLocalNotice('No "=== path ===" markers found — use the format shown in the placeholder.');
        return;
      }
      if (files.length === 0) {
        setLocalNotice("Paste at least one file block before analyzing.");
        return;
      }
      runAnalysis(projectName, files, alias);
    }
  }, [mode, zipFile, pasteText, aliasText, projectName, runAnalysis]);

  return (
    <div className="input-panel">
      <div className="input-panel__intro">
        <p className="input-panel__eyebrow">Dependency &amp; coupling analysis</p>
        <h1 className="input-panel__title">See the structure your file tree hides.</h1>
        <p className="input-panel__subtitle">
          Upload a project archive or paste a few files. ArchLens parses imports
          entirely in your browser — nothing is uploaded to a server.
        </p>
      </div>

      <div className="input-panel__card">
        <div className="input-panel__tabs" role="tablist" aria-label="Input mode">
          <button
            role="tab"
            aria-selected={mode === "zip"}
            className={`input-panel__tab ${mode === "zip" ? "is-active" : ""}`}
            onClick={() => setMode("zip")}
          >
            Upload .zip
          </button>
          <button
            role="tab"
            aria-selected={mode === "paste"}
            className={`input-panel__tab ${mode === "paste" ? "is-active" : ""}`}
            onClick={() => setMode("paste")}
          >
            Paste files
          </button>
        </div>

        <label className="input-panel__field">
          <span>Project name</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="my-project"
          />
        </label>

        {mode === "zip" ? (
          <div
            className={`input-panel__dropzone ${isDragging ? "is-dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              className="visually-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFiles(file);
              }}
            />
            {zipFile ? (
              <p className="input-panel__dropzone-filename">{zipFile.name}</p>
            ) : (
              <>
                <p>Drop a project .zip here, or click to browse</p>
                <p className="input-panel__hint">node_modules / dist / build are skipped automatically</p>
              </>
            )}
          </div>
        ) : (
          <label className="input-panel__field">
            <span>File blocks</span>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={PASTE_PLACEHOLDER}
              rows={10}
              spellCheck={false}
            />
          </label>
        )}

        <button
          type="button"
          className="input-panel__advanced-toggle"
          onClick={() => setShowAlias((v) => !v)}
          aria-expanded={showAlias}
        >
          {showAlias ? "Hide" : "Set"} path aliases (optional)
        </button>
        {showAlias && (
          <label className="input-panel__field">
            <span>Alias config — JSON (tsconfig "paths"-style) or "key -&gt; target" lines</span>
            <textarea
              value={aliasText}
              onChange={(e) => setAliasText(e.target.value)}
              placeholder={ALIAS_PLACEHOLDER}
              rows={3}
              spellCheck={false}
            />
          </label>
        )}

        {(localNotice || (status === "error" && storeError)) && (
          <p className="input-panel__notice" role="alert">
            {localNotice ?? storeError?.message}
          </p>
        )}

        <button
          type="button"
          className="input-panel__submit"
          onClick={handleAnalyze}
          disabled={status === "analyzing"}
        >
          {status === "analyzing" ? "Analyzing…" : "Analyze project"}
        </button>
      </div>
    </div>
  );
}
