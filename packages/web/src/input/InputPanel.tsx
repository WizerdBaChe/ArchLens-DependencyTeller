import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { ArchitectureContract, InputFile } from "@archlens/core";
import { parseContract } from "@archlens/core";
import { useGraphStore } from "../store/useGraphStore";
import { zipToFiles } from "../lib/zipToFiles";
import { folderToFiles, isFolderPickerSupported } from "../lib/folderToFiles";
import { parsePastedText } from "../lib/parsePastedText";
import { parseAliasConfig } from "../lib/parseAliasConfig";
import { useLocale } from "../i18n";
import "./InputPanel.css";

type InputMode = "zip" | "folder" | "paste";

/** Scans the file list for archlens.contract.json and returns the parsed contract if valid. */
function extractContract(files: InputFile[]): ArchitectureContract | undefined {
  const contractFile = files.find((f) => f.path.endsWith("archlens.contract.json"));
  if (!contractFile) return undefined;
  const result = parseContract(contractFile.content);
  return result.ok ? result.contract : undefined;
}

const PASTE_PLACEHOLDER = `=== src/app.ts ===
import { Button } from "./components/Button";

=== src/components/Button.tsx ===
export const Button = () => null;`;

const ALIAS_PLACEHOLDER = `{ "@/*": "src/*" }`;

export function InputPanel() {
  const runAnalysis = useGraphStore((s) => s.runAnalysis);
  const status = useGraphStore((s) => s.status);
  const storeError = useGraphStore((s) => s.error);
  const { t } = useLocale();

  const [mode, setMode] = useState<InputMode>("zip");
  const [projectName, setProjectName] = useState("my-project");
  const [pasteText, setPasteText] = useState("");
  const [aliasText, setAliasText] = useState("");
  const [showAlias, setShowAlias] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [localNotice, setLocalNotice] = useState<string | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isReadingFolder, setIsReadingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderFilesRef = useRef<InputFile[] | null>(null);
  const folderPickerSupported = isFolderPickerSupported();

  const switchMode = useCallback((next: InputMode) => {
    setMode(next);
    setLocalNotice(null);
    if (next !== "folder") {
      setFolderName(null);
      folderFilesRef.current = null;
    }
    if (next !== "zip") {
      setZipFile(null);
    }
  }, []);

  const handleFiles = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setLocalNotice(t.input.errorZipOnly);
      return;
    }
    setZipFile(file);
    setLocalNotice(null);
    if (!projectName || projectName === "my-project") {
      setProjectName(file.name.replace(/\.zip$/i, ""));
    }
  }, [projectName, t]);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFiles(file);
    },
    [handleFiles]
  );

  const handlePickFolder = useCallback(async () => {
    setLocalNotice(null);
    setIsReadingFolder(true);
    try {
      const { files, skipped, truncated, folderName: name } = await folderToFiles();
      folderFilesRef.current = files;
      setFolderName(name);
      if (!projectName || projectName === "my-project") {
        setProjectName(name);
      }
      if (files.length === 0) {
        setLocalNotice(t.input.errorNoFilesFolder);
      } else if (skipped.length > 0 || truncated) {
        setLocalNotice(t.input.noticeFilesFound(files.length, skipped.length, truncated));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "SecurityError") {
        setLocalNotice(t.input.errorHttpsRequired);
      } else if (err instanceof Error && err.name !== "AbortError") {
        setLocalNotice(t.input.errorFolderRead + err.message);
      }
    } finally {
      setIsReadingFolder(false);
    }
  }, [projectName, t]);

  const handleAnalyze = useCallback(async () => {
    setLocalNotice(null);
    const { alias, error: aliasError } = parseAliasConfig(aliasText);
    if (aliasError) {
      setLocalNotice(aliasError);
      return;
    }

    if (mode === "zip") {
      if (!zipFile) {
        setLocalNotice(t.input.errorChooseZip);
        return;
      }
      const { files, skipped, truncated } = await zipToFiles(zipFile);
      if (files.length === 0) {
        setLocalNotice(t.input.errorNoFilesArchive);
        return;
      }
      if (skipped.length > 0 || truncated) {
        setLocalNotice(t.input.noticeAnalyzing(files.length, skipped.length, truncated));
      }
      runAnalysis(projectName, files, alias, extractContract(files));
    } else if (mode === "folder") {
      const files = folderFilesRef.current;
      if (!files || files.length === 0) {
        setLocalNotice(t.input.errorSelectFolder);
        return;
      }
      runAnalysis(projectName, files, alias, extractContract(files));
    } else {
      const { files, noMarkersFound } = parsePastedText(pasteText);
      if (noMarkersFound) {
        setLocalNotice(t.input.errorNoMarkers);
        return;
      }
      if (files.length === 0) {
        setLocalNotice(t.input.errorNoPasteBlocks);
        return;
      }
      runAnalysis(projectName, files, alias, extractContract(files));
    }
  }, [mode, zipFile, pasteText, aliasText, projectName, runAnalysis, t]);

  return (
    <div className="input-panel">
      <div className="input-panel__intro">
        <p className="input-panel__eyebrow">{t.input.eyebrow}</p>
        <h1 className="input-panel__title">{t.input.title}</h1>
        <p className="input-panel__subtitle">{t.input.subtitle}</p>
      </div>

      <div className="input-panel__card">
        <div className="input-panel__tabs" role="tablist" aria-label="Input mode">
          <button
            role="tab"
            aria-selected={mode === "zip"}
            className={`input-panel__tab ${mode === "zip" ? "is-active" : ""}`}
            onClick={() => switchMode("zip")}
          >
            {t.input.tabZip}
          </button>
          {folderPickerSupported && (
            <button
              role="tab"
              aria-selected={mode === "folder"}
              className={`input-panel__tab ${mode === "folder" ? "is-active" : ""}`}
              onClick={() => switchMode("folder")}
            >
              {t.input.tabFolder}
            </button>
          )}
          <button
            role="tab"
            aria-selected={mode === "paste"}
            className={`input-panel__tab ${mode === "paste" ? "is-active" : ""}`}
            onClick={() => switchMode("paste")}
          >
            {t.input.tabPaste}
          </button>
        </div>

        <label className="input-panel__field">
          <span>{t.input.fieldProjectName}</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={t.input.projectNamePlaceholder}
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
                <p>{t.input.dropzoneZipIdle}</p>
                <p className="input-panel__hint">{t.input.dropzoneZipHint}</p>
              </>
            )}
          </div>
        ) : mode === "folder" ? (
          <div
            className={`input-panel__dropzone input-panel__folder-zone${isReadingFolder ? " is-reading" : ""}`}
            onClick={!isReadingFolder ? handlePickFolder : undefined}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !isReadingFolder) handlePickFolder();
            }}
            aria-label="Pick a project folder"
          >
            {isReadingFolder ? (
              <p>{t.input.dropzoneFolderReading}</p>
            ) : folderName ? (
              <>
                <p className="input-panel__dropzone-filename">📁 {folderName}</p>
                <p className="input-panel__hint">{t.input.dropzoneFolderChange}</p>
              </>
            ) : (
              <>
                <p>{t.input.dropzoneFolderIdle}</p>
                <p className="input-panel__hint">{t.input.dropzoneFolderHint}</p>
              </>
            )}
          </div>
        ) : (
          <label className="input-panel__field">
            <span>{t.input.fieldFileBlocks}</span>
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
          {showAlias ? t.input.aliasToggleHide : t.input.aliasToggleShow}
        </button>
        {showAlias && (
          <label className="input-panel__field">
            <span>{t.input.fieldAliasLabel}</span>
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
          disabled={status === "analyzing" || isReadingFolder}
        >
          {status === "analyzing" ? t.input.submitAnalyzing : t.input.submitAnalyze}
        </button>
      </div>
    </div>
  );
}
