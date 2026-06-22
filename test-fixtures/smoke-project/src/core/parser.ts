import { fmt } from "../utils/format";

export function parse(raw: string): string {
  return fmt(raw.trim());
}
