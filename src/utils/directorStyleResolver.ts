import type { Lang } from "../i18n";
import type { Scene } from "../model";
import { getDirectorStylePack, parseDirectorStylePackId } from "../content/directorStylePacks";

export type ResolvedDirectorStyle = {
  packId: string | null;
  label: string;
  promptLine: string;
  defaults: {
    shot: string;
    movement: string;
    time: string;
    keyDir: string;
    mood: string;
  };
};

export function resolveDirectorStyle(scene: Scene, lang: Lang, mediaMode: "image" | "video"): ResolvedDirectorStyle {
  const packId = parseDirectorStylePackId(scene.notes ?? "");
  const pack = getDirectorStylePack(packId);
  if (!pack) {
    return {
      packId: null,
      label: lang === "zh" ? "自动" : "Auto",
      promptLine: "",
      defaults: { shot: "", movement: "", time: "", keyDir: "", mood: "" }
    };
  }

  const defaults = mediaMode === "video" ? pack.videoDefaults : pack.imageDefaults;
  return {
    packId: pack.id,
    label: lang === "zh" ? pack.labelZh : pack.labelEn,
    promptLine: lang === "zh" ? pack.promptZh : pack.promptEn,
    defaults: {
      shot: defaults?.shot ?? "",
      movement: mediaMode === "video" ? (pack.videoDefaults?.movement ?? "") : "",
      time: defaults?.time ?? "",
      keyDir: defaults?.keyDir ?? "",
      mood: defaults?.mood ?? ""
    }
  };
}
