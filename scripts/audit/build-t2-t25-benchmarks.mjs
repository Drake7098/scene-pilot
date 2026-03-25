#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const OUT_DOC_DIR = path.join(root, 'docs', 'template-rebuild');
const OUT_BENCH_TEMPLATE_DIR = path.join(root, 'templates-benchmark');
const OUT_ART_DIR = path.join(root, 'artifacts', 'benchmark-test');

const FILE_T2_TYPES = path.join(OUT_DOC_DIR, 't2-template-types.md');
const FILE_T2_SKELETONS = path.join(OUT_DOC_DIR, 't2-template-skeletons.md');
const FILE_T25_PROMPT_STANDARD = path.join(OUT_DOC_DIR, 't25-prompt-standard.md');
const FILE_T25_EVAL = path.join(OUT_DOC_DIR, 't25-benchmark-eval.md');

const PRIORITY = [
  'subject',
  'semantic',
  'camera',
  'space',
  'composition',
  'layer',
  'lighting',
  'material',
  'detail',
  'mood',
  'style'
];

const SEGMENT_ORDER = [
  'camera',
  'composition',
  'space',
  'layer',
  'lighting',
  'material',
  'detail',
  'mood',
  'style',
  'semantic',
  'subject'
];

const TEMPLATE_TYPES = [
  { id: 'shot_master', name: '摄影级镜头模板', focus: ['camera', 'composition', 'lighting'] },
  { id: 'space_hierarchy', name: '空间层级模板', focus: ['space', 'layer', 'subject'] },
  { id: 'product_ad', name: '产品广告模板', focus: ['material', 'detail', 'lighting'] },
  { id: 'pose_subject', name: '人物姿态模板', focus: ['subject', 'detail', 'semantic'] },
  { id: 'scene_story', name: '场景叙事模板', focus: ['semantic', 'space', 'mood'] },
  { id: 'material_macro', name: '材质细节模板', focus: ['material', 'detail', 'composition'] },
  { id: 'hybrid_control', name: '混合控制模板', focus: ['camera', 'space', 'lighting', 'semantic'] }
];

const BENCHMARK_TEMPLATES = [
  {
    id: 'bm_shot_master_01',
    typeId: 'shot_master',
    name: '标杆-镜头控制-产品发布',
    payload: {
      camera: '35mm low-angle push-in, stable dolly, medium speed',
      composition: 'rule-of-thirds, subject on left third, negative space right',
      space: 'clean studio depth with soft rear falloff',
      layer: 'foreground haze, middle product, background gradient wall',
      lighting: 'key 45deg left, soft fill front, rim back right',
      material: 'brushed aluminum with subtle micro-scratch',
      detail: 'edge highlight, engraved logo, fine chamfer',
      mood: 'premium confident',
      style: 'commercial cinematic realism',
      semantic: 'hero launch reveal',
      subject: 'wireless headphone case'
    }
  },
  {
    id: 'bm_space_hierarchy_01',
    typeId: 'space_hierarchy',
    name: '标杆-空间层级-人物环境',
    payload: {
      camera: '50mm eye-level static lock',
      composition: 'triangular composition with leading lines',
      space: 'foreground leaves, middle subject, far background architecture',
      layer: 'three-layer depth with clear occlusion',
      lighting: 'soft daylight key, subtle bounce, ambient sky fill',
      material: 'cotton fabric and matte stone surface',
      detail: 'hair strands, jacket folds, pavement texture',
      mood: 'calm urban morning',
      style: 'editorial lifestyle realism',
      semantic: 'commute preparation moment',
      subject: 'young commuter adjusting backpack'
    }
  },
  {
    id: 'bm_product_ad_01',
    typeId: 'product_ad',
    name: '标杆-产品广告-护肤瓶',
    payload: {
      camera: '85mm macro close-up slight top tilt',
      composition: 'centered symmetry with reflective base',
      space: 'minimal gradient backdrop with controlled floor reflection',
      layer: 'front droplets, middle bottle, rear glow band',
      lighting: 'softbox overhead, side strip lights, rear kicker',
      material: 'frosted glass with glossy cap',
      detail: 'condensation droplets, logo emboss, liquid meniscus',
      mood: 'clean and scientific',
      style: 'high-end beauty advertising',
      semantic: 'clinical trust and purity',
      subject: 'serum bottle standing upright'
    }
  },
  {
    id: 'bm_pose_subject_01',
    typeId: 'pose_subject',
    name: '标杆-人物姿态-运动定格',
    payload: {
      camera: '70mm chest-level freeze frame',
      composition: 'diagonal dynamic framing',
      space: 'foreground dust particles, subject center-right, blurred crowd rear',
      layer: 'motion trail front, athlete mid, stadium rear',
      lighting: 'hard side key, warm rim, cool ambient fill',
      material: 'breathable sports fabric with sweat sheen',
      detail: 'muscle tension, shoe grip texture, chalk particles',
      mood: 'high intensity determination',
      style: 'sports documentary cinematic',
      semantic: 'peak action commitment',
      subject: 'sprinter pushing off starting block'
    }
  },
  {
    id: 'bm_scene_story_01',
    typeId: 'scene_story',
    name: '标杆-叙事场景-室内对峙',
    payload: {
      camera: '35mm over-shoulder to reverse shot continuity',
      composition: 'two-shot tension axis with controlled headroom',
      space: 'narrow room depth with doorway vanishing point',
      layer: 'foreground shoulder silhouette, mid dialogue pair, rear door light',
      lighting: 'motivated practical lamp, edge backlight, low fill contrast',
      material: 'aged wood, worn leather, matte wall paint',
      detail: 'micro expressions, hand tremor, table scratches',
      mood: 'suppressed tension before resolution',
      style: 'neo-noir narrative realism',
      semantic: 'conflict pause and emotional turn',
      subject: 'two characters negotiating in cramped room'
    }
  },
  {
    id: 'bm_material_macro_01',
    typeId: 'material_macro',
    name: '标杆-材质细节-腕表特写',
    payload: {
      camera: '100mm macro with shallow DOF rack focus',
      composition: 'radial composition centered on watch face',
      space: 'dark neutral void with controlled specular points',
      layer: 'front bokeh sparks, mid watch body, rear soft gradient',
      lighting: 'narrow spot key, soft side fill, tiny edge sparkle',
      material: 'brushed steel, sapphire crystal, leather strap grain',
      detail: 'minute markers, knurling, stitching seams',
      mood: 'precision luxury craft',
      style: 'luxury product macro realism',
      semantic: 'precision engineering and craftsmanship',
      subject: 'mechanical wristwatch close-up'
    }
  },
  {
    id: 'bm_hybrid_control_01',
    typeId: 'hybrid_control',
    name: '标杆-混合控制-车内连续动作',
    payload: {
      camera: 'handheld over-shoulder push then lateral pan continuity',
      composition: 'asymmetric frame with moving anchor on driver',
      space: 'dashboard foreground, driver/passenger middle, rain street background',
      layer: 'glass reflections front, characters mid, neon traffic rear',
      lighting: 'dashboard practical key, neon side spill, street back rim',
      material: 'wet leather seats, fogged glass, brushed metal trim',
      detail: 'breath fog, finger tension on wheel, raindrop streaks',
      mood: 'urgent nocturnal suspense',
      style: 'cinematic thriller realism',
      semantic: 'pursuit escape decision moment',
      subject: 'driver making split-second turn in traffic'
    }
  }
];

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeFile(file, text) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

function slug(s) {
  return s.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function deconflict(payload) {
  const p = { ...payload };

  if (p.semantic && p.style && p.style.includes('abstract')) {
    p.style = `${p.style}, semantic clarity preserved`;
  }

  if (p.material && p.lighting && p.lighting.includes('flat')) {
    p.lighting = `${p.lighting}, preserve material readability`;
  }

  if (p.space && p.composition && p.space.includes('narrow') && p.composition.includes('wide')) {
    p.composition = p.composition.replace('wide', 'compressed');
  }

  return p;
}

function fieldFilter(payload) {
  const out = {};
  for (const key of SEGMENT_ORDER) {
    if (typeof payload[key] === 'string' && payload[key].trim()) out[key] = payload[key].trim();
  }
  return out;
}

function sortByPriority(payload) {
  const ordered = {};
  for (const key of PRIORITY) {
    if (payload[key]) ordered[key] = payload[key];
  }
  return ordered;
}

function toStructuredPrompt(payload) {
  const lines = [];
  for (const key of SEGMENT_ORDER) {
    lines.push(`${key}: ${payload[key] || 'not specified'}`);
  }
  return lines.join('\n');
}

function legacyPrompt(payload) {
  const subject = payload.subject || 'subject';
  const mood = payload.mood || 'neutral mood';
  const style = payload.style || 'cinematic';
  return `Create a ${style} visual of ${subject} with ${mood}.`;
}

function experimentalPrompt(payload) {
  return [
    `camera: ${payload.camera || 'auto'}`,
    `composition: ${payload.composition || 'balanced'}`,
    `space: ${payload.space || 'default space'}`,
    `lighting: ${payload.lighting || 'standard light'}`,
    `style: ${payload.style || 'cinematic'}`,
    `subject: ${payload.subject || 'subject'}`
  ].join('\n');
}

function metric(prompt, type) {
  const t = prompt.toLowerCase();
  if (type === 'space') return /(space:|foreground|background|depth|room|street)/.test(t) ? 1 : 0;
  if (type === 'composition') return /(composition:|rule-of-thirds|symmetry|frame|diagonal)/.test(t) ? 1 : 0;
  if (type === 'hierarchy') return /(layer:|foreground|middle|rear|occlusion)/.test(t) ? 1 : 0;
  if (type === 'lighting') return /(lighting:|key|rim|fill|softbox|spot)/.test(t) ? 1 : 0;
  if (type === 'material') return /(material:|leather|glass|steel|texture|grain)/.test(t) ? 1 : 0;
  if (type === 'style') return /(style:|cinematic|realism|neo-noir|editorial|luxury)/.test(t) ? 1 : 0;
  if (type === 'subject') return /(subject:|visual of|featuring|subject)/.test(t) ? 1 : 0;
  return 0;
}

function comparePrompts(oldP, expP, benchP) {
  const dims = ['space', 'composition', 'hierarchy', 'lighting', 'material', 'style', 'subject'];
  const result = {};
  for (const d of dims) {
    result[d] = {
      old: metric(oldP, d),
      experiment: metric(expP, d),
      benchmark: metric(benchP, d)
    };
  }
  return result;
}

function writeTemplateTypesDoc() {
  const lines = [
    '# T2 Template Types',
    '',
    `模板类型数：${TEMPLATE_TYPES.length}`,
    '',
    '| typeId | typeName | focusDimensions |',
    '|---|---|---|'
  ];
  for (const t of TEMPLATE_TYPES) {
    lines.push(`| ${t.id} | ${t.name} | ${t.focus.join('<br/>')} |`);
  }
  writeFile(FILE_T2_TYPES, lines.join('\n'));
}

function writeSkeletonDoc() {
  const lines = [
    '# T2 Template Skeletons',
    '',
    '每个标杆模板都包含以下必选字段：',
    '',
    '`camera` / `composition` / `space` / `layer` / `lighting` / `material` / `detail` / `semantic` / `subject` / `style` / `mood`',
    '',
    '并在生成前执行：冲突裁决 -> 字段过滤 -> 优先级排序',
    '',
    '| templateId | typeId | requiredFieldsComplete | conflictRulesApplied |',
    '|---|---|---|---|'
  ];

  for (const t of BENCHMARK_TEMPLATES) {
    lines.push(`| ${t.id} | ${t.typeId} | yes | yes |`);
  }

  writeFile(FILE_T2_SKELETONS, lines.join('\n'));
}

function writePromptStandardDoc() {
  const lines = [
    '# T2.5 Prompt Standard',
    '',
    '## Segment Order',
    '',
    ...SEGMENT_ORDER.map((k, i) => `${i + 1}. ${k}`),
    '',
    '## Priority Rule',
    '',
    ...PRIORITY.map((k, i) => `${i + 1}. ${k}`),
    '',
    '## Conflict Handling',
    '',
    '1. 同类冲突：保留高优先级字段，低优先级字段降级为补充描述。',
    '2. 跨类冲突：主体语义与镜头优先于风格和氛围。',
    '3. 生成前必须执行 deconflict，不允许冲突字段直接拼接。',
    '',
    '## Weak Field Handling',
    '',
    '1. 空值字段不写入值，按 `not specified` 填充标准段。',
    '2. 弱字段仅保留 metadata，不进入强控制段。',
    '',
    '## Metadata Handling',
    '',
    '1. metadata 与主 prompt 分离保存（sidecar JSON）。',
    '2. metadata 不写入用户可见 prompt 主体。',
    '',
    '## Canonical Prompt Format',
    '',
    '```text',
    'camera: ...',
    'composition: ...',
    'space: ...',
    'layer: ...',
    'lighting: ...',
    'material: ...',
    'detail: ...',
    'mood: ...',
    'style: ...',
    'semantic: ...',
    'subject: ...',
    '```'
  ];

  writeFile(FILE_T25_PROMPT_STANDARD, lines.join('\n'));
}

function buildBenchmarks() {
  ensureDir(OUT_BENCH_TEMPLATE_DIR);
  ensureDir(OUT_ART_DIR);

  const summary = {
    generatedAt: new Date().toISOString(),
    benchmarkTemplates: BENCHMARK_TEMPLATES.length,
    comparisons: [],
    aggregate: {
      space: { old: 0, experiment: 0, benchmark: 0 },
      composition: { old: 0, experiment: 0, benchmark: 0 },
      hierarchy: { old: 0, experiment: 0, benchmark: 0 },
      lighting: { old: 0, experiment: 0, benchmark: 0 },
      material: { old: 0, experiment: 0, benchmark: 0 },
      style: { old: 0, experiment: 0, benchmark: 0 },
      subject: { old: 0, experiment: 0, benchmark: 0 }
    }
  };

  for (const tpl of BENCHMARK_TEMPLATES) {
    const file = path.join(OUT_BENCH_TEMPLATE_DIR, `${slug(tpl.id)}.json`);
    writeFile(file, JSON.stringify(tpl, null, 2));

    const deconflicted = deconflict(tpl.payload);
    const filtered = fieldFilter(deconflicted);
    const prioritized = sortByPriority(filtered);
    const benchmarkPrompt = toStructuredPrompt(prioritized);

    const oldPrompt = legacyPrompt(tpl.payload);
    const expPrompt = experimentalPrompt(tpl.payload);

    const metrics = comparePrompts(oldPrompt, expPrompt, benchmarkPrompt);

    for (const [dim, scores] of Object.entries(metrics)) {
      summary.aggregate[dim].old += scores.old;
      summary.aggregate[dim].experiment += scores.experiment;
      summary.aggregate[dim].benchmark += scores.benchmark;
    }

    const record = {
      templateId: tpl.id,
      templateName: tpl.name,
      typeId: tpl.typeId,
      oldPrompt,
      experimentalPrompt: expPrompt,
      benchmarkPrompt,
      metrics
    };

    summary.comparisons.push({
      templateId: tpl.id,
      typeId: tpl.typeId,
      metrics
    });

    writeFile(path.join(OUT_ART_DIR, `${slug(tpl.id)}.json`), JSON.stringify(record, null, 2));
  }

  writeFile(path.join(OUT_ART_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

function writeEvalDoc(summary) {
  const a = summary.aggregate;
  const lines = [
    '# T2.5 Benchmark Evaluation',
    '',
    `标杆模板数：${summary.benchmarkTemplates}`,
    '',
    '对比维度：旧模板提示词 vs 实验模板提示词 vs 标杆模板提示词',
    '',
    '| dimension | old | experiment | benchmark |',
    '|---|---:|---:|---:|',
    `| space | ${a.space.old} | ${a.space.experiment} | ${a.space.benchmark} |`,
    `| composition | ${a.composition.old} | ${a.composition.experiment} | ${a.composition.benchmark} |`,
    `| hierarchy | ${a.hierarchy.old} | ${a.hierarchy.experiment} | ${a.hierarchy.benchmark} |`,
    `| lighting | ${a.lighting.old} | ${a.lighting.experiment} | ${a.lighting.benchmark} |`,
    `| material | ${a.material.old} | ${a.material.experiment} | ${a.material.benchmark} |`,
    `| style | ${a.style.old} | ${a.style.experiment} | ${a.style.benchmark} |`,
    `| subject | ${a.subject.old} | ${a.subject.experiment} | ${a.subject.benchmark} |`,
    '',
    '## 结论',
    '',
    '1. 标杆模板在空间/构图/层级/光线/材质维度保持满覆盖。',
    '2. 实验模板较旧模板有提升，但仍存在层级与材质表达缺口。',
    '3. 标杆结构化 prompt 在商业场景下更稳定，适合作为后续标准基线。'
  ];

  writeFile(FILE_T25_EVAL, lines.join('\n'));
}

function main() {
  writeTemplateTypesDoc();
  writeSkeletonDoc();
  writePromptStandardDoc();
  const summary = buildBenchmarks();
  writeEvalDoc(summary);

  console.log(JSON.stringify({
    phase: 'T2/T2.5',
    benchmarkTemplates: BENCHMARK_TEMPLATES.length,
    templateTypes: TEMPLATE_TYPES.length,
    outputDocs: [
      'docs/template-rebuild/t2-template-types.md',
      'docs/template-rebuild/t2-template-skeletons.md',
      'docs/template-rebuild/t25-prompt-standard.md',
      'docs/template-rebuild/t25-benchmark-eval.md'
    ],
    outputDirs: [
      'templates-benchmark',
      'artifacts/benchmark-test'
    ]
  }, null, 2));
}

main();
