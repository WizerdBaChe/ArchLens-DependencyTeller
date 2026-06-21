import type { AliasConfig } from "@archlens/core";

export interface AliasParseOutcome {
  alias: AliasConfig;
  error?: string;
}

/**
 * Accepts either:
 *   1. A JSON object:           { "@/*": "src/*" }
 *   2. Simple line-based pairs: @/*  ->  src/*
 * so users can paste straight from tsconfig.json "paths" or type quickly.
 */
export function parseAliasConfig(raw: string): AliasParseOutcome {
  const trimmed = raw.trim();
  if (!trimmed) return { alias: {} };

  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const alias: AliasConfig = {};
      for (const [key, value] of Object.entries(parsed)) {
        // tsconfig "paths" values are arrays like ["src/*"]; take the first.
        const target = Array.isArray(value) ? value[0] : value;
        if (typeof target === "string") alias[key] = target;
      }
      return { alias };
    } catch {
      return { alias: {}, error: "Could not parse alias JSON — check for a trailing comma or missing quote." };
    }
  }

  const alias: AliasConfig = {};
  for (const line of trimmed.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [key, value] = line.split("->").map((p) => p.trim());
    if (key && value) alias[key] = value;
  }
  return { alias };
}
