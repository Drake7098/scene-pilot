/**
 * Rules engine types.
 */

import type {
  ProjectConfig,
  SceneConfig,
  ObjectConfig,
  ExportConfig,
} from "../model/configSchema";
import type { EditorScene } from "../state/editorTypes";
import type { FieldKey } from "./fieldKeys";

export type RuleContext = {
  project: ProjectConfig;
  scene: EditorScene | null;
  sceneCount: number;
  selectedObject: ObjectConfig | null;
  exportConfig: ExportConfig;
  allScenes: EditorScene[];
  /** Index of current scene in allScenes, for patch paths */
  sceneIndex: number;
};

export type FieldState = {
  visible: boolean;
  enabled: boolean;
  reason?: string;
  required?: boolean;
};

export type OptionState<T extends string = string> = {
  value: T;
  enabled: boolean;
  reason?: string;
};

export type RulePatch = {
  path: string;
  value: unknown;
  reason: string;
};

export type RuleEngineResult = {
  fieldStates: Partial<Record<FieldKey, FieldState>>;
  optionStates: Partial<Record<FieldKey, OptionState[]>>;
  patches: RulePatch[];
  warnings: string[];
};
