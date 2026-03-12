import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

type SampleCase = {
  id: string;
  mediaType: "image" | "video";
  primary: string;
  secondary: string;
  firstLayer2?: string;
  firstLayer3?: string;
  firstLayer4?: string;
  secondSelections?: Array<{ testId: string; value: string }>;
  expectedKeywords: string[];
};

type SampleResult = {
  id: string;
  mediaType: "image" | "video";
  promptLength: number;
  matchedKeywords: string[];
  issues: string[];
};

const artifactDir = path.resolve("tests/robots/artifacts/prompt-eval/quick-workspace-sample");

const samples: SampleCase[] = [
  {
    id: "image_bar_multi",
    mediaType: "image",
    primary: "三个人站在酒吧里对峙，中间是主角",
    secondary: "主角更大，左右分开，背景丰富一点",
    firstLayer2: "multi_subject",
    firstLayer3: "relation_expression",
    firstLayer4: "cinematic",
    secondSelections: [
      { testId: "quick-second-image-subject-count", value: "3" },
      { testId: "quick-second-image-composition-position", value: "left" },
      { testId: "quick-second-image-background-complexity", value: "rich" }
    ],
    expectedKeywords: ["酒吧", "主角", "背景"]
  },
  {
    id: "image_forest_environment",
    mediaType: "image",
    primary: "一个旅行者站在森林空地中央，周围树木包围",
    secondary: "人物不要太大，环境感要强，前后层次清楚",
    firstLayer2: "environment",
    firstLayer3: "environment_wrap",
    firstLayer4: "realistic",
    secondSelections: [
      { testId: "quick-second-image-subject-scale", value: "wide" },
      { testId: "quick-second-image-composition-position", value: "depth" },
      { testId: "quick-second-image-background-complexity", value: "strong_environment" }
    ],
    expectedKeywords: ["森林", "旅行者", "环境"]
  },
  {
    id: "image_product_watch",
    mediaType: "image",
    primary: "一块黑色机械手表放在磨砂金属台面上",
    secondary: "产品完整展示，背景干净，细节清楚",
    firstLayer2: "product_object",
    firstLayer3: "product_showcase",
    firstLayer4: "commercial",
    secondSelections: [
      { testId: "quick-second-image-subject-scale", value: "balanced" },
      { testId: "quick-second-image-composition-position", value: "center" },
      { testId: "quick-second-image-background-complexity", value: "clean" }
    ],
    expectedKeywords: ["手表", "金属", "产品"]
  },
  {
    id: "image_room_portrait",
    mediaType: "image",
    primary: "穿黑色风衣的年轻女性站在窗边，室内冷色灯光",
    secondary: "半身中景，人物靠左，背景不要杂乱",
    firstLayer2: "single_subject",
    firstLayer3: "subject_highlight",
    firstLayer4: "cinematic",
    secondSelections: [
      { testId: "quick-second-image-subject-scale", value: "tight" },
      { testId: "quick-second-image-composition-position", value: "left" },
      { testId: "quick-second-image-background-complexity", value: "clean" }
    ],
    expectedKeywords: ["风衣", "窗边", "背景"]
  },
  {
    id: "image_detective_depth",
    mediaType: "image",
    primary: "工业工作室里一个侦探站在前景，后面有机械臂和蓝图屏幕",
    secondary: "侦探更靠前，后景关系要清楚，空间丰富",
    firstLayer2: "multi_subject",
    firstLayer3: "relation_expression",
    firstLayer4: "realistic",
    secondSelections: [
      { testId: "quick-second-image-subject-count", value: "3+" },
      { testId: "quick-second-image-composition-position", value: "depth" },
      { testId: "quick-second-image-background-complexity", value: "rich" }
    ],
    expectedKeywords: ["侦探", "机械臂", "蓝图"]
  },
  {
    id: "video_single_shot_entry",
    mediaType: "video",
    primary: "先看到门外风雪，然后主角推门进入屋内",
    secondary: "保持同一人物，暖光稳定，镜头跟随进入",
    firstLayer2: "single_shot",
    firstLayer3: "scene_progression",
    firstLayer4: "cinematic",
    secondSelections: [
      { testId: "quick-second-video-camera-motion", value: "follow" },
      { testId: "quick-second-video-main-scene", value: "indoor" },
      { testId: "quick-second-video-continuity-focus", value: "lighting" }
    ],
    expectedKeywords: ["风雪", "屋内", "暖光"]
  },
  {
    id: "video_continuous_corridor",
    mediaType: "video",
    primary: "一个女孩在学校走廊里快步前进，镜头持续跟着她",
    secondary: "不要切镜，节奏推进，人物身份保持一致",
    firstLayer2: "continuous",
    firstLayer3: "character_action",
    firstLayer4: "realistic",
    secondSelections: [
      { testId: "quick-second-video-shot-count", value: "4" },
      { testId: "quick-second-video-main-scene", value: "indoor" },
      { testId: "quick-second-video-continuity-focus", value: "identity" },
      { testId: "quick-second-video-shot-grammar", value: "cut" }
    ],
    expectedKeywords: ["走廊", "人物", "镜头"]
  },
  {
    id: "video_multiscene_rescue",
    mediaType: "video",
    primary: "先是雪地里的避难者，随后进入温暖的避难所房间",
    secondary: "场景切换明显，但人物和光线风格要连贯",
    firstLayer2: "multi_scene",
    firstLayer3: "scene_progression",
    firstLayer4: "cinematic",
    secondSelections: [
      { testId: "quick-second-video-shot-count", value: "3" },
      { testId: "quick-second-video-scene-transition", value: "indoor_outdoor" },
      { testId: "quick-second-video-continuity-focus", value: "lighting" },
      { testId: "quick-second-video-shot-grammar", value: "establishing" }
    ],
    expectedKeywords: ["雪地", "避难所", "人物"]
  },
  {
    id: "video_multicam_dialogue",
    mediaType: "video",
    primary: "一男一女坐在桌子两侧交谈，女人更靠镜头",
    secondary: "做反打和过肩，人物关系要稳定",
    firstLayer2: "multicam",
    firstLayer3: "relation_change",
    firstLayer4: "cinematic",
    secondSelections: [
      { testId: "quick-second-video-shot-count", value: "4" },
      { testId: "quick-second-video-main-scene", value: "indoor" },
      { testId: "quick-second-video-continuity-focus", value: "identity" },
      { testId: "quick-second-video-shot-grammar", value: "reverse_angle" }
    ],
    expectedKeywords: ["桌子", "交谈", "女人"]
  },
  {
    id: "video_mood_time_jump",
    mediaType: "video",
    primary: "女孩站在海边从白天等到黄昏，情绪逐渐平静",
    secondary: "时间跳切明显，风格和人物保持一致",
    firstLayer2: "multi_scene",
    firstLayer3: "mood_atmosphere",
    firstLayer4: "advertising",
    secondSelections: [
      { testId: "quick-second-video-shot-count", value: "4" },
      { testId: "quick-second-video-scene-transition", value: "time_jump" },
      { testId: "quick-second-video-continuity-focus", value: "style" },
      { testId: "quick-second-video-shot-grammar", value: "establishing" }
    ],
    expectedKeywords: ["海边", "黄昏", "女孩"]
  }
];

async function openQuickWorkspace(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("sp_workspace_mode", "results");
    localStorage.removeItem("sp_quick_media_type");
  });
  await page.reload();
}

function evaluatePrompt(sample: SampleCase, prompt: string): SampleResult {
  const issues: string[] = [];
  const matchedKeywords = sample.expectedKeywords.filter((keyword) => prompt.includes(keyword));
  const hasVideoExecutionLanguage = /camera|shot plan|shot grammar|motion|transition|continuity|镜头|分镜计划|运镜|镜头语法|衔接|连续性/i.test(prompt);
  const hasImageStructureLanguage = /构图|composition|场景|scene|主体|subject|背景|background|风格|style|静帧|still frame/i.test(prompt);

  if (!prompt.trim()) issues.push("prompt 为空");
  if (prompt.length < 180) issues.push("prompt 过短，结构约束可能不足");
  if (/undefined|null|NaN|Not Sure|不确定/i.test(prompt)) issues.push("prompt 出现脏值或不确定占位");
  if (sample.mediaType === "image") {
    if (!hasImageStructureLanguage) issues.push("图片 prompt 缺少基本结构表达");
    if (/T1 Frame Spec|Apply t0→t1|Transition\s+\d+|scene transition|shot grammar|camera motion/i.test(prompt)) {
      issues.push("图片 prompt 混入视频时序/镜头语言");
    }
  }
  if (sample.mediaType === "video") {
    if (!hasVideoExecutionLanguage) issues.push("视频 prompt 缺少镜头/动作/连续性语义");
    if (sample.firstLayer2 !== "single_shot" && !/transition|衔接|scene switch|time jump|continuous/i.test(prompt)) {
      issues.push("多镜头视频 prompt 缺少衔接信息");
    }
  }
  if (matchedKeywords.length < 2) issues.push("关键信息进入 prompt 不足");

  return {
    id: sample.id,
    mediaType: sample.mediaType,
    promptLength: prompt.length,
    matchedKeywords,
    issues
  };
}

test("quick_workspace_prompt_effectiveness_on_10_samples", async ({ page }) => {
  const results: SampleResult[] = [];

  for (const sample of samples) {
    await test.step(sample.id, async () => {
      await openQuickWorkspace(page);

      if (sample.mediaType === "video") {
        await page.getByTestId("composer-media-type").selectOption("video");
      }

      if (sample.firstLayer2) {
        await page.getByTestId("composer-primary-2").selectOption(sample.firstLayer2);
      }
      if (sample.firstLayer3) {
        await page.getByTestId("composer-primary-3").selectOption(sample.firstLayer3);
      }
      if (sample.firstLayer4) {
        await page.getByTestId("composer-primary-4").selectOption(sample.firstLayer4);
      }

      await page.getByTestId("result-console-brief").fill(sample.primary);
      await page.getByTestId("result-console-generate").click();
      await page.getByTestId("result-console-brief-secondary").fill(sample.secondary);

      for (const item of sample.secondSelections ?? []) {
        await page.getByTestId(item.testId).locator("select").selectOption(item.value);
      }

      await page.getByTestId("result-console-generate-secondary").click();
      await expect(page.getByTestId("quick-canvas-prompt-editor")).toBeVisible();
      const prompt = await page.getByTestId("quick-canvas-prompt-editor").inputValue();
      results.push(evaluatePrompt(sample, prompt));
    });
  }

  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, "report.json"), `${JSON.stringify(results, null, 2)}\n`);
  fs.writeFileSync(
    path.join(artifactDir, "report.md"),
    [
      "# Quick Workspace Prompt Check",
      "",
      "| case | media | prompt length | matched keywords | issues |",
      "|---|---|---:|---|---|",
      ...results.map((item) => `| ${item.id} | ${item.mediaType} | ${item.promptLength} | ${item.matchedKeywords.join(", ") || "-"} | ${item.issues.join("; ") || "pass"} |`)
    ].join("\n")
  );

  const hardFailures = results.filter((item) => item.issues.some((issue) =>
    issue.includes("prompt 为空")
    || issue.includes("脏值")
    || issue.includes("图片 prompt 混入视频时序/镜头语言")
    || issue.includes("视频 prompt 缺少镜头/动作/连续性语义")
  ));
  expect(hardFailures).toHaveLength(0);
});
