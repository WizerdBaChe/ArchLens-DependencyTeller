import { describe, expect, it } from "vitest";
import { extractVueScript } from "../parser/extractVueScript.js";

describe("extractVueScript", () => {
  it("extracts imports from a <script setup lang='ts'> block", () => {
    const sfc = `
<template><div>Hello</div></template>
<script setup lang="ts">
import { ref } from 'vue'
import MyComp from './MyComp.vue'
const x = ref(0)
</script>
`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("ts");
    expect(code).toContain("import { ref } from 'vue'");
    expect(code).toContain("import MyComp from './MyComp.vue'");
  });

  it("detects JavaScript when lang='ts' is absent", () => {
    const sfc = `
<script>
import { something } from './util'
</script>
`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("js");
    expect(code).toContain("import { something } from './util'");
  });

  it("combines both <script> and <script setup> blocks (Vue 3 dual-script pattern)", () => {
    const sfc = `
<script lang="ts">
export default { name: 'MyComp' }
</script>
<script setup lang="ts">
import { ref } from 'vue'
</script>
`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("ts");
    expect(code).toContain("export default");
    expect(code).toContain("import { ref }");
  });

  it("returns empty code and js language for a template-only SFC", () => {
    const sfc = `<template><div>Hello</div></template>`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("js");
    expect(code.trim()).toBe("");
  });

  it("ignores <style> block content", () => {
    const sfc = `
<template><div class="foo">Hi</div></template>
<script setup>
import './styles.css'
</script>
<style scoped>
.foo { color: red; }
</style>
`;
    const { code } = extractVueScript(sfc);
    expect(code).not.toContain(".foo");
    expect(code).toContain("import './styles.css'");
  });

  it("does not bleed across script blocks with non-greedy match", () => {
    const sfc = `
<script>
const a = 1
</script>
<template><div></div></template>
<script setup lang="ts">
import { b } from './b'
</script>
`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("ts");
    expect(code).toContain("const a = 1");
    expect(code).toContain("import { b } from './b'");
    // template content must not leak in
    expect(code).not.toContain("<div>");
  });

  it("handles <script setup> without lang attribute as js", () => {
    const sfc = `
<script setup>
import Foo from './Foo.vue'
</script>
`;
    const { code, language } = extractVueScript(sfc);
    expect(language).toBe("js");
    expect(code).toContain("import Foo from './Foo.vue'");
  });
});
