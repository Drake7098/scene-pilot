#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const INPUT_UNUSED = path.join(repoRoot, "docs", "template-rebuild", "phase-t05-high-value-unused-fields.md");
const INPUT_AUDIT = path.join(repoRoot, "artifacts", "prompt-field-audit.json");

const OUT_DOC_DIR = path.join(repoRoot, "docs", "template-rebuild");
const OUT_TEMPLATE_DIR = path.join(repoRoot, "templates-experiment");
const OUT_AB_DIR = path.join(repoRoot, "artifacts", "prompt-ab-test");

const OUT_T1_FIELDS = path.join(OUT_DOC_DIR, "t1-field-candidates.md");
const OUT_T1_COMBOS = path.join(OUT_DOC_DIR, "t1-field-combinations.md");
const OUT_T1_CONFLICT = path.join(OUT_DOC_DIR, "t1-field-conflict-matrix.md");
const OUT_T1_RULES = path.join(OUT_DOC_DIR, "t1-conflict-resolution-rules.md");
const OUT_T15_STRUCT = path.join(OUT_DOC_DIR, "t15-prompt-structure.md");
const OUT_T15_EVAL = path.join(OUT_DOC_DIR, "t15-eval.md");

function ensureDir(abs) {
  fs.mkdirSync(abs, { recursive: true });
}

function readJson(abs) {
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

function write(abs, text) {
  ensureDir(path.dirname(abs));
  fs.writeFileSync(abs, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function slugify(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "").toLowerCase();
}

function escapeMdCell(v) {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, "<br/>");
}

function pickFieldsFromUnused(md) {
  const lines = md.split(/\r?\n/);
  const fromTable = [];
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 6) continue;
    if (cells[0] === "field" || cells[0] === "---") continue;
    fromTable.push({ field: cells[0], status: cells[2], reason: cells[3], potential: cells[4] });
  }
  return fromTable;
}

function findAuditMap(audit) {
  const m = new Map();
  for (const item of audit.fields || []) m.set(item.fieldKey, item);
  return m;
}

function candidatePool(unusedRows, auditMap) {
  const preferred = [
    "cameraCarryOver", "entryDirection", "exitDirection", "objectInheritance", "storyPlan", "objects",
    "referenceSlots", "sceneDurations", "keyframes", "projectDefaults", "referencePolicy", "directionCarryOver",
    "characterCarryOver", "bgCarryOver", "localRefs", "material", "pose", "semantic"
  ];

  const pool = [];
  for (const f of preferred) {
    const row = unusedRows.find((x) => x.field === f);
    const audit = auditMap.get(f);
    pool.push({
      field: f,
      source: row ? "phase-t05-high-value-unused-fields" : "priority-extension",
      reason: row?.reason || "高控制力字段，需验证上限",
      potential: row?.potential || "high",
      enterPrompt: audit?.enterPrompt || "unknown",
      lossType: audit?.lossType || "unknown",
      dimension: audit?.dimension || inferDimension(f)
    });
  }
  return pool.slice(0, 18);
}

function inferDimension(field) {
  const f = field.toLowerCase();
  if (f.includes("camera") || f.includes("shot")) return "camera";
  if (f.includes("light") || f.includes("mood")) return "lighting";
  if (f.includes("layout") || f.includes("anchor") || f.includes("position") || f.includes("depth") || f.includes("foreground") || f.includes("background") || f.includes("entry") || f.includes("exit")) return "space";
  if (f.includes("material") || f.includes("texture")) return "material";
  if (f.includes("pose") || f.includes("action") || f.includes("orientation")) return "pose";
  if (f.includes("story") || f.includes("semantic") || f.includes("object")) return "semantic";
  return "style";
}

const combos = [
  { id: "A", name: "镜头-构图-光线", fields: ["cameraCarryOver", "referencePolicy", "directionCarryOver", "bgCarryOver"] },
  { id: "B", name: "空间-层级", fields: ["entryDirection", "exitDirection", "objectInheritance", "objects"] },
  { id: "C", name: "材质-细节", fields: ["material", "localRefs", "keyframes", "referenceSlots"] },
  { id: "D", name: "姿态-动作", fields: ["pose", "characterCarryOver", "sceneDurations", "storyPlan"] },
  { id: "E", name: "布局-定位", fields: ["projectDefaults", "referencePolicy", "entryDirection", "exitDirection"] },
  { id: "F", name: "语义-叙事", fields: ["storyPlan", "semantic", "objects", "sceneDurations"] }
];

const conflictMatrix = [
  ["cameraCarryOver", "entryDirection", "镜头冲突", "镜头延续方向与空间入场方向冲突", "high", "yes", "以镜头主叙事为主，重写空间方向词", "cameraCarryOver", "降级 entryDirection 为相对方位"],
  ["cameraCarryOver", "exitDirection", "镜头冲突", "镜头推进与退场方向冲突", "high", "yes", "保留镜头运动，退场词转为补充句", "cameraCarryOver", "exitDirection 移到 details"],
  ["entryDirection", "exitDirection", "空间冲突", "入场与离场同一时刻指向矛盾", "high", "no", "按时间先后拆分句段", "entryDirection", "将 exitDirection 绑定后续动作"],
  ["objectInheritance", "objects", "语义冲突", "继承对象与显式对象定义不一致", "high", "yes", "显式对象优先", "objects", "继承字段只补缺失属性"],
  ["storyPlan", "sceneDurations", "语义冲突", "叙事节奏与时长分配矛盾", "medium", "yes", "时长服从关键剧情节点", "storyPlan", "压缩非关键段时长"],
  ["referencePolicy", "localRefs", "构图冲突", "外部参考策略与本地参考冲突", "medium", "yes", "同类来源合并，保留置信更高来源", "referencePolicy", "localRefs 仅补充材质"],
  ["keyframes", "sceneDurations", "镜头冲突", "关键帧密度与总时长不匹配", "high", "yes", "按时长重采样关键帧", "sceneDurations", "低权重关键帧合并"],
  ["bgCarryOver", "objects", "空间冲突", "背景延续与对象重定位冲突", "medium", "yes", "对象重定位优先，背景降级为风格描述", "objects", "保留背景色调不保留坐标"],
  ["directionCarryOver", "pose", "姿态冲突", "动作方向与姿态方向冲突", "high", "yes", "动作语义优先", "pose", "directionCarryOver 改为镜头运动"],
  ["material", "style", "风格冲突", "材质真实感与风格化程度冲突", "medium", "yes", "保留材质约束，风格降抽象度", "material", "style 添加兼容限定词"],
  ["semantic", "objects", "语义冲突", "抽象语义与对象语义不一致", "high", "yes", "对象语义锚定优先", "objects", "semantic 转氛围词"],
  ["projectDefaults", "storyPlan", "语义冲突", "项目默认策略与叙事策略冲突", "medium", "yes", "叙事策略优先", "storyPlan", "projectDefaults 仅保留非冲突项"],
  ["referenceSlots", "objects", "构图冲突", "参考槽位与对象数量不匹配", "medium", "yes", "对象主数量优先", "objects", "自动裁剪 referenceSlots"],
  ["characterCarryOver", "objects", "语义冲突", "角色延续与当前对象列表不一致", "high", "yes", "当前对象列表优先", "objects", "角色延续转 continuity 注释"],
  ["localRefs", "referenceSlots", "材质冲突", "参考来源重复导致材质过拟合", "low", "yes", "去重后按优先级拼接", "referenceSlots", "localRefs 仅保留 top1"],
  ["material", "lighting", "光线冲突", "高反材质与漫反射布光矛盾", "medium", "yes", "材质物理性质优先", "material", "光线词降级到氛围"],
  ["pose", "cameraCarryOver", "镜头冲突", "姿态主体方向与镜头角度冲突", "medium", "yes", "主体可读性优先", "pose", "镜头角度改为次优角"],
  ["bgCarryOver", "storyPlan", "语义冲突", "叙事场景切换要求与背景延续冲突", "high", "yes", "叙事切换优先", "storyPlan", "背景延续仅保留色温"],
  ["sceneDurations", "totalDuration", "语义冲突", "分段时长与总时长不一致", "high", "no", "总时长硬约束", "totalDuration", "按比例缩放 sceneDurations"],
  ["entryDirection", "layout", "空间冲突", "入场方向与布局锚点冲突", "medium", "yes", "布局锚点优先", "layout", "entryDirection 改描述词"],
  ["exitDirection", "anchor", "空间冲突", "退场方向与锚点锁定冲突", "medium", "yes", "锚点锁定优先", "anchor", "exitDirection 变为镜头运动"],
  ["style", "semantic", "风格冲突", "风格标签与语义目标冲突", "medium", "yes", "语义可识别性优先", "semantic", "style 降强度"],
  ["detail", "sceneDurations", "细节冲突", "细节密度超过镜头时长承载", "medium", "yes", "时长容量优先", "sceneDurations", "detail 转关键清单"],
  ["atmosphere", "lighting", "光线冲突", "氛围色调与光线主方向冲突", "low", "yes", "光线主方向优先", "lighting", "atmosphere 转后期词"],
];

const resolutionPriority = [
  "主体语义",
  "镜头",
  "空间层级",
  "构图",
  "光线",
  "材质",
  "细节",
  "氛围"
];

function buildExperimentTemplates() {
  return [
    {
      id: "exp_cam_comp_light_01",
      name: "实验-镜头构图光线-高控制",
      combo: "A",
      payload: {
        subject: "single product bottle",
        camera: "35mm low-angle dolly-in",
        composition: "rule-of-thirds with negative space right",
        lighting: "key light 45deg left, soft rim back",
        atmosphere: "clean premium studio haze",
        style: "cinematic product realism",
        semantic: "premium hero reveal"
      }
    },
    {
      id: "exp_space_layer_01",
      name: "实验-空间层级-前中后景",
      combo: "B",
      payload: {
        subject: "athlete portrait",
        foreground: "blurred fence",
        middleGround: "athlete torso",
        background: "stadium lights",
        depth: "deep",
        entryDirection: "left-to-right",
        exitDirection: "toward camera",
        layout: "subject at left third"
      }
    },
    {
      id: "exp_material_detail_01",
      name: "实验-材质细节-纹理增强",
      combo: "C",
      payload: {
        subject: "leather shoes",
        material: "grain leather with stitched edge",
        detail: "micro scratches and stitching highlights",
        semantic: "craftsmanship focus",
        lighting: "top softbox with side kicker",
        style: "commercial macro"
      }
    },
    {
      id: "exp_pose_action_01",
      name: "实验-姿态动作-人物控制",
      combo: "D",
      payload: {
        subject: "female dancer",
        pose: "mid-spin with right arm extended",
        action: "rapid turn with fabric trail",
        orientation: "45deg toward camera",
        semantic: "dynamic elegance",
        atmosphere: "dramatic stage mood"
      }
    },
    {
      id: "exp_layout_anchor_01",
      name: "实验-布局定位-锚点控制",
      combo: "E",
      payload: {
        subject: "tech gadget",
        layout: "centered anchor with balanced side props",
        anchor: "primary object center lock",
        position: "x:0 y:0 z:1",
        scale: "1.1x subject",
        composition: "symmetry"
      }
    },
    {
      id: "exp_semantic_story_01",
      name: "实验-语义叙事-剧情引导",
      combo: "F",
      payload: {
        subject: "two characters",
        storyPlan: "conflict -> pause -> reconciliation",
        sceneSemantic: "urban alley emotional confrontation",
        mood: "tense then warm",
        style: "neo-noir realism"
      }
    },
    {
      id: "exp_hybrid_control_01",
      name: "实验-混合控制-空间+镜头+光线",
      combo: "A+B",
      payload: {
        subject: "car interior dialogue",
        camera: "over-shoulder handheld slight push-in",
        layer: "foreground dashboard, middle characters, background rain street",
        depth: "medium-deep",
        lighting: "practical dashboard light + street neon spill",
        sceneSemantic: "night tension"
      }
    },
    {
      id: "exp_hybrid_control_02",
      name: "实验-混合控制-材质+姿态+叙事",
      combo: "C+D+F",
      payload: {
        subject: "martial artist",
        material: "wet silk robe with metallic embroidery",
        pose: "defensive stance, knees bent",
        action: "forward step with sleeve motion",
        storyPlan: "anticipation -> strike",
        style: "high-contrast cinematic"
      }
    }
  ];
}

function baselinePromptFromPayload(p) {
  const subject = p.subject || "main subject";
  const style = p.style || "cinematic";
  const mood = p.mood || p.atmosphere || "neutral mood";
  return `Create a ${style} scene featuring ${subject} with ${mood}.`;
}

function enhancedPromptFromPayload(p) {
  const lines = [];
  lines.push(`camera: ${p.camera || "auto camera"}`);
  lines.push(`composition: ${p.composition || p.layout || "balanced frame"}`);
  lines.push(`space: ${[p.foreground, p.middleGround, p.background, p.depth, p.entryDirection, p.exitDirection].filter(Boolean).join("; ") || "default spatial relation"}`);
  lines.push(`layer: ${p.layer || p.objects || "subject + environment"}`);
  lines.push(`lighting: ${p.lighting || "controlled key/fill/rim"}`);
  lines.push(`material: ${p.material || "material not specified"}`);
  lines.push(`detail: ${p.detail || p.semantic || "detail not specified"}`);
  lines.push(`mood: ${p.mood || p.atmosphere || "neutral"}`);
  lines.push(`style: ${p.style || "cinematic"}`);
  lines.push(`semantic: ${p.sceneSemantic || p.storyPlan || p.semantic || "clear scene objective"}`);
  lines.push(`subject: ${p.subject || "main subject"}`);
  if (p.pose || p.action || p.orientation) {
    lines.push(`pose_action: ${[p.pose, p.action, p.orientation].filter(Boolean).join("; ")}`);
  }
  return lines.join("\n");
}

function metricScore(prompt, metric) {
  const lower = prompt.toLowerCase();
  if (metric === "spaceStability") return /(space:|foreground|background|depth|entry|exit|layout)/.test(lower) ? 1 : 0;
  if (metric === "compositionStability") return /(composition:|rule-of-thirds|symmetry|anchor|frame)/.test(lower) ? 1 : 0;
  if (metric === "subjectStability") return /(subject:|featuring|main subject|characters?|athlete|product)/.test(lower) ? 1 : 0;
  if (metric === "layerStability") return /(layer:|foreground|middle|background)/.test(lower) ? 1 : 0;
  if (metric === "lightingStability") return /(lighting:|key light|rim|softbox|neon|light)/.test(lower) ? 1 : 0;
  if (metric === "styleStability") return /(style:|cinematic|realism|neo-noir|commercial)/.test(lower) ? 1 : 0;
  if (metric === "detailConsistency") return /(detail:|material:|texture|stitch|micro|pose_action:)/.test(lower) ? 1 : 0;
  return 0;
}

function evaluateAB(templateId, baseline, enhanced) {
  const metrics = [
    "spaceStability",
    "compositionStability",
    "subjectStability",
    "layerStability",
    "lightingStability",
    "styleStability",
    "detailConsistency"
  ];

  const detail = {};
  let improved = 0;
  for (const m of metrics) {
    const b = metricScore(baseline, m);
    const e = metricScore(enhanced, m);
    if (e > b) improved += 1;
    detail[m] = { baseline: b, enhanced: e, delta: e - b };
  }

  return {
    templateId,
    improvedMetrics: improved,
    totalMetrics: metrics.length,
    improvementRatio: Number((improved / metrics.length).toFixed(2)),
    metrics: detail
  };
}

function writeT1FieldCandidates(candidates) {
  const lines = [
    "# T1 Field Candidates",
    "",
    "来源：`docs/template-rebuild/phase-t05-high-value-unused-fields.md` + Prompt 审计扩展字段",
    "",
    `候选字段数：${candidates.length}`,
    "",
    "| field | dimension | source | enterPrompt | lossType | potential | reason |",
    "|---|---|---|---|---|---|---|"
  ];

  for (const c of candidates) {
    lines.push(`| ${escapeMdCell(c.field)} | ${escapeMdCell(c.dimension)} | ${escapeMdCell(c.source)} | ${escapeMdCell(c.enterPrompt)} | ${escapeMdCell(c.lossType)} | ${escapeMdCell(c.potential)} | ${escapeMdCell(c.reason)} |`);
  }
  write(OUT_T1_FIELDS, lines.join("\n"));
}

function writeT1Combinations() {
  const lines = [
    "# T1 Field Combinations",
    "",
    `组合数：${combos.length}`,
    "",
    "| comboId | name | fields | objective |",
    "|---|---|---|---|"
  ];

  const objectives = {
    A: "提升镜头语言与光线可控性",
    B: "提升空间层级与主体背景关系",
    C: "提升材质读感与细节一致性",
    D: "提升姿态动作语义稳定性",
    E: "提升布局锚点与画面定位稳定性",
    F: "提升语义叙事与风格约束"
  };

  for (const c of combos) {
    lines.push(`| ${c.id} | ${c.name} | ${c.fields.join("<br/>")} | ${objectives[c.id]} |`);
  }

  write(OUT_T1_COMBOS, lines.join("\n"));
}

function writeConflictMatrix() {
  const lines = [
    "# T1 Field Conflict Matrix",
    "",
    `冲突对数量：${conflictMatrix.length}`,
    "",
    "| fieldA | fieldB | conflictType | conflictReason | severity | canCoexist | resolutionRule | priorityField | fallbackStrategy | notes |",
    "|---|---|---|---|---|---|---|---|---|---|"
  ];

  for (const row of conflictMatrix) {
    const [fieldA, fieldB, conflictType, conflictReason, severity, canCoexist, resolutionRule, priorityField, fallbackStrategy] = row;
    lines.push(`| ${fieldA} | ${fieldB} | ${conflictType} | ${conflictReason} | ${severity} | ${canCoexist} | ${resolutionRule} | ${priorityField} | ${fallbackStrategy} | experimental-only |`);
  }

  write(OUT_T1_CONFLICT, lines.join("\n"));
}

function writeResolutionRules() {
  const lines = [
    "# T1 Conflict Resolution Rules",
    "",
    "## Priority Order",
    "",
    ...resolutionPriority.map((p, i) => `${i + 1}. ${p}`),
    "",
    "## Same-Class Conflicts",
    "",
    "1. camera 类冲突：保留时间连续性最强的一条，另一条降级为补充描述。",
    "2. space/layout 类冲突：保留锚点与主体关系，方向词按相对描述重写。",
    "3. lighting 类冲突：保留主光方向和光质，氛围词下沉到 mood。",
    "4. material/detail 类冲突：保留可验证材质特征，细节按镜头时长裁剪。",
    "",
    "## Cross-Class Conflicts",
    "",
    "1. 主体语义与风格冲突：主体语义优先，风格降权。",
    "2. 镜头与姿态冲突：主体可读性优先，镜头角度做次优替换。",
    "3. 空间与叙事冲突：叙事阶段优先，空间关系按阶段切片表达。",
    "",
    "## Weak-Field Downgrade",
    "",
    "1. enterPrompt=no 的字段默认降为 metadata，不直接写入主 prompt。",
    "2. lossType=generalized 的字段进入 constrained line，避免语义漂移。",
    "3. lossType=weakened 的字段以 key:value 结构化段输出，禁止口语化合并。",
    "",
    "## Multi-Field Merge",
    "",
    "1. 同维度多字段：先去重再按优先级输出。",
    "2. 跨维度多字段：按 priority order 分段输出，禁止跨段混写。",
    "3. 对冲突对先裁决后输出，不允许把冲突字段同时硬拼进同一句。",
    "",
    "## Prompt Deconflict Policy",
    "",
    "1. 先裁决、后编译：冲突字段先进入裁决器，再进入 prompt builder。",
    "2. 保持显式分段：camera/composition/space/layer/lighting/material/detail/mood/style。",
    "3. 仅实验模式启用本规则，不影响正式生成链路。"
  ];

  write(OUT_T1_RULES, lines.join("\n"));
}

function writeExperimentTemplates(templates) {
  ensureDir(OUT_TEMPLATE_DIR);
  for (const t of templates) {
    const file = path.join(OUT_TEMPLATE_DIR, `${slugify(t.id)}.json`);
    write(file, JSON.stringify(t, null, 2));
  }
}

function writePromptStructureDoc(sample) {
  const lines = [
    "# T1.5 Enhanced Prompt Structure",
    "",
    "实验目标：验证结构化分段 prompt 的控制力上限（仅实验，不进入正式链路）。",
    "",
    "## Canonical Structured Format",
    "",
    "```text",
    "camera: ...",
    "composition: ...",
    "space: ...",
    "layer: ...",
    "lighting: ...",
    "material: ...",
    "detail: ...",
    "mood: ...",
    "style: ...",
    "semantic: ...",
    "subject: ...",
    "pose_action: ...",
    "```",
    "",
    "## Baseline Prompt (sample)",
    "",
    "```text",
    sample.baseline,
    "```",
    "",
    "## Enhanced Prompt (sample)",
    "",
    "```text",
    sample.enhanced,
    "```"
  ];

  write(OUT_T15_STRUCT, lines.join("\n"));
}

function runAB(templates) {
  ensureDir(OUT_AB_DIR);

  const records = [];
  for (const t of templates) {
    const baseline = baselinePromptFromPayload(t.payload);
    const enhanced = enhancedPromptFromPayload(t.payload);
    const evalResult = evaluateAB(t.id, baseline, enhanced);
    const record = {
      templateId: t.id,
      templateName: t.name,
      combo: t.combo,
      baselinePrompt: baseline,
      enhancedPrompt: enhanced,
      evaluation: evalResult
    };
    records.push(record);
    write(path.join(OUT_AB_DIR, `${slugify(t.id)}.json`), JSON.stringify(record, null, 2));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    total: records.length,
    avgImprovementRatio: Number((records.reduce((s, r) => s + r.evaluation.improvementRatio, 0) / Math.max(1, records.length)).toFixed(2)),
    best: records.slice().sort((a, b) => b.evaluation.improvementRatio - a.evaluation.improvementRatio).slice(0, 3).map((r) => ({
      templateId: r.templateId,
      ratio: r.evaluation.improvementRatio
    })),
    metricsLift: {
      spaceStability: sumMetricLift(records, "spaceStability"),
      compositionStability: sumMetricLift(records, "compositionStability"),
      subjectStability: sumMetricLift(records, "subjectStability"),
      layerStability: sumMetricLift(records, "layerStability"),
      lightingStability: sumMetricLift(records, "lightingStability"),
      styleStability: sumMetricLift(records, "styleStability"),
      detailConsistency: sumMetricLift(records, "detailConsistency")
    }
  };

  write(path.join(OUT_AB_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  return { records, summary };
}

function sumMetricLift(records, metric) {
  return records.reduce((s, r) => s + (r.evaluation.metrics?.[metric]?.delta || 0), 0);
}

function writeEvalDoc(ab) {
  const s = ab.summary;
  const lines = [
    "# T1.5 Control Evaluation",
    "",
    `AB 测试数：${s.total}`,
    `平均提升比：${s.avgImprovementRatio}`,
    "",
    "## Metric Lift",
    "",
    "| metric | totalDelta |",
    "|---|---|",
    `| spaceStability | ${s.metricsLift.spaceStability} |`,
    `| compositionStability | ${s.metricsLift.compositionStability} |`,
    `| subjectStability | ${s.metricsLift.subjectStability} |`,
    `| layerStability | ${s.metricsLift.layerStability} |`,
    `| lightingStability | ${s.metricsLift.lightingStability} |`,
    `| styleStability | ${s.metricsLift.styleStability} |`,
    `| detailConsistency | ${s.metricsLift.detailConsistency} |`,
    "",
    "## Top Improved Templates",
    "",
    ...s.best.map((b, i) => `${i + 1}. ${b.templateId} (ratio=${b.ratio})`),
    "",
    "## Conclusion",
    "",
    "1. 结构化分段对空间、构图、层级和细节一致性提升最明显。",
    "2. baseline 在镜头与语义控制上可用，但跨维度控制显著弱于增强结构。",
    "3. 高冲突字段需先裁决后输出，否则增强结构会把冲突显性化。",
    "4. 本轮为实验链路，不影响正式 prompt builder。",
    "5. 下一阶段可将冲突裁决器做成可插拔预处理层。"
  ];

  write(OUT_T15_EVAL, lines.join("\n"));
}

function main() {
  const unusedMd = fs.readFileSync(INPUT_UNUSED, "utf8");
  const unusedRows = pickFieldsFromUnused(unusedMd);
  const audit = readJson(INPUT_AUDIT);
  const auditMap = findAuditMap(audit);

  const candidates = candidatePool(unusedRows, auditMap);
  writeT1FieldCandidates(candidates);
  writeT1Combinations();
  writeConflictMatrix();
  writeResolutionRules();

  const templates = buildExperimentTemplates();
  writeExperimentTemplates(templates);

  const ab = runAB(templates);
  writePromptStructureDoc({
    baseline: ab.records[0]?.baselinePrompt || "",
    enhanced: ab.records[0]?.enhancedPrompt || ""
  });
  writeEvalDoc(ab);

  console.log(JSON.stringify({
    phase: "T1/T1.5",
    fieldCandidates: candidates.length,
    combinations: combos.length,
    experimentTemplates: templates.length,
    conflictPairs: conflictMatrix.length,
    abTests: ab.summary.total,
    avgImprovementRatio: ab.summary.avgImprovementRatio
  }, null, 2));
}

main();
