/**
 * @module parser/extractVueScript
 *
 * Extracts the combined source code from all <script> and <script setup>
 * blocks in a Vue SFC (.vue file). The extracted code is plain JS/TS and
 * can be fed directly into the TypeScript compiler parser for import analysis.
 *
 * Explicit boundary: only script blocks are analyzed. Template expressions
 * (e.g. dynamic :is="Comp") and <style> imports require a full Vue template
 * compiler and are out of scope for static dependency graph analysis.
 */
import type { SupportedLanguage } from "../types.js";

export interface VueScriptBlock {
  /** Combined source code from all <script> / <script setup> blocks. */
  code: string;
  /** Inferred language: "ts" if any block has lang="ts", otherwise "js". */
  language: SupportedLanguage;
}

const LANG_TS_RE = /\blang\s*=\s*["']ts["']/;

/**
 * Parses a Vue SFC string and returns the combined content of all script
 * blocks along with the detected language.
 *
 * Handles Vue 3's dual-script pattern (<script> + <script setup> in the same
 * file) by concatenating both blocks.
 */
export function extractVueScript(sfcContent: string): VueScriptBlock {
  // Non-greedy match stops at the first </script>, preventing cross-block bleed.
  const scriptRe = /<script(\s[^>]*)?\s*>([\s\S]*?)<\/script>/gi;
  const parts: string[] = [];
  let isTs = false;

  let match: RegExpExecArray | null;
  while ((match = scriptRe.exec(sfcContent)) !== null) {
    const attrs = match[1] ?? "";
    const code = match[2] ?? "";
    if (LANG_TS_RE.test(attrs)) isTs = true;
    parts.push(code);
  }

  return {
    code: parts.join("\n"),
    language: isTs ? "ts" : "js",
  };
}
