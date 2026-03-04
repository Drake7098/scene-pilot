import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const countArg = Number(args[0]);
const count = Number.isFinite(countArg) && countArg > 0 ? Math.floor(countArg) : 100;
const outDir = path.resolve(args[1] || "tests/robots/artifacts/prompt-eval/simulated");
const conflictInjectRate = Number.isFinite(Number(process.env.PROMPT_CONFLICT_INJECT_RATE))
  ? Math.max(0, Math.min(1, Number(process.env.PROMPT_CONFLICT_INJECT_RATE)))
  : 0;
const actionConflictInjectRate = Number.isFinite(Number(process.env.PROMPT_ACTION_CONFLICT_INJECT_RATE))
  ? Math.max(0, Math.min(1, Number(process.env.PROMPT_ACTION_CONFLICT_INJECT_RATE)))
  : 0;

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith(".txt")) fs.rmSync(path.join(outDir, f), { force: true });
}

const tiers = [
  { id: "indoor", ratio: "9:16", farCut: "close threshold", anti: "low" },
  { id: "small_plaza", ratio: "1:1", farCut: "mid threshold", anti: "mid" },
  { id: "open_space", ratio: "16:9", farCut: "far threshold", anti: "strong" }
];

const scenarioDomains = [
  {
    id: "daily",
    label: "日常",
    needs: [
      "morning kitchen routine",
      "commute at metro entrance",
      "park walk with phone call",
      "family dinner short beat",
      "street coffee pickup",
      "home desk work moment",
      "night convenience store stop",
      "elevator encounter",
      "pet interaction at home",
      "rainy-day umbrella crossing"
    ]
  },
  {
    id: "ecommerce",
    label: "电商",
    needs: [
      "product macro reveal",
      "before-after beauty demo",
      "unboxing tabletop showcase",
      "fashion try-on spin",
      "kitchen appliance usage demo",
      "texture close-up for skincare",
      "packaging detail highlight",
      "multi-angle shoe display",
      "portable gadget in hand",
      "call-to-action end card safe zone"
    ]
  },
  {
    id: "video",
    label: "视频",
    needs: [
      "two-character dialogue",
      "tracking through crowd",
      "night chase",
      "reverse-angle conversation",
      "continuous camera move",
      "wide establishing shot",
      "close-up emotional beat",
      "documentary style interview",
      "sports follow shot",
      "music video dance beat"
    ]
  },
  {
    id: "animation",
    label: "动画",
    needs: [
      "stylized hero entrance",
      "chibi character reaction loop",
      "mecha assembly transition",
      "fantasy spell cast pose",
      "cartoon run cycle beat",
      "anime school corridor moment",
      "animal mascot jump turn",
      "pixel-art tavern establishing",
      "storybook character wave",
      "toon facial exaggeration close-up"
    ]
  }
];

const motions = [
  "moves right, moves closer to camera, increases in size, slight turn.",
  "moves left, becomes farther from camera, decreases in size, obvious turn.",
  "stays stable layout and keeps static composition.",
  "moves up, moves closer to camera, increases in size, obvious turn.",
  "moves down, becomes farther from camera, decreases in size, slight turn."
];

const objectProfiles = [
  {
    id: "hero_1",
    base: "年轻男性，黑色外套",
    actions: ["跑了三步", "坐着", "在吃东西"],
    actionLine: "先向右跑了三步，随后坐下并继续吃东西。"
  },
  {
    id: "hero_2",
    base: "短发女性，运动服",
    actions: ["慢走两步", "站立", "拿着杯子喝水"],
    actionLine: "慢走两步后原地站立，抬手喝水。"
  },
  {
    id: "hero_3",
    base: "中年男性，衬衫",
    actions: ["向左挪一步", "坐着", "看手机"],
    actionLine: "向左挪一步后坐定，低头看手机。"
  },
  {
    id: "hero_4",
    base: "女性角色，白色连衣裙",
    actions: ["转身", "站立", "挥手"],
    actionLine: "缓慢转身后保持站立，向镜头挥手。"
  },
  {
    id: "hero_5",
    base: "电商模特，浅色上衣",
    actions: ["拿起产品", "转身展示", "微笑点头"],
    actionLine: "拿起产品后转身展示细节，最后对镜头微笑点头。"
  },
  {
    id: "hero_6",
    base: "动画风角色，蓝色短发",
    actions: ["小跳一步", "停顿", "挥手比心"],
    actionLine: "先小跳一步再停顿，随后挥手比心。"
  }
];

function pick(arr, i) {
  return arr[i % arr.length];
}

function injectConflict(i) {
  if (conflictInjectRate <= 0) return false;
  const threshold = Math.max(1, Math.floor(1 / conflictInjectRate));
  return i % threshold === 0;
}

function injectActionConflict(i) {
  if (actionConflictInjectRate <= 0) return false;
  const threshold = Math.max(1, Math.floor(1 / actionConflictInjectRate));
  return i % threshold === 0;
}

function hasMoveAction(actions = []) {
  return actions.some((a) => /跑|快走|慢走|挪|移动/.test(String(a)));
}

function isStaticMotion(motion = "") {
  return /static composition|stable layout/i.test(motion);
}

function renderPrompt(i) {
  const tier = pick(tiers, i);
  const domain = pick(scenarioDomains, i);
  const need = pick(domain.needs, i * 3 + 1);
  let motion = pick(motions, i * 7 + 3);
  const actor = pick(objectProfiles, i * 5 + 2);
  if (hasMoveAction(actor.actions) && isStaticMotion(motion)) {
    motion = pick(motions.filter((m) => !isStaticMotion(m)), i * 11 + 1);
  }
  const duration = 4 + (i % 9);
  const staticCase = isStaticMotion(motion) && !hasMoveAction(actor.actions);
  const withConflict = injectConflict(i + 1);
  const withActionConflict = injectActionConflict(i + 1);

  const lines = [
    `Scenario: sim_${String(i + 1).padStart(3, "0")}`,
    `[V2 SCENEPILOT COMPILE]`,
    `Scene: shot_${String(i + 1).padStart(2, "0")} (${duration}s)`,
    `Scene Domain: ${domain.id} (${domain.label})`,
    `Need: ${need}`,
    `@compiler:v2`,
    `@scene_tier:${tier.id}`,
    `@v2_mode:strict`,
    "",
    "User Object Input:",
    `- object_id: ${actor.id}`,
    `- base: ${actor.base}`,
    `- user_actions: ${actor.actions.join(" / ")}`,
    "",
    "Layout Contract (obey strictly):",
    `- preserve relative layout and preserve depth order; ${tier.farCut}.`,
    "- keep object count; do not re-layout composition.",
    "",
    "T0 Frame Spec:",
    "- baseline framing with foreground-midground-background separation.",
    "",
    "T1 Frame Spec:",
    staticCase
      ? `- 当前 t0=t1，整段 ${duration}s 保持静止构图。`
      : `- ${actor.actionLine} ${motion}`,
    "",
    "Anti-Director Rules:",
    `- anti-director strength: ${tier.anti}.`,
    "- no auto-centering; no symmetry; no hero re-layout.",
    "- no text; no overlays; keep object count.",
    "",
    "Generation constraints:",
    `- Camera Contract: hold framing for ${duration}s duration window.`,
    "- structure first, style second."
  ];

  if (withConflict) {
    lines.push("- add text overlay for title card.");
  }

  if (withActionConflict) {
    lines.push("- 动作改写：角色全程站立，双手空置，不做进食动作。");
  }

  return lines.join("\n");
}

for (let i = 0; i < count; i += 1) {
  const text = renderPrompt(i);
  const file = `sim_${String(i + 1).padStart(3, "0")}.txt`;
  fs.writeFileSync(path.join(outDir, file), `${text}\n`);
}

console.log(`Generated ${count} simulated prompt files in ${outDir}`);
console.log(`Conflict injection rate: ${conflictInjectRate}`);
console.log(`Action conflict injection rate: ${actionConflictInjectRate}`);
