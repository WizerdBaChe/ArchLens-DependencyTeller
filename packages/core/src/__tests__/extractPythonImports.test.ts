import { describe, expect, it } from "vitest";
import { extractPythonImports } from "../parser/extractPythonImports.js";

describe("extractPythonImports", () => {
  it("extracts a simple import", () => {
    const { imports } = extractPythonImports("a.py", `import os`);
    expect(imports).toEqual([{ specifier: "os", kind: "import" }]);
  });

  it("extracts dotted imports", () => {
    const { imports } = extractPythonImports("a.py", `import a.b.c`);
    expect(imports).toEqual([{ specifier: "a.b.c", kind: "import" }]);
  });

  it("drops `as` aliases", () => {
    const { imports } = extractPythonImports("a.py", `import numpy as np`);
    expect(imports).toEqual([{ specifier: "numpy", kind: "import" }]);
  });

  it("splits comma-separated imports", () => {
    const { imports } = extractPythonImports("a.py", `import os, sys, a.b as c`);
    expect(imports.map((i) => i.specifier)).toEqual(["os", "sys", "a.b"]);
  });

  it("extracts the module from `from ... import ...`", () => {
    const { imports } = extractPythonImports("a.py", `from a.b import c, d`);
    expect(imports).toEqual([{ specifier: "a.b", kind: "import" }]);
  });

  it("preserves relative import dots", () => {
    const { imports } = extractPythonImports(
      "pkg/a.py",
      `from . import sibling\nfrom ..pkg import thing`
    );
    expect(imports.map((i) => i.specifier)).toEqual([".", "..pkg"]);
  });

  it("ignores imports inside docstrings", () => {
    const src = `"""\nimport not_real\n"""\nimport real`;
    const { imports } = extractPythonImports("a.py", src);
    expect(imports).toEqual([{ specifier: "real", kind: "import" }]);
  });

  it("ignores commented-out imports", () => {
    const { imports } = extractPythonImports("a.py", `# import commented\nimport real`);
    expect(imports).toEqual([{ specifier: "real", kind: "import" }]);
  });

  it("returns no imports for a file with none", () => {
    const { imports } = extractPythonImports("a.py", `x = 1`);
    expect(imports).toEqual([]);
  });
});
