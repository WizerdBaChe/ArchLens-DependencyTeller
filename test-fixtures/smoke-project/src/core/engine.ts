import { parse } from "./parser";
import { log } from "../utils/logger";

export class Engine {
  process(input: string): string {
    log("engine.process");
    return parse(input);
  }
}
