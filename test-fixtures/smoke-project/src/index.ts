import { Engine } from "./core/engine";
import { log } from "./utils/logger";

export function run(): void {
  const e = new Engine();
  log(e.process("hello"));
}
