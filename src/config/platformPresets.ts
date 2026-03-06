import type { PlatformProfile } from "./platformCapabilities";

export type PlatformPresetId =
  | "universal"
  | "midjourney"
  | "runway"
  | "pika"
  | "luma"
  | "krea"
  | "jimeng"
  | "keling"
  | "vidu"
  | "hailuo"
  | "wanx";

export type PlatformPreset = {
  id: PlatformPresetId;
  labelZh: string;
  labelEn: string;
  url: string;
  baseProfile: PlatformProfile;
  nativeStrategy: boolean;
  uploadMode: "upload-first" | "prompt-first";
  promptStyle: "short" | "long";
  maxRefsPerObject: number;
  patchId?: string;
  strategyNote: string;
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "universal",
    labelZh: "通用",
    labelEn: "Universal",
    url: "",
    baseProfile: "universal",
    nativeStrategy: true,
    uploadMode: "upload-first",
    promptStyle: "long",
    maxRefsPerObject: 3,
    patchId: "",
    strategyNote: "Native universal strategy."
  },
  {
    id: "midjourney",
    labelZh: "Midjourney",
    labelEn: "Midjourney",
    url: "https://www.midjourney.com/",
    baseProfile: "midjourney",
    nativeStrategy: true,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 3,
    patchId: "",
    strategyNote: "Native keyword-chain strategy."
  },
  {
    id: "runway",
    labelZh: "Runway",
    labelEn: "Runway",
    url: "https://runwayml.com/",
    baseProfile: "runway",
    nativeStrategy: true,
    uploadMode: "upload-first",
    promptStyle: "long",
    maxRefsPerObject: 3,
    patchId: "",
    strategyNote: "Native timeline-friendly strategy."
  },
  {
    id: "pika",
    labelZh: "Pika",
    labelEn: "Pika",
    url: "https://pika.art/",
    baseProfile: "runway",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 2,
    patchId: "pika_compact",
    strategyNote: "Mapped from runway with compact patch."
  },
  {
    id: "luma",
    labelZh: "Luma",
    labelEn: "Luma",
    url: "https://lumalabs.ai/dream-machine",
    baseProfile: "runway",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 2,
    patchId: "luma_concise",
    strategyNote: "Mapped from runway with concise camera wording."
  },
  {
    id: "krea",
    labelZh: "Krea",
    labelEn: "Krea",
    url: "https://www.krea.ai/",
    baseProfile: "midjourney",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 2,
    patchId: "",
    strategyNote: "Mapped from midjourney prompt chain."
  },
  {
    id: "jimeng",
    labelZh: "即梦",
    labelEn: "Jimeng",
    url: "https://jimeng.jianying.com/",
    baseProfile: "jimeng",
    nativeStrategy: true,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 3,
    patchId: "",
    strategyNote: "Native domestic concise strategy."
  },
  {
    id: "keling",
    labelZh: "可灵",
    labelEn: "Keling",
    url: "https://klingai.com/",
    baseProfile: "jimeng",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "short",
    maxRefsPerObject: 3,
    patchId: "keling_refs_strict",
    strategyNote: "Mapped from jimeng with refs-first patch."
  },
  {
    id: "vidu",
    labelZh: "Vidu",
    labelEn: "Vidu",
    url: "https://www.vidu.cn/",
    baseProfile: "runway",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "long",
    maxRefsPerObject: 3,
    patchId: "vidu_sequence",
    strategyNote: "Mapped from runway with sequence-preserving patch."
  },
  {
    id: "hailuo",
    labelZh: "海螺 AI",
    labelEn: "Hailuo AI",
    url: "https://hailuoai.com/",
    baseProfile: "runway",
    nativeStrategy: false,
    uploadMode: "upload-first",
    promptStyle: "long",
    maxRefsPerObject: 3,
    patchId: "hailuo_budget_tail",
    strategyNote: "Mapped from runway with tighter budget trim."
  },
  {
    id: "wanx",
    labelZh: "通义万相",
    labelEn: "Wanx",
    url: "https://tongyi.aliyun.com/wanxiang/",
    baseProfile: "qwen",
    nativeStrategy: true,
    uploadMode: "upload-first",
    promptStyle: "long",
    maxRefsPerObject: 3,
    patchId: "wanx_structured",
    strategyNote: "Native structured qwen strategy."
  }
];

export function getPlatformPreset(id: PlatformPresetId): PlatformPreset {
  return PLATFORM_PRESETS.find((item) => item.id === id) ?? PLATFORM_PRESETS[0];
}

export function getPlatformLabel(id: PlatformPresetId, lang: "zh" | "en"): string {
  const preset = getPlatformPreset(id);
  return lang === "zh" ? preset.labelZh : preset.labelEn;
}
