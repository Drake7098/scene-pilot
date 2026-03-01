export type Lang = "zh" | "en";

export const dict = {
  en: {
    "app.title": "ScenePilot",
    "app.tagline": "Visual Scene Orchestrator",
    "app.keyMessage":
      "ScenePilot helps reduce prompt trial-and-error and token waste by pre-structuring scenes, often saving 40%–70% of token cost in iterative generation.",

    "mode.static": "Static",
    "mode.storyboard": "Storyboard",

    "top.newProject": "New Project",
    "top.save": "Save Project",
    "top.load": "Load Project",
    "top.exportJson": "Export JSON",
    "top.exportPrompts": "Export Prompts",

    "sidebar.scenes": "Scenes",
    "sidebar.addScene": "Add Scene",
    "sidebar.deleteScene": "Delete Scene",
    "sidebar.duration": "Duration",

    "sidebar.layers": "Layers",
    "sidebar.addLayer": "Add Object",
    "sidebar.deleteLayer": "Delete Object",

    "props.title": "Properties",
    "props.noSelection": "No object selected",
    "props.id": "Object ID",
    "props.type": "Type",
    "props.shape": "Shape",
    "props.z": "Z-Order",
    "props.color": "Color",
    "props.opacity": "Opacity",
    "props.notes": "Notes",
    "props.keyframes": "Keyframes",

    "export.title": "Export",
    "export.jsonTab": "JSON Data",
    "export.promptsTab": "Prompts",
    "export.copyJson": "Copy JSON",
    "export.copyPrompts": "Copy Prompts",
    "export.downloadJson": "Download JSON",
    "export.generatedPrompts": "Generated Prompts",
    "export.keyMessageTitle": "Key Message",

    "camera.title": "Camera",
    "camera.shot": "Shot",
    "camera.movement": "Movement",

    "lighting.title": "Lighting",
    "lighting.time": "Time",
    "lighting.keyDir": "Key Dir",
    "lighting.mood": "Mood",

    "common.copy": "Copy",
    "common.copied": "Copied!",
    "common.custom": "Custom…",
    "common.customInput": "Type custom value",

    // option labels (UI only)
    "opt.wide": "Wide",
    "opt.medium": "Medium",
    "opt.close": "Close",
    "opt.extreme_close": "Extreme Close",
    "opt.over_shoulder": "Over-Shoulder",
    "opt.dutch_angle": "Dutch Angle",

    "opt.static": "Static",
    "opt.slow_push_in": "Push In",
    "opt.slow_pull_out": "Pull Out",
    "opt.pan_left": "Pan Left",
    "opt.pan_right": "Pan Right",
    "opt.tilt_up": "Tilt Up",
    "opt.tilt_down": "Tilt Down",
    "opt.handheld": "Handheld",
    "opt.orbit": "Orbit",

    "opt.day": "Day",
    "opt.dawn": "Dawn",
    "opt.sunset": "Sunset",
    "opt.golden_hour": "Golden Hour",
    "opt.blue_hour": "Blue Hour",
    "opt.night": "Night",

    "opt.top_left": "Top Left",
    "opt.top_right": "Top Right",
    "opt.bottom_left": "Bottom Left",
    "opt.bottom_right": "Bottom Right",
    "opt.backlight": "Backlight",
    "opt.rim_light": "Rim Light",

    "opt.cinematic": "Cinematic",
    "opt.mysterious": "Mysterious",
    "opt.bright": "Bright",
    "opt.dark": "Dark",
    "opt.noir": "Noir",
    "opt.warm": "Warm",
    "opt.cold": "Cold"
  },

  zh: {
    "app.title": "ScenePilot",
    "app.tagline": "场景领航",
    "app.keyMessage":
      "ScenePilot 通过在生成前结构化分镜与构图，减少反复改提示词与无效生成，迭代中常可节省约 40%–70% 的 token 成本。",

    "mode.static": "静态模式",
    "mode.storyboard": "故事板",

    "top.newProject": "新建项目",
    "top.save": "保存项目",
    "top.load": "加载项目",
    "top.exportJson": "导出 JSON",
    "top.exportPrompts": "导出提示词",

    "sidebar.scenes": "分镜列表",
    "sidebar.addScene": "添加分镜",
    "sidebar.deleteScene": "删除分镜",
    "sidebar.duration": "时长",

    "sidebar.layers": "对象",
    "sidebar.addLayer": "添加对象",
    "sidebar.deleteLayer": "删除对象",

    "props.title": "属性",
    "props.noSelection": "未选中对象",
    "props.id": "对象 ID",
    "props.type": "类型",
    "props.shape": "形状",
    "props.z": "层级 (Z)",
    "props.color": "颜色",
    "props.opacity": "不透明度",
    "props.notes": "备注",
    "props.keyframes": "关键帧",

    "export.title": "导出",
    "export.jsonTab": "JSON 数据",
    "export.promptsTab": "提示词",
    "export.copyJson": "复制 JSON",
    "export.copyPrompts": "复制提示词",
    "export.downloadJson": "下载 JSON",
    "export.generatedPrompts": "生成的提示词",
    "export.keyMessageTitle": "核心信息",

    "camera.title": "摄像机",
    "camera.shot": "景别",
    "camera.movement": "运动",

    "lighting.title": "光照",
    "lighting.time": "时间段",
    "lighting.keyDir": "主光方向",
    "lighting.mood": "氛围",

    "common.copy": "复制",
    "common.copied": "已复制!",
    "common.custom": "自定义…",
    "common.customInput": "输入自定义值",

    "opt.wide": "全景",
    "opt.medium": "中景",
    "opt.close": "特写",
    "opt.extreme_close": "大特写",
    "opt.over_shoulder": "过肩镜头",
    "opt.dutch_angle": "倾斜镜头",

    "opt.static": "固定",
    "opt.slow_push_in": "缓慢推近",
    "opt.slow_pull_out": "缓慢拉远",
    "opt.pan_left": "左移",
    "opt.pan_right": "右移",
    "opt.tilt_up": "上摇",
    "opt.tilt_down": "下摇",
    "opt.handheld": "手持",
    "opt.orbit": "环绕",

    "opt.day": "白天",
    "opt.dawn": "黎明",
    "opt.sunset": "黄昏",
    "opt.golden_hour": "金色时刻",
    "opt.blue_hour": "蓝调时刻",
    "opt.night": "夜晚",

    "opt.top_left": "左上",
    "opt.top_right": "右上",
    "opt.bottom_left": "左下",
    "opt.bottom_right": "右下",
    "opt.backlight": "逆光",
    "opt.rim_light": "轮廓光",

    "opt.cinematic": "电影感",
    "opt.mysterious": "神秘",
    "opt.bright": "明亮",
    "opt.dark": "阴沉",
    "opt.noir": "黑色电影",
    "opt.warm": "暖色",
    "opt.cold": "冷色"
  }
} as const;

export function t(lang: Lang, key: string): string {
  const langDict = dict[lang] as Record<string, string>;
  const enDict = dict.en as Record<string, string>;
  return langDict[key] || enDict[key] || key;
}

export function tAny(lang: Lang, key: string): string {
  return t(lang, key);
}
