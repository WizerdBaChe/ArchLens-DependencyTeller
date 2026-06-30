import type { ArchitectureContract } from "../types.js";

export type ContractParseResult =
  | { ok: true; contract: ArchitectureContract }
  | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function isArchitectureContract(v: unknown): v is ArchitectureContract {
  if (!isRecord(v)) return false;
  if (typeof v.version !== "string") return false;
  if (!isRecord(v.layers)) return false;
  for (const globs of Object.values(v.layers)) {
    if (!Array.isArray(globs) || !globs.every((g) => typeof g === "string")) return false;
  }
  if (!Array.isArray(v.rules)) return false;
  for (const r of v.rules) {
    if (!isRecord(r)) return false;
    if (r.type !== "forbid") return false;
    if (typeof r.from !== "string" || typeof r.to !== "string") return false;
    if (r.message !== undefined && typeof r.message !== "string") return false;
  }
  return true;
}

/**
 * Parses and structurally validates archlens.contract.json text.
 * Returns a typed result — never throws; invalid input yields a readable error string.
 */
export function parseContract(jsonText: string): ContractParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${err instanceof Error ? err.message : String(err)}` };
  }
  if (!isArchitectureContract(parsed)) {
    return {
      ok: false,
      error:
        "Contract schema invalid — expected { version: string, layers: Record<string,string[]>, rules: Array<{type:'forbid', from:string, to:string, message?:string}> }",
    };
  }
  return { ok: true, contract: parsed };
}
