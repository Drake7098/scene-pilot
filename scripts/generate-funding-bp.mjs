import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "artifacts", "funding-bp");
const ENTRY_SCREENSHOT = path.join(OUT_DIR, "workspace-entry.png");
const PRO_SCREENSHOT = path.join(OUT_DIR, "pro-workspace.png");
const HTML_PATH = path.join(OUT_DIR, "scene-pilotix-funding-bp.html");
const PDF_PATH = path.join(OUT_DIR, "scene-pilotix-funding-bp.pdf");
const APP_URL = process.env.BP_APP_URL || "http://127.0.0.1:4173/";

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function page(title, kicker, body, extra = "") {
  return `
    <section class="page">
      <div class="page-bg"></div>
      <div class="page-inner">
        <div class="page-top">
          <div class="brand">ScenePilotix</div>
          <div class="page-no">${title}</div>
        </div>
        <div class="kicker">${kicker}</div>
        <div class="body">${body}</div>
        ${extra}
      </div>
    </section>
  `;
}

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 2048, height: 1152 },
    deviceScaleFactor: 1
  });
  await context.addInitScript(() => {
    localStorage.setItem("scenepilot_lang", "zh");
  });

  const page = await context.newPage();
  await page.goto(APP_URL, { waitUntil: "networkidle" });
  await page.screenshot({ path: ENTRY_SCREENSHOT });

  await page.goto(new URL("/app?signin=1", APP_URL).toString(), { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: PRO_SCREENSHOT });
  await browser.close();
}

function deckHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScenePilotix 融资 BP</title>
  <style>
    :root {
      --bg: #050816;
      --bg2: #0b1026;
      --card: rgba(10, 14, 30, 0.74);
      --line: rgba(135, 196, 255, 0.22);
      --text: #f7fbff;
      --muted: rgba(232, 241, 255, 0.72);
      --cyan: #74d6ff;
      --blue: #4f7dff;
      --teal: #49f2d3;
      --gold: #ffd07e;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #02040b; color: var(--text); font-family: "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", sans-serif; }
    body { counter-reset: page; }
    .page {
      position: relative;
      width: 1280px;
      height: 720px;
      overflow: hidden;
      page-break-after: always;
      background:
        radial-gradient(circle at 82% 18%, rgba(79,125,255,0.28), transparent 28%),
        radial-gradient(circle at 12% 88%, rgba(73,242,211,0.18), transparent 24%),
        linear-gradient(135deg, #02040b 0%, #06101c 42%, #060a19 100%);
    }
    .page-bg {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 40px 40px;
      mask-image: linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.24));
      opacity: 0.28;
    }
    .page-inner {
      position: relative;
      z-index: 1;
      height: 100%;
      padding: 34px 42px 36px;
      display: flex;
      flex-direction: column;
    }
    .page-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: rgba(255,255,255,0.92);
    }
    .page-no {
      font-size: 12px;
      color: rgba(255,255,255,0.54);
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .kicker {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--cyan);
      margin-bottom: 12px;
    }
    h1, h2, h3, p { margin: 0; }
    .hero-title {
      font-size: 54px;
      line-height: 1.05;
      font-weight: 820;
      letter-spacing: -0.03em;
      max-width: 920px;
    }
    .hero-sub {
      margin-top: 18px;
      max-width: 760px;
      font-size: 20px;
      line-height: 1.6;
      color: var(--muted);
    }
    .body {
      flex: 1;
      min-height: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1.08fr 0.92fr;
      gap: 22px;
      height: 100%;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }
    .stack {
      display: grid;
      gap: 16px;
    }
    .card {
      background: linear-gradient(180deg, rgba(12, 18, 36, 0.82), rgba(7, 11, 26, 0.72));
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04);
      backdrop-filter: blur(14px);
    }
    .metric {
      display: grid;
      gap: 10px;
      align-content: start;
      min-height: 148px;
    }
    .metric .num {
      font-size: 34px;
      font-weight: 800;
      color: var(--text);
    }
    .metric .label {
      font-size: 15px;
      line-height: 1.45;
      color: var(--muted);
    }
    .section-title {
      font-size: 36px;
      line-height: 1.12;
      font-weight: 780;
      letter-spacing: -0.02em;
      margin-bottom: 18px;
    }
    .section-copy {
      font-size: 17px;
      line-height: 1.7;
      color: var(--muted);
      max-width: 760px;
    }
    ul.clean {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 14px;
    }
    ul.clean li {
      position: relative;
      padding-left: 18px;
      font-size: 17px;
      line-height: 1.6;
      color: rgba(241, 247, 255, 0.88);
    }
    ul.clean li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 11px;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--teal), var(--cyan));
      box-shadow: 0 0 20px rgba(116, 214, 255, 0.5);
    }
    .shot {
      width: 100%;
      border-radius: 24px;
      border: 1px solid rgba(255,255,255,0.12);
      overflow: hidden;
      box-shadow: 0 30px 80px rgba(0,0,0,0.4);
      background: rgba(0,0,0,0.45);
    }
    .shot img {
      display: block;
      width: 100%;
      height: auto;
    }
    .caption {
      margin-top: 14px;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(235, 244, 255, 0.74);
    }
    .flow {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      margin-top: 20px;
    }
    .flow-step {
      position: relative;
      padding: 18px 16px;
      border-radius: 18px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      min-height: 122px;
    }
    .flow-step::after {
      content: "→";
      position: absolute;
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(116,214,255,0.8);
      font-size: 22px;
      font-weight: 700;
    }
    .flow-step:last-child::after { display: none; }
    .flow-step .step-no {
      font-size: 12px;
      color: var(--cyan);
      letter-spacing: 0.16em;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    .flow-step .step-title {
      font-size: 18px;
      font-weight: 740;
      margin-bottom: 8px;
    }
    .flow-step .step-copy {
      font-size: 14px;
      line-height: 1.55;
      color: var(--muted);
    }
    .highlight {
      color: var(--gold);
      font-weight: 760;
    }
    .split-stat {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: 18px;
    }
    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 18px;
    }
    .pill {
      min-height: 36px;
      padding: 0 14px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      color: rgba(248,251,255,0.86);
      font-size: 14px;
    }
    .timeline {
      display: grid;
      gap: 14px;
      margin-top: 20px;
    }
    .timeline-item {
      display: grid;
      grid-template-columns: 140px minmax(0, 1fr);
      gap: 16px;
      align-items: start;
      padding: 16px 0;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .timeline-item:first-child { border-top: none; }
    .timeline-item .left {
      font-size: 14px;
      font-weight: 720;
      color: var(--cyan);
    }
    .timeline-item .right {
      font-size: 16px;
      line-height: 1.65;
      color: rgba(241,247,255,0.86);
    }
    .funding-box {
      margin-top: 24px;
      padding: 28px;
      border-radius: 28px;
      background: linear-gradient(135deg, rgba(79,125,255,0.18), rgba(73,242,211,0.11));
      border: 1px solid rgba(116,214,255,0.24);
      box-shadow: 0 30px 90px rgba(0,0,0,0.32);
    }
    .funding-amt {
      font-size: 64px;
      font-weight: 840;
      letter-spacing: -0.04em;
      margin: 6px 0 10px;
    }
    .footer-note {
      margin-top: auto;
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      letter-spacing: 0.06em;
    }
  </style>
</head>
<body>
  ${page(
    "01 / Cover",
    "AI Storyboard OS",
    `
      <h1 class="hero-title">ScenePilotix：把用户一句想法，压缩成可执行的镜头、对象与场景结构</h1>
      <p class="hero-sub">面向 AI 图片与视频创作的单工作台系统。用户直接进入 Pro 工作台，把想法转为可编辑、可导出、可落地的生产项目。</p>
      <div class="split-stat">
        <div class="card metric">
          <div class="num">Pro Workspace</div>
          <div class="label">统一入口，直接锁定镜头目标、场景结构与导出路径。</div>
        </div>
        <div class="card metric">
          <div class="num">Template Workspace</div>
          <div class="label">模板驱动创建项目，把需求变成分镜工程、对象层级与平台适配提示词。</div>
        </div>
      </div>
      <div class="pill-row">
        <div class="pill">锁定需求快</div>
        <div class="pill">结构表达准</div>
        <div class="pill">图片视频一体</div>
        <div class="pill">本地生成可闭环</div>
      </div>
    `
  )}

  ${page(
    "02 / Pain",
    "Problem",
    `
      <div class="grid-2">
        <div class="card">
          <h2 class="section-title">今天的 AI 创作工具，最难的不是出图，而是<span class="highlight">把需求说对</span></h2>
          <ul class="clean">
            <li>用户真实需求是“我要看到什么”，但系统要求用户直接写“机器能执行的提示词”。</li>
            <li>图片和视频都存在同一个缺口：对象关系、空间层次、镜头推进、场景切换很难一次说清。</li>
            <li>单一长提示词无法稳定处理位置、层级、连续性和多镜头逻辑，导致反复重试。</li>
            <li>非专业用户不会拆镜头，不会写结构，只能靠运气试。</li>
          </ul>
        </div>
        <div class="stack">
          <div class="card metric">
            <div class="num">痛点 1</div>
            <div class="label">需求进入系统时就失真，用户描述与模型执行语言之间缺少中间层。</div>
          </div>
          <div class="card metric">
            <div class="num">痛点 2</div>
            <div class="label">图片和视频工具割裂，用户需要在“灵感输入”和“结构控制”之间来回切换。</div>
          </div>
          <div class="card metric">
            <div class="num">痛点 3</div>
            <div class="label">出结果慢、命中率低、修改成本高，创作效率和付费意愿都被拖低。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "03 / Solution",
    "Product Thesis",
    `
      <div class="card" style="height: 100%;">
        <h2 class="section-title">我们的答案不是“再给用户一个提示词框”，而是给用户一个<span class="highlight">结构操作系统</span></h2>
        <p class="section-copy">ScenePilotix 在“自然语言”和“生成引擎”之间插入了一个结构层。这个结构层负责解析意图、清洗冲突、确定镜头对象、组织场景关系，再把结果送给本地或外部生成系统。</p>
        <div class="flow">
          <div class="flow-step">
            <div class="step-no">Step 1</div>
            <div class="step-title">一句目标</div>
            <div class="step-copy">用户只说想看什么，不需要先懂提示词工程。</div>
          </div>
          <div class="flow-step">
            <div class="step-no">Step 2</div>
            <div class="step-title">结构确认</div>
            <div class="step-copy">系统用自适应选项锁定镜头、主体、场景和稳定重点。</div>
          </div>
          <div class="flow-step">
            <div class="step-no">Step 3</div>
            <div class="step-title">结构草案</div>
            <div class="step-copy">生成画面/镜头结构，让用户在结果前就能纠偏。</div>
          </div>
          <div class="flow-step">
            <div class="step-no">Step 4</div>
            <div class="step-title">预览与迭代</div>
            <div class="step-copy">优先返回低成本方向图，验证对象关系和构图。</div>
          </div>
          <div class="flow-step">
            <div class="step-no">Step 5</div>
            <div class="step-title">进入 Pro</div>
            <div class="step-copy">升级为完整分镜项目，继续精修、导出、归档。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "04 / Product",
    "Workspace Entry",
    `
      <div class="grid-2">
        <div class="stack">
          <div>
            <h2 class="section-title">统一入口：直接把需求压成结构项目</h2>
            <p class="section-copy">用户直接进入 Pro 主路径，通过模板与结构编辑快速锁定目标。系统根据图片/视频自动给出稳定的结构约束，减少重复和冲突设置。</p>
          </div>
          <div class="card">
            <ul class="clean">
              <li>模板入口负责给出可执行的结构骨架与场景边界。</li>
              <li>编辑区直接调整镜头、主体、场景约束并实时预览。</li>
              <li>避免“入口切换 + 语义重录”导致的信息丢失。</li>
              <li>统一流程目标是更少跳转、更快拿到可交付结果。</li>
            </ul>
          </div>
        </div>
        <div>
          <div class="shot"><img src="./workspace-entry.png" alt="Workspace Entry Screenshot" /></div>
          <div class="caption">界面截图：统一入口直接进入结构化项目编辑主路径，减少模式切换成本。</div>
        </div>
      </div>
    `
  )}

  ${page(
    "05 / Product",
    "Pro Workspace",
    `
      <div class="grid-2">
        <div>
          <div class="shot"><img src="./pro-workspace.png" alt="Pro Workspace Screenshot" /></div>
          <div class="caption">界面截图：Pro 工作台承接快速结构结果，进入项目级分镜编辑、导出和资产管理。</div>
        </div>
        <div class="stack">
          <div>
            <h2 class="section-title">Pro 工作台：把结构草案升级为可生产的工程文件</h2>
            <p class="section-copy">当需求已经被锁定，用户不需要重新输入，而是直接在 Pro 工作台继续管理场景、对象层、导出格式和分镜库。</p>
          </div>
          <div class="card">
            <ul class="clean">
              <li>项目级编辑：场景、镜头、对象层、结构状态统一管理。</li>
              <li>导出能力：多平台提示词、scene.json、任务包、本地目录保存。</li>
              <li>分镜库：保存单个分镜或整组项目，支持复用与沉淀。</li>
              <li>让“临时灵感”进入“可复用生产资产”。</li>
            </ul>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "06 / Engine",
    "Core Engine",
    `
      <div class="card" style="height: 100%;">
        <h2 class="section-title">核心技术壁垒：不是简单写 Prompt，而是<span class="highlight">先做结构计算</span></h2>
        <div class="grid-4">
          <div class="card metric">
            <div class="num">Intent Parse</div>
            <div class="label">把用户自由文本解析成媒体类型、主体意图、场景指向和镜头需求。</div>
          </div>
          <div class="card metric">
            <div class="num">Conflict Normalize</div>
            <div class="label">自动消除重复设置和结构冲突，确保输入有效。</div>
          </div>
          <div class="card metric">
            <div class="num">Structure Draft</div>
            <div class="label">将需求转成对象、空间关系、镜头节奏与连续性重点。</div>
          </div>
          <div class="card metric">
            <div class="num">Prompt Route</div>
            <div class="label">按平台能力生成适配文本，并连接 Draw Things / ComfyUI 等本地运行时。</div>
          </div>
        </div>
        <div class="pill-row">
          <div class="pill">图片结构</div>
          <div class="pill">视频镜头结构</div>
          <div class="pill">对象位置与层级</div>
          <div class="pill">场景切换与连续性</div>
          <div class="pill">平台适配导出</div>
          <div class="pill">本地首轮预览</div>
        </div>
      </div>
    `
  )}

  ${page(
    "07 / Why Now",
    "Competitive Edge",
    `
      <div class="grid-2">
        <div class="card">
          <h2 class="section-title">ScenePilotix 的优势，不在于“模型更大”，而在于<span class="highlight">输入更准、结构更稳</span></h2>
          <ul class="clean">
            <li>对用户来说，系统从“写提示词工具”变成“帮我理解需求的工作台”。</li>
            <li>对结果来说，系统先控制对象、场景、镜头，再把结构送去生成，引导更稳定。</li>
            <li>对产品来说，单工作台让“灵感 -> 工程”在同一路径闭环。</li>
          </ul>
        </div>
        <div class="stack">
          <div class="card metric">
            <div class="num">更少输入</div>
            <div class="label">用户不需要一次性填满复杂表单，只回答系统真正需要的信息。</div>
          </div>
          <div class="card metric">
            <div class="num">更高命中</div>
            <div class="label">先锁定结构，再出预览，再进 Pro 精修，减少无效生成轮次。</div>
          </div>
          <div class="card metric">
            <div class="num">更强沉淀</div>
            <div class="label">每次生成都能进入分镜库和项目文件，而不是一次性对话记录。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "08 / Use Cases",
    "Target Users",
    `
      <div class="card" style="height: 100%;">
        <h2 class="section-title">最先被击中的用户：高频创作，但不愿意再手搓结构的人</h2>
        <div class="grid-3">
          <div class="card metric">
            <div class="num">内容创作者</div>
            <div class="label">要快速拿图、拿视频方向，但不愿被复杂参数拖住。</div>
          </div>
          <div class="card metric">
            <div class="num">短剧 / 广告团队</div>
            <div class="label">需要把镜头、对象和场景关系说清，便于协作和复现。</div>
          </div>
          <div class="card metric">
            <div class="num">本地生成用户</div>
            <div class="label">已经有 Draw Things 或 ComfyUI，但缺少一层更强的结构前端。</div>
          </div>
        </div>
        <div class="split-stat">
          <div class="card">
            <div class="section-copy">用户价值 1：把“我不知道怎么写 prompt”变成“我只需要描述我想看到什么”。</div>
          </div>
          <div class="card">
            <div class="section-copy">用户价值 2：把“每次都从零开始”变成“结构可以继续编辑、保存、导出和复用”。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "09 / Business",
    "Business Model",
    `
      <div class="grid-2">
        <div class="stack">
          <div class="card">
            <h2 class="section-title">商业模式</h2>
            <ul class="clean">
              <li>个人订阅：开放更高频的快速生成、更多结构模板与导出能力。</li>
              <li>Pro 订阅：项目级分镜编辑、资产保存、批量导出、本地工作流连接。</li>
              <li>团队版：共享分镜库、结构模板、品牌风格资产和协作权限。</li>
              <li>企业/API：把结构工作台接入内容中台、广告中台或本地推理栈。</li>
            </ul>
          </div>
        </div>
        <div class="stack">
          <div class="card metric">
            <div class="num">SaaS 收费</div>
            <div class="label">围绕高频创作与专业工作流升级持续收费。</div>
          </div>
          <div class="card metric">
            <div class="num">工作流增值</div>
            <div class="label">本地生成连接、平台适配导出、模板库、团队协作构成高毛利增值层。</div>
          </div>
          <div class="card metric">
            <div class="num">数据沉淀</div>
            <div class="label">用户的结构选择、修改路径和导出行为，可反哺更强的产品优化与企业能力。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "10 / GTM",
    "Go To Market",
    `
      <div class="card" style="height: 100%;">
        <h2 class="section-title">增长路径：先占“高频创作入口”，再吃“生产工作流”</h2>
        <div class="timeline">
          <div class="timeline-item">
            <div class="left">阶段 1</div>
            <div class="right">以统一工作台切入，用“更少跳转、更快出结果”吃下 AI 图片/视频创作者的第一入口。</div>
          </div>
          <div class="timeline-item">
            <div class="left">阶段 2</div>
            <div class="right">把成功结构导向 Pro 工作台，让用户从灵感生成转向项目管理、分镜沉淀和导出复用。</div>
          </div>
          <div class="timeline-item">
            <div class="left">阶段 3</div>
            <div class="right">进入团队场景，提供共享分镜库、品牌模板、本地推理工作流和企业级部署。</div>
          </div>
        </div>
      </div>
    `
  )}

  ${page(
    "11 / Roadmap",
    "Roadmap",
    `
      <div class="grid-2">
        <div class="card">
          <h2 class="section-title">当前已经形成的闭环</h2>
          <ul class="clean">
            <li>统一工作台主入口与模板驱动创建流程。</li>
            <li>结构草案与对象级编辑。</li>
            <li>本地首轮预览与 Prompt 路由。</li>
            <li>Pro 项目编辑、导出、分镜库保存。</li>
          </ul>
        </div>
        <div class="card">
          <h2 class="section-title">下一阶段重点</h2>
          <ul class="clean">
            <li>把结构画布进一步升级为结果前的主决策层。</li>
            <li>强化视频连续性、分镜节奏与对象继承能力。</li>
            <li>上线团队共享、风格模板和项目协作能力。</li>
            <li>面向企业开放结构层 API 和私有化部署方案。</li>
          </ul>
        </div>
      </div>
    `
  )}

  ${page(
    "12 / Funding",
    "Fundraising",
    `
      <h2 class="section-title">本轮融资计划</h2>
      <p class="section-copy">我们正在把 ScenePilotix 从“更好的 AI 创作前端”推进成“镜头与场景结构操作系统”。本轮融资将用于产品深化、推理连接、团队协作和商业化落地。</p>
      <div class="funding-box">
        <div style="font-size: 18px; color: var(--muted);">融资金额</div>
        <div class="funding-amt">人民币 2,000 万元</div>
        <div class="grid-3" style="margin-top: 18px;">
          <div class="card metric">
            <div class="num">40%</div>
            <div class="label">产品与核心引擎：强化结构层、连续性、画布与 Pro 工作流。</div>
          </div>
          <div class="card metric">
            <div class="num">35%</div>
            <div class="label">增长与商业化：创作者市场、团队版切入、企业试点。</div>
          </div>
          <div class="card metric">
            <div class="num">25%</div>
            <div class="label">基础设施与交付：本地运行时接入、导出体系、交付与支持能力。</div>
          </div>
        </div>
      </div>
      <div class="footer-note">ScenePilotix Funding Deck · Generated locally from current product structure</div>
    `
  )}
</body>
</html>`;
}

async function writeDeckHtml() {
  await fs.writeFile(HTML_PATH, deckHtml(), "utf8");
}

async function exportPdf() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 }
  });
  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: "load" });
  await page.pdf({
    path: PDF_PATH,
    printBackground: true,
    width: "1280px",
    height: "720px",
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
    preferCSSPageSize: true
  });
  await browser.close();
}

async function main() {
  await ensureDir(OUT_DIR);
  await captureScreenshots();
  await writeDeckHtml();
  await exportPdf();
  console.log(JSON.stringify({
    entryScreenshot: ENTRY_SCREENSHOT,
    proScreenshot: PRO_SCREENSHOT,
    html: HTML_PATH,
    pdf: PDF_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
