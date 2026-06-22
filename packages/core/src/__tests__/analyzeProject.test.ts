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
});
