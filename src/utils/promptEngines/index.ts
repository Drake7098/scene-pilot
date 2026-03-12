import { builtinPromptPlatformEngines } from "./builtin";
import type { PlatformAdaptInput, PlatformAdaptResult, PromptPlatformEngine } from "./types";

class PromptPlatformEngineRegistry {
  private engines: PromptPlatformEngine[];

  constructor(engines: PromptPlatformEngine[]) {
    this.engines = [...engines];
  }

  register(engine: PromptPlatformEngine) {
    this.engines = [engine, ...this.engines.filter((item) => item.key !== engine.key)];
  }

  list(): PromptPlatformEngine[] {
    return [...this.engines];
  }

  resolve(input: PlatformAdaptInput): PromptPlatformEngine {
    return this.engines.find((engine) => engine.supports(input)) ?? this.engines[this.engines.length - 1];
  }

  adapt(input: PlatformAdaptInput): PlatformAdaptResult {
    return this.resolve(input).adapt(input);
  }
}

const registry = new PromptPlatformEngineRegistry(builtinPromptPlatformEngines);

export function getPromptPlatformEngineRegistry(): PromptPlatformEngineRegistry {
  return registry;
}

export function registerPromptPlatformEngine(engine: PromptPlatformEngine) {
  registry.register(engine);
}

export function listPromptPlatformEngines(): PromptPlatformEngine[] {
  return registry.list();
}

export function adaptPromptWithPlatformEngine(input: PlatformAdaptInput): PlatformAdaptResult {
  return registry.adapt(input);
}

export type { PlatformAdaptInput, PlatformAdaptMeta, PlatformAdaptResult, PromptPlatformEngine } from "./types";
