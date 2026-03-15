/**
 * Help Center — full help content for all 14 sections (Stage 2).
 * Aligned with template system, billing, rule matrix, prompt/export, template spec.
 * Each section: titleZh, titleEn, blocks[]. Each block: titleZh, titleEn, textZh, textEn.
 */

import type { HelpSectionId } from "./types";

export type HelpContentBlock = {
  titleZh: string;
  titleEn: string;
  textZh: string;
  textEn: string;
};

export type HelpSectionContent = {
  titleZh: string;
  titleEn: string;
  blocks: HelpContentBlock[];
};

const CONTENT: Record<HelpSectionId, HelpSectionContent> = {
  intro: {
    titleZh: "简介",
    titleEn: "Introduction",
    blocks: [
      {
        titleZh: "ScenePilotix 是什么",
        titleEn: "What is ScenePilotix",
        textZh: "ScenePilotix 是结构化提示词工作台。通过分镜、镜头、布光与对象结构生成可复用的提示词，便于在各类大模型或生成平台上使用。",
        textEn: "ScenePilotix is a structured prompt workspace. It produces reusable prompts from storyboard, camera, lighting, and object structure for use on model or generation platforms."
      },
      {
        titleZh: "四步流程",
        titleEn: "Four-step flow",
        textZh: "1) 创建项目：选择图片或视频，确定单张结构或逐镜编辑。\n2) 使用模板：从模板库选用模板，一键带入分镜与镜头结构（可选）。\n3) 编辑结构：调整分镜数量、对象位置、镜头与布光。\n4) 导出提示词：复制或导出 TXT / 交付包，到目标平台验证。",
        textEn: "1) Create project: choose Image or Video for single-image or shot-by-shot flow.\n2) Use templates: pick a template to apply structure (optional).\n3) Edit structure: adjust shots, objects, camera, lighting.\n4) Export prompts: copy or export TXT / package to your target platform."
      }
    ]
  },

  workspace: {
    titleZh: "工作台",
    titleEn: "Workspace",
    blocks: [
      {
        titleZh: "层级关系",
        titleEn: "Hierarchy",
        textZh: "工作台以「项目 → 分镜 → 对象」为层级。一个项目下有多镜（scene）；每镜内有多个对象（object）、镜头（camera）、布光（lighting）与导演/经典设置。",
        textEn: "The workspace follows project → scene → object. A project has multiple scenes; each scene has objects, camera, lighting, and director/classic settings."
      },
      {
        titleZh: "主要区域",
        titleEn: "Main areas",
        textZh: "侧栏：项目与分镜列表、镜头/布光/导演/经典模式。画布：布局与预览。属性面板：当前选中对象或分镜的详细字段。导出：提示词 TXT、交付包、当前分镜或连续序列、目标模型。",
        textEn: "Sidebar: project and scene list, camera, lighting, director, classic modes. Canvas: layout and preview. Props panel: fields for the selected object or scene. Export: prompt TXT, package, current scene or continuity sequence, target model."
      }
    ]
  },

  templates: {
    titleZh: "模板",
    titleEn: "Templates",
    blocks: [
      {
        titleZh: "什么是模板",
        titleEn: "What is a template",
        textZh: "模板一键带入分镜结构、镜头、布光与对象骨架。应用模板会创建新项目，不会修改当前已打开的项目。",
        textEn: "A template applies storyboard structure, camera, lighting, and object skeleton in one step. Applying a template creates a new project; it does not modify the currently open project."
      },
      {
        titleZh: "Family 与 Variant",
        titleEn: "Family and variant",
        textZh: "Template family（家族）是一组相关模板，如 dialogue_duo、crane_motion。同一 family 下有不同的 variant（变体），如 free_starter、basic_close、advanced_motion、cinematic。变体决定能力档位与费用。",
        textEn: "Template family groups related templates (e.g. dialogue_duo, crane_motion). Each family has variants (e.g. free_starter, basic_close, advanced_motion, cinematic) that define capability and cost."
      },
      {
        titleZh: "applyMode（应用模式）",
        titleEn: "Apply mode",
        textZh: "applyMode 控制写入范围：layout_only、layout_plus_style、full_workflow。只影响写入哪些字段，不改变单次费用；费用由模板元数据 template.cost 决定。",
        textEn: "applyMode controls what is written: layout_only, layout_plus_style, full_workflow. It only affects which fields are written; it does not change the per-use cost. Cost comes from template metadata (template.cost)."
      },
      {
        titleZh: "同项目不重复扣费",
        titleEn: "No repeat charge in same project",
        textZh: "扣费单位是「项目 + 模板」。同一项目内，同一模板无论应用、重新打开或再编辑多少次，只扣费一次。新项目使用同一模板可能再次扣费。",
        textEn: "The charge unit is (project + template). In the same project, the same template is charged once no matter how many times you apply, reopen, or edit. A new project may incur another charge."
      }
    ]
  },

  advanced_templates: {
    titleZh: "高级模板",
    titleEn: "Advanced Templates",
    blocks: [
      {
        titleZh: "5 credits 与能力标签",
        titleEn: "5 credits and capability tags",
        textZh: "费用为 5 credits 的模板为高级模板，至少包含以下能力之一：advanced_camera（高级镜头/L2）、continuity（多镜连续性）、director_preset（导演包）、cinematic_mode（电影模式）、drama_mode（剧情模式）。",
        textEn: "Templates that cost 5 credits are advanced and include at least one of: advanced_camera, continuity, director_preset, cinematic_mode, drama_mode."
      },
      {
        titleZh: "advanced_camera 与 L2 镜头语言",
        titleEn: "advanced_camera and L2 camera language",
        textZh: "advanced_camera 表示模板可写入隐藏的 L2 镜头语言（如 cinematic_soft、hero_entry）。这些能力由模板带入；用户在界面中只看到对应的 L1 映射标签（如「电影叙事」），不会直接看到 L2 id。",
        textEn: "advanced_camera means the template can write L2 camera language (e.g. cinematic_soft, hero_entry). These are applied by the template; users only see the L1 mapping label (e.g. “Cinematic narrative”), not the L2 id."
      },
      {
        titleZh: "continuity 与 director_preset",
        titleEn: "continuity and director_preset",
        textZh: "continuity：多镜衔接、entryDir/exitDir、@continuityId。director_preset：模板写入 directorPack，整体控制镜头与布光偏向。高级模板可能同时包含两者或其一。",
        textEn: "continuity: multi-shot linking, entryDir/exitDir, @continuityId. director_preset: template writes directorPack for overall camera and lighting bias. An advanced template may include one or both."
      }
    ]
  },

  credits: {
    titleZh: "积分",
    titleEn: "Credits",
    blocks: [
      {
        titleZh: "积分是什么",
        titleEn: "What are credits",
        textZh: "积分是 ScenePilotix 内的消费单位，用于模板应用与（未来）图片/视频生成。当前主要消耗在应用付费模板；未来内置生成也会按次消耗积分。",
        textEn: "Credits are the in-product currency for template application and (future) image/video generation. They are mainly used for paid templates now; future built-in generation will consume credits per use."
      },
      {
        titleZh: "用在哪里",
        titleEn: "Where they are used",
        textZh: "模板：每次应用付费模板按模板 cost 扣费（0 / 3 / 5）。同项目同一模板不重复扣。未来生成：图片或视频生成将按次扣费，与模板扣费分开计算。",
        textEn: "Templates: each apply of a paid template deducts by template cost (0 / 3 / 5). Same template in the same project is not charged again. Future generation: image/video generation will deduct per use, separate from template charges."
      },
      {
        titleZh: "充值包",
        titleEn: "Credit packs",
        textZh: "Starter：$3 / 20 积分。Standard：$8 / 60 积分。Creator：$18 / 160 积分。可在价格页或账户内购买。",
        textEn: "Starter: $3 / 20 credits. Standard: $8 / 60 credits. Creator: $18 / 160 credits. Available on the pricing page or in account."
      }
    ]
  },

  billing: {
    titleZh: "计费",
    titleEn: "Billing",
    blocks: [
      {
        titleZh: "模板费用档位",
        titleEn: "Template cost tiers",
        textZh: "费用从模板元数据读取，不在界面写死。0：免费模板。3：Standard。5：Premium / 连续镜头 / 高级模板（如 variant 为 multi_object 或 advanced_motion，或 category 为 continuous）。",
        textEn: "Cost is read from template metadata, not hard-coded in the UI. 0: free. 3: standard. 5: premium, continuous, or advanced (e.g. variant multi_object or advanced_motion, or category continuous)."
      },
      {
        titleZh: "同项目不重复扣",
        titleEn: "No repeat in same project",
        textZh: "扣费单位是（项目 + 模板 ID）。同一项目内同一模板只扣一次；再次应用、重新打开或编辑该项目不另扣费。新建项目并使用该模板可能再次扣费。",
        textEn: "Charge unit is (project + template ID). Same template in the same project is charged once; re-apply, reopen, or edit does not charge again. Using the template in a new project may charge again."
      },
      {
        titleZh: "Free / Pro / Enterprise",
        titleEn: "Free / Pro / Enterprise",
        textZh: "Free：可体验工作台与免费模板。Pro：订阅制，可购买积分、使用付费模板与更多能力。Enterprise：团队与定制，需联系商务。",
        textEn: "Free: use the workspace and free templates. Pro: subscription, purchase credits, use paid templates and more. Enterprise: team and custom; contact business."
      }
    ]
  },

  generation: {
    titleZh: "生成",
    titleEn: "Generation",
    blocks: [
      {
        titleZh: "当前生成方式",
        titleEn: "Current generation",
        textZh: "当前图片/视频生成通过「导出提示词 → 在目标平台生成」完成。工作台内可配置生成偏好与目标平台，但实际生成在外部平台执行。",
        textEn: "Current image/video generation is done by exporting prompts and generating on the target platform. You can set generation preferences and target platform in the workspace; actual generation runs on the external platform."
      },
      {
        titleZh: "未来内置生成",
        titleEn: "Future built-in generation",
        textZh: "未来将支持在工作台内直接发起生成。内置生成会消耗积分（与模板扣费分开）；具体档位与规则以届时产品说明为准。",
        textEn: "Future versions may support starting generation from within the workspace. Built-in generation will consume credits (separate from template charges); tiers and rules will follow product documentation at that time."
      }
    ]
  },

  camera: {
    titleZh: "镜头与运镜",
    titleEn: "Camera",
    blocks: [
      {
        titleZh: "景别与基础运镜",
        titleEn: "Shot and base movement",
        textZh: "景别（shot）：如 close、medium、wide、over_shoulder。基础运镜（movement）：如 static、slow_push_in、pan_left、orbit。先定景别和运动，再补高级层。",
        textEn: "Shot: e.g. close, medium, wide, over_shoulder. Base movement: e.g. static, slow_push_in, pan_left, orbit. Set shot and movement first, then add advanced layers."
      },
      {
        titleZh: "经典模式",
        titleEn: "Classic mode",
        textZh: "经典模式是一键拍法：选一个模式即同时设定景别、运镜、布光与转场等。适合快速出片，再按需微调。",
        textEn: "Classic mode is a one-click recipe: one mode sets shot, movement, lighting, transition, etc. Good for fast setup, then fine-tune as needed."
      },
      {
        titleZh: "PRO+ 与镜头语言分层",
        titleEn: "PRO+ and camera language layers",
        textZh: "PRO+ 只放基础层没有的语法（叙事、心理、转场、超现实等）。有 pro_basic 或 pro_plus 时，基础 movement 会置空且不可选。镜头语言分 L1（用户可选）与 L2（仅模板带入、用户见 L1 映射）。",
        textEn: "PRO+ adds grammar beyond the base layer (narrative, psychology, transition, surreal, etc.). When pro_basic or pro_plus is set, base movement is cleared and disabled. Camera language has L1 (user choice) and L2 (template-only; user sees L1 mapping)."
      }
    ]
  },

  lighting: {
    titleZh: "布光",
    titleEn: "Lighting",
    blocks: [
      {
        titleZh: "时间 / 主光方向 / 氛围",
        titleEn: "Time / key direction / mood",
        textZh: "时间（time）：day、golden_hour、night 等。主光方向（keyDir）：top_left、rim_light、backlight 等。氛围（mood）：warm、cold、cinematic、mysterious 等。可单独设置，也可由经典模式或导演包带入。",
        textEn: "Time: day, golden_hour, night, etc. Key direction: top_left, rim_light, backlight, etc. Mood: warm, cold, cinematic, mysterious, etc. You can set these directly or have them come from classic mode or director pack."
      },
      {
        titleZh: "经典模式与导演包",
        titleEn: "Classic mode and director pack",
        textZh: "经典模式会携带一套布光配置（时间、主光、氛围及 lightingProfileIds）。导演包（directorPack）也可携带布光偏好。用户仍可覆盖这些设置。",
        textEn: "Classic mode carries a lighting setup (time, key, mood, lightingProfileIds). Director pack can also carry lighting. You can still override these settings."
      }
    ]
  },

  director: {
    titleZh: "导演与风格",
    titleEn: "Director",
    blocks: [
      {
        titleZh: "directorPack",
        titleEn: "Director pack",
        textZh: "导演包负责整体镜头风格、光照偏向、转场与节奏。选定后可在分镜级微调。高级模板可能写入 directorPack；用户见标签，可改或保持默认。",
        textEn: "Director pack defines overall camera style, lighting bias, transition, and rhythm. After choosing one, you can fine-tune at the scene level. Advanced templates may write directorPack; you see the label and can change or keep it."
      },
      {
        titleZh: "与 classicMode、cameraLanguage 的关系",
        titleEn: "Relation to classicMode and cameraLanguage",
        textZh: "经典模式（classicMode）一键设定镜头+布光+转场。镜头语言（cameraLanguage）负责叙事/风格层。建议先定导演包或经典模式，再补镜头语言，避免冲突。",
        textEn: "Classic mode sets camera, lighting, and transition in one go. Camera language handles narrative/style layer. Prefer setting director pack or classic mode first, then camera language, to avoid conflicts."
      }
    ]
  },

  continuity: {
    titleZh: "连续性",
    titleEn: "Continuity",
    blocks: [
      {
        titleZh: "entryDir / exitDir / inheritFromPrevious",
        titleEn: "entryDir / exitDir / inheritFromPrevious",
        textZh: "多镜时：entryDir、exitDir 描述角色/镜头进出方向。inheritFromPrevious 表示继承上一镜的某些设置。转场类型（cut、dissolve、reverse_angle 等）与 continuity 一起保证衔接。",
        textEn: "For multiple scenes: entryDir and exitDir describe character/camera entry and exit. inheritFromPrevious carries over settings from the previous scene. Transition type (cut, dissolve, reverse_angle, etc.) works with continuity for smooth linking."
      },
      {
        titleZh: "continuityId 锚点",
        titleEn: "continuityId anchor",
        textZh: "对象可绑定 continuityId（如 @continuityId:char_a），用于多镜中同一角色或物体的一致性。带 continuityId 的对象不应随意删除该锚点，否则连续性可能失效。",
        textEn: "Objects can have a continuityId (e.g. @continuityId:char_a) for consistency across shots. Do not remove the anchor from such objects arbitrarily, or continuity may break."
      },
      {
        titleZh: "连续导出",
        titleEn: "Continuity export",
        textZh: "导出中的「Continuity Sequence」会导出当前镜及后续连续镜头，便于在平台侧验证衔接与连续性。",
        textEn: "Export option “Continuity Sequence” exports the current shot and following continuous shots for checking transition and continuity on the platform."
      }
    ]
  },

  export: {
    titleZh: "导出",
    titleEn: "Export",
    blocks: [
      {
        titleZh: "提示词 TXT",
        titleEn: "Prompt TXT",
        textZh: "将当前提示词导出为纯文本，便于复制到模型或生成平台做快速验证。重点验证方向、构图与主体关系。",
        textEn: "Export the current prompt as plain text for pasting into a model or generation platform. Use it to validate direction, composition, and subject relationships."
      },
      {
        titleZh: "Package（交付包）",
        titleEn: "Package",
        textZh: "交付包包含提示词、参考图与说明文件，适合正式交接、存档与稳定复用。",
        textEn: "Package includes prompt, references, and instructions for handoff, archiving, and stable reuse."
      },
      {
        titleZh: "Current Scene / Continuity Sequence",
        titleEn: "Current Scene / Continuity Sequence",
        textZh: "Current Scene：只导出当前分镜。Continuity Sequence：导出当前镜及后续连续镜，用于验证多镜衔接。",
        textEn: "Current Scene: export only the current shot. Continuity Sequence: export current and following continuous shots for multi-shot continuity check."
      },
      {
        titleZh: "Target Model",
        titleEn: "Target model",
        textZh: "目标模型会影响输出文案与结构偏向。不同模型理解方式不同，同一项目在不同模型上结果可能有差异。",
        textEn: "Target model affects wording and structure of the output. Different models interpret prompts differently; the same project may yield different results per model."
      }
    ]
  },

  platform: {
    titleZh: "平台与模型",
    titleEn: "Platform",
    blocks: [
      {
        titleZh: "platformTarget",
        titleEn: "Platform target",
        textZh: "导出时可选择目标平台或模型（platformTarget）。选择后提示词格式与长度会按该平台约定做适配。",
        textEn: "On export you can choose a platform or model (platformTarget). The prompt format and length are then adapted to that platform."
      },
      {
        titleZh: "structureIntensity 与 prompt 格式",
        titleEn: "Structure intensity and prompt format",
        textZh: "结构强度（structureIntensity）影响导出时保留多少结构化描述。某些平台需要更短或更长的 prompt；导出会按预算做裁剪（trimToBudget）。",
        textEn: "Structure intensity controls how much structure is kept in the exported prompt. Some platforms need shorter or longer prompts; export trims to budget (trimToBudget) when needed."
      }
    ]
  },

  faq: {
    titleZh: "常见问题",
    titleEn: "FAQ",
    blocks: [
      {
        titleZh: "为什么生成结果不稳定",
        titleEn: "Why are results unstable",
        textZh: "大模型对同一提示词会有随机性。先固定结构（分镜、对象位置、镜头、布光），再微调描述词；用「先结构后风格」可减少漂移。导出前多看提示词预览。",
        textEn: "Models have inherent randomness. Lock structure (shots, object positions, camera, lighting) first, then tweak wording; “structure first, style second” reduces drift. Check the prompt preview before exporting."
      },
      {
        titleZh: "为什么有冲突提示",
        titleEn: "Why do I see conflicts",
        textZh: "当镜头、布光或对象描述与当前设定冲突时，会提示冲突。例如：已选 pro_plus 时基础 movement 会禁用；L2 由模板带入时不能同时选冲突的 L1。按提示调整或先解决冲突再生成。",
        textEn: "Conflicts appear when camera, lighting, or object description clashes with current settings (e.g. base movement disabled when pro_plus is set; L1 conflict when template set L2). Adjust as suggested or resolve conflicts before generating."
      },
      {
        titleZh: "为什么模板要收费",
        titleEn: "Why are some templates paid",
        textZh: "付费模板带更完整的高级能力（L2 镜头、连续性、导演包等），成本 3 或 5 积分/次。费用从模板元数据读取；同项目同一模板只扣一次。免费模板始终 0 积分。",
        textEn: "Paid templates include advanced capability (L2 camera, continuity, director pack, etc.) and cost 3 or 5 credits per use. Cost is from template metadata; same template in the same project is charged once. Free templates are always 0."
      },
      {
        titleZh: "为什么生成失败",
        titleEn: "Why did generation fail",
        textZh: "当前生成在外部平台执行。失败可能来自：平台限流、提示词过长、格式不兼容、网络问题。请检查导出时的目标模型与长度，并到对应平台查看错误信息。",
        textEn: "Generation runs on an external platform. Failure can be due to rate limits, prompt length, format, or network. Check target model and length on export, and the platform’s error message."
      },
      {
        titleZh: "如何反馈",
        titleEn: "How to give feedback",
        textZh: "使用下方反馈区：可填写问题与复现步骤，或复制模板后通过客服/商务渠道提交。我们会根据反馈改进产品与文档。",
        textEn: "Use the feedback section below: describe the issue and steps, or copy the template and send via support or business channels. We use feedback to improve product and docs."
      }
    ]
  }
};

export function getHelpContent(sectionId: HelpSectionId): HelpSectionContent {
  return CONTENT[sectionId];
}

export function getHelpContentForLang(
  sectionId: HelpSectionId,
  lang: "zh" | "en"
): { title: string; blocks: Array<{ title: string; text: string }> } {
  const s = CONTENT[sectionId];
  return {
    title: lang === "zh" ? s.titleZh : s.titleEn,
    blocks: s.blocks.map((b) => ({
      title: lang === "zh" ? b.titleZh : b.titleEn,
      text: lang === "zh" ? b.textZh : b.textEn
    }))
  };
}
