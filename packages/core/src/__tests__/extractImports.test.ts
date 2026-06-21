import { describe, expect, it } from "vitest";
import { extractImports } from "../parser/extractImports.js";

describe("extractImports", () => {
  it("extracts static ES imports", () => {
    const { imports } = extractImports("a.ts", `import { foo } from "./foo";`);
    expect(imports).toEqual([{ specifier: "./foo", kind: "import" }]);
  });

  it("extracts side-effect-only imports", () => {
    const { imports } = extractImports("a.ts", `import "./polyfill";`);
    expect(imports).toEqual([{ specifier: "./polyfill", kind: "import" }]);
  });

  it("extracts export-from re-exports", () => {
    const { imports } = extractImports("a.ts", `export { foo } from "./foo";`);
    expect(imports).toEqual([{ specifier: "./foo", kind: "export-from" }]);
  });

  it("extracts CommonJS require calls", () => {
    const { imports } = extractImports("a.js", `const x = require("./bar");`, "js");
    expect(imports).toEqual([{ specifier: "./bar", kind: "require" }]);
  });

  it("extracts dynamic imports", () => {
    const { imports } = extractImports("a.ts", `const mod = await import("./baz");`);
    expect(imports).toEqual([{ specifier: "./baz", kind: "dynamic-import" }]);
  });

  it("handles multiple imports in one file", () => {
    const { imports } = extractImports(
      "a.tsx",
      `
      import React from "react";
      import { Button } from "./Button";
      import "./styles.css";
      `,
      "tsx"
    );
    expect(imports.map((i) => i.specifier)).toEqual(["react", "./Button", "./styles.css"]);
  });

  it("returns no imports for a file with none", () => {
    const { imports } = extractImports("a.ts", `export const x = 1;`);
    expect(imports).toEqual([]);
  });
});
