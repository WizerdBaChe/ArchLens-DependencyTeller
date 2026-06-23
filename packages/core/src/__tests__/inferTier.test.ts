import { describe, expect, it } from "vitest";
import { inferTier } from "../analyzer/inferTier.js";
import type { RawImport } from "../parser/extractImports.js";

const imp = (specifier: string): RawImport => ({ specifier, kind: "import" });

describe("inferTier", () => {
  it("marks a Python file importing a GUI toolkit as frontend (framework override)", () => {
    const result = inferTier("app/window.py", [imp("PySide6.QtWidgets")]);
    expect(result.tier).toBe("frontend");
    expect(result.reason).toBe("framework-import");
    expect(result.evidence).toBe("PySide6");
  });

  it("marks tkinter as frontend", () => {
    expect(inferTier("ui.py", [imp("tkinter")]).tier).toBe("frontend");
  });

  it("marks a Python file importing flask as backend (framework override)", () => {
    const result = inferTier("server/app.py", [imp("flask")]);
    expect(result.tier).toBe("backend");
    expect(result.reason).toBe("framework-import");
    expect(result.evidence).toBe("flask");
  });

  it("defaults a plain .py file to backend by extension", () => {
    const result = inferTier("utils/helpers.py", [imp("os"), imp("json")]);
    expect(result.tier).toBe("backend");
    expect(result.reason).toBe("extension-default");
  });

  it("defaults a .tsx file to frontend by extension", () => {
    const result = inferTier("src/Button.tsx", [imp("react")]);
    // react is a known frontend framework — still frontend, just via override
    expect(result.tier).toBe("frontend");
  });

  it("classifies an Express .ts file as backend despite the frontend default", () => {
    const result = inferTier("src/server.ts", [imp("express")]);
    expect(result.tier).toBe("backend");
    expect(result.reason).toBe("framework-import");
  });

  it("returns unknown for a file with no extension and no framework signal", () => {
    const result = inferTier("Makefile", []);
    expect(result.tier).toBe("unknown");
    expect(result.reason).toBe("fallback-unknown");
  });
});
