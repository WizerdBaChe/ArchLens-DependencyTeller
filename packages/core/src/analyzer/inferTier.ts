/**
 * @module analyzer/inferTier
 *
 * Responsibility: decide which architectural layer (tier) a file belongs to.
 *
 * Core principle: language ≠ tier. A `.py` file can be a Flask backend OR a
 * PySide6/tkinter desktop GUI (frontend); a `.ts` file is usually frontend but
 * could be an Express server (backend). So we never map extension → tier
 * directly. Instead:
 *
 *   1. Framework-import override (highest confidence): if the file imports a
 *      known frontend or backend framework, that wins.
 *   2. Extension default (medium confidence): .py → backend, web exts → frontend.
 *   3. Fallback: unknown (a neutral, "to be classified" state).
 *
 * The chosen reason is returned alongside the tier so the UI can explain
 * *why* — e.g. "backend · detected import flask".
 */
import type { NodeTier, TierReason } from "../types.js";
import type { RawImport } from "../parser/extractImports.js";

export interface TierInference {
  tier: NodeTier;
  reason: TierReason;
  /** The specific framework import that drove a `framework-import` decision, if any. */
  evidence?: string;
}

// Frameworks whose presence marks a file as a *frontend* (UI) module, regardless
// of language. Includes Python desktop GUI toolkits, which is the whole reason
// extension alone is insufficient.
const FRONTEND_FRAMEWORKS = new Set<string>([
  // Python desktop / GUI
  "tkinter",
  "PySide6",
  "PySide2",
  "PyQt5",
  "PyQt6",
  "kivy",
  "open3d",
  "pygame",
  "dearpygui",
  "wx", // wxPython
  "customtkinter",
  "flet",
  "toga",
  // JS/TS frontend (rarely needed since web exts default frontend, but explicit)
  "react",
  "react-dom",
  "vue",
  "svelte",
  "@angular/core",
  "solid-js",
]);

// Frameworks whose presence marks a file as a *backend* (server) module.
const BACKEND_FRAMEWORKS = new Set<string>([
  // Python web / server
  "flask",
  "fastapi",
  "django",
  "aiohttp",
  "tornado",
  "sanic",
  "bottle",
  "starlette",
  "falcon",
  "quart",
  // JS/TS server — lets server-side JS/TS be classified correctly despite the
  // frontend extension default.
  "express",
  "koa",
  "fastify",
  "@nestjs/core",
  "hapi",
  "@hapi/hapi",
]);

const WEB_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mts", ".cts", ".mjs", ".cjs", ".vue"];
const PY_EXTENSIONS = [".py", ".pyi"];

/** The top-level package of a specifier ("flask.cli" -> "flask", "@nestjs/core" stays whole). */
function topPackage(specifier: string): string {
  if (specifier.startsWith("@")) {
    // scoped npm package: keep "@scope/name"
    return specifier.split("/").slice(0, 2).join("/");
  }
  // dotted python ("a.b.c") or path npm ("a/b") — take the first segment.
  return specifier.split(/[./]/)[0]!;
}

function endsWithAny(path: string, exts: string[]): boolean {
  const lower = path.toLowerCase();
  return exts.some((ext) => lower.endsWith(ext));
}

export function inferTier(path: string, rawImports: RawImport[]): TierInference {
  // 1. Framework-import override.
  for (const imp of rawImports) {
    const pkg = topPackage(imp.specifier);
    if (FRONTEND_FRAMEWORKS.has(pkg)) {
      return { tier: "frontend", reason: "framework-import", evidence: pkg };
    }
    if (BACKEND_FRAMEWORKS.has(pkg)) {
      return { tier: "backend", reason: "framework-import", evidence: pkg };
    }
  }

  // 2. Extension default.
  if (endsWithAny(path, PY_EXTENSIONS)) {
    return { tier: "backend", reason: "extension-default" };
  }
  if (endsWithAny(path, WEB_EXTENSIONS)) {
    return { tier: "frontend", reason: "extension-default" };
  }

  // 3. Nothing to go on.
  return { tier: "unknown", reason: "fallback-unknown" };
}
