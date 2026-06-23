import { describe, expect, it } from "vitest";
import { analyzeProject } from "../index.js";

describe("analyzeProject (end-to-end)", () => {
  const files = [
    { path: "src/app.tsx", content: `
      import { Button } from "./components/Button";
      import { api } from "@/lib/api";
      import { ghost } from "./missing/module";
      export const App = () => Button;
    ` },
    { path: "src/components/Button.tsx", content: `
      import { theme } from "../theme";
      export const Button = () => theme;
    ` },
    { path: "src/theme.ts", content: `
      import { Button } from "./components/Button";
      export const theme = { Button };
    ` },
    { path: "src/lib/api.ts", content: `
      export const api = () => fetch("/x");
    ` },
  ];

  it("produces a consistent normalized graph", () => {
    const result = analyzeProject({
      projectName: "fixture",
      files,
      alias: { "@/*": "src/*" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { graph } = result;
    expect(graph.project.fileCount).toBe(4);
    expect(graph.nodes).toHaveLength(4);
  });

  it("detects the circular dependency between Button and theme", () => {
    const result = analyzeProject({ projectName: "fixture", files, alias: { "@/*": "src/*" } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.graph.cycles).toHaveLength(1);
    expect(new Set(result.graph.cycles[0])).toEqual(
      new Set(["src/components/Button.tsx", "src/theme.ts"])
    );

    const button = result.graph.nodes.find((n) => n.id === "src/components/Button.tsx");
    expect(button?.metrics.isCircular).toBe(true);
  });

  it("resolves alias imports correctly", () => {
    const result = analyzeProject({ projectName: "fixture", files, alias: { "@/*": "src/*" } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const aliasEdge = result.graph.edges.find(
      (e) => e.from === "src/app.tsx" && e.to === "src/lib/api.ts"
    );
    expect(aliasEdge).toBeDefined();
  });

  it("reports unresolved imports as warnings, never silently", () => {
    const result = analyzeProject({ projectName: "fixture", files, alias: { "@/*": "src/*" } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const warning = result.graph.warnings.find((w) => w.code === "UNRESOLVED_IMPORT");
    expect(warning?.raw).toBe("./missing/module");
    expect(warning?.path).toBe("src/app.tsx");
  });

  it("returns an explicit error state for empty input", () => {
    const result = analyzeProject({ projectName: "empty", files: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NO_INPUT");
  });

  it("returns an explicit error state when no supported files exist", () => {
    const result = analyzeProject({
      projectName: "unsupported",
      files: [{ path: "README.md", content: "# hello" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("NO_SUPPORTED_FILES");
  });

  describe("Vue SFC support", () => {
    const vueFiles = [
      {
        path: "src/App.vue",
        content: `
<template><div><MyButton /></div></template>
<script setup lang="ts">
import MyButton from './components/MyButton.vue'
import { useCounter } from './composables/useCounter'
</script>
`,
      },
      {
        path: "src/components/MyButton.vue",
        content: `
<template><button>Click</button></template>
<script setup lang="ts">
import { defineEmits } from 'vue'
const emit = defineEmits(['click'])
</script>
`,
      },
      {
        path: "src/composables/useCounter.ts",
        content: `
import { ref } from 'vue'
export function useCounter() { return ref(0) }
`,
      },
    ];

    it("resolves .vue-to-.vue and .vue-to-.ts edges correctly", () => {
      const result = analyzeProject({ projectName: "vue-fixture", files: vueFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const { graph } = result;
      expect(graph.project.fileCount).toBe(3);
      expect(graph.nodes).toHaveLength(3);

      const appToButton = graph.edges.find(
        (e) => e.from === "src/App.vue" && e.to === "src/components/MyButton.vue"
      );
      expect(appToButton).toBeDefined();

      const appToCounter = graph.edges.find(
        (e) => e.from === "src/App.vue" && e.to === "src/composables/useCounter.ts"
      );
      expect(appToCounter).toBeDefined();
    });

    it("does not produce edges for external vue imports (e.g. 'vue')", () => {
      const result = analyzeProject({ projectName: "vue-fixture", files: vueFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const externalVueEdge = result.graph.edges.find((e) => e.to === "vue");
      expect(externalVueEdge).toBeUndefined();
    });

    it("treats a template-only .vue file as a valid (isolated) node", () => {
      const result = analyzeProject({
        projectName: "vue-fixture",
        files: [{ path: "src/Static.vue", content: "<template><p>Hello</p></template>" }],
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.graph.nodes).toHaveLength(1);
      expect(result.graph.edges).toHaveLength(0);
    });
  });

  describe("Python + mixed-tier support", () => {
    const mixedFiles = [
      {
        path: "server/app.py",
        content: `
import flask
from .db import get_user
from .helpers import format_name
`,
      },
      {
        path: "server/db.py",
        content: `import sqlite3\ndef get_user(): return None`,
      },
      {
        path: "server/helpers.py",
        content: `def format_name(n): return n`,
      },
      {
        path: "gui/main.py",
        content: `from PySide6.QtWidgets import QApplication\nimport sys`,
      },
      {
        path: "web/App.tsx",
        content: `import React from "react";\nexport const App = () => null;`,
      },
    ];

    it("parses .py files and resolves relative imports into edges", () => {
      const result = analyzeProject({ projectName: "mixed", files: mixedFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const appToDb = result.graph.edges.find(
        (e) => e.from === "server/app.py" && e.to === "server/db.py"
      );
      const appToHelpers = result.graph.edges.find(
        (e) => e.from === "server/app.py" && e.to === "server/helpers.py"
      );
      expect(appToDb).toBeDefined();
      expect(appToHelpers).toBeDefined();
    });

    it("does not warn about external/stdlib python imports (flask, sys, sqlite3)", () => {
      const result = analyzeProject({ projectName: "mixed", files: mixedFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.graph.warnings.some((w) => w.code === "UNRESOLVED_IMPORT")).toBe(false);
    });

    it("infers tiers: flask=backend, PySide6=frontend, plain .py=backend, .tsx=frontend", () => {
      const result = analyzeProject({ projectName: "mixed", files: mixedFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const tierOf = (id: string) => result.graph.nodes.find((n) => n.id === id)?.tier;
      expect(tierOf("server/app.py")).toBe("backend"); // flask override
      expect(tierOf("gui/main.py")).toBe("frontend"); // PySide6 override
      expect(tierOf("server/db.py")).toBe("backend"); // .py default
      expect(tierOf("web/App.tsx")).toBe("frontend"); // react / web ext
    });

    it("flags an edge crossing the frontend↔backend boundary as crossTier", () => {
      const crossFiles = [
        {
          path: "web/App.tsx",
          content: `import React from "react";\nimport { handler } from "../server/route";\nexport const App = () => handler;`,
        },
        {
          path: "server/route.ts",
          content: `import express from "express";\nexport const handler = express();`,
        },
        {
          path: "web/util.ts",
          content: `import React from "react";\nexport const x = React;`,
        },
      ];
      const result = analyzeProject({ projectName: "cross", files: crossFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // frontend (App.tsx) -> backend (route.ts via express) crosses the boundary.
      const crossEdge = result.graph.edges.find(
        (e) => e.from === "web/App.tsx" && e.to === "server/route.ts"
      );
      expect(crossEdge?.crossTier).toBe(true);
    });

    it("does not flag a same-tier edge as crossTier", () => {
      const result = analyzeProject({ projectName: "mixed", files: mixedFiles });
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      // server/app.py -> server/db.py is backend -> backend: not a crossing.
      const sameTier = result.graph.edges.find(
        (e) => e.from === "server/app.py" && e.to === "server/db.py"
      );
      expect(sameTier?.crossTier).toBe(false);
    });

    it("warns when a relative python import points nowhere", () => {
      const result = analyzeProject({
        projectName: "bad-rel",
        files: [{ path: "pkg/a.py", content: `from .missing import thing` }],
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const warning = result.graph.warnings.find((w) => w.code === "UNRESOLVED_IMPORT");
      expect(warning?.raw).toBe(".missing");
    });
  });
});
