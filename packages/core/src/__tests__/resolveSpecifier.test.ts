import { describe, expect, it } from "vitest";
import { resolveSpecifier } from "../resolver/resolveSpecifier.js";

describe("resolveSpecifier", () => {
  const fileSet = new Set([
    "src/app.tsx",
    "src/components/Button.tsx",
    "src/lib/api.ts",
    "src/lib/index.ts",
  ]);

  it("resolves a relative import with explicit extension match via fallback", () => {
    const result = resolveSpecifier("src/app.tsx", "./components/Button", fileSet, undefined);
    expect(result).toEqual({ status: "file", id: "src/components/Button.tsx" });
  });

  it("resolves a relative import to an index file", () => {
    const result = resolveSpecifier("src/app.tsx", "./lib", fileSet, undefined);
    expect(result).toEqual({ status: "file", id: "src/lib/index.ts" });
  });

  it("resolves parent-relative paths", () => {
    const result = resolveSpecifier("src/components/Button.tsx", "../lib/api", fileSet, undefined);
    expect(result).toEqual({ status: "file", id: "src/lib/api.ts" });
  });

  it("resolves alias-prefixed specifiers", () => {
    const alias = { "@/*": "src/*" };
    const result = resolveSpecifier("src/app.tsx", "@/lib/api", fileSet, alias);
    expect(result).toEqual({ status: "file", id: "src/lib/api.ts" });
  });

  it("treats unaliased bare specifiers as external packages", () => {
    const result = resolveSpecifier("src/app.tsx", "react", fileSet, undefined);
    expect(result).toEqual({ status: "external", packageName: "react" });
  });

  it("treats scoped packages as a single external package id", () => {
    const result = resolveSpecifier("src/app.tsx", "@scope/pkg/sub", fileSet, undefined);
    expect(result).toEqual({ status: "external", packageName: "@scope/pkg" });
  });

  it("reports unresolved when a relative path matches nothing", () => {
    const result = resolveSpecifier("src/app.tsx", "./missing", fileSet, undefined);
    expect(result).toEqual({ status: "unresolved" });
  });
});
