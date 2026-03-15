# Template Asset Pipeline v1

**Stage:** Template Asset Pipeline v1 — STRICT SAFE

**Date:** 2025-03-14

---

## 1. Stage Goals

建立模板资产最小可用生产流水线，用于：
- 生成模板预览图（静图）
- 生成精品视频样本
- 作为系统级真实测试链路
- 产出候选集供人工终审

**Not in scope:** Template600 全量扩充、Queue 系统、Adapter engine、新 UI、新 schema

---

## 2. Directory Structure

```
scripts/template-assets/
  config.ts           # Load .env, output dir, batch size, retry limit
  shared.ts           # buildProjectAndPrompt, selectPhaseATemplates, manifest helpers
  render-images.ts    # fal 静图生成
  render-videos.ts    # runway 视频生成
  score-assets.ts     # 基础自动评分
  retry-failed.ts     # 失败/低分重试
  save-asset-manifest.ts  # 统一 manifest 输出

artifacts/template-assets/
  images/
  videos/
  logs/
  manifests/
  rejected/   (future)
  selected/   (future)
```

---

## 3. Image Pipeline (静图链路)

**Source:** `render-images.ts`

**Flow:**
1. 读取 Phase A 模板清单（product_hero, product_center_display, center_composition 等 image 模板）
2. 复用 `loadTemplatePayloadById` → `applyPayloadToProject` → `buildPromptForScene`
3. 调用 fal API (`fal-ai/flux/dev`)
4. 下载图片保存至 `artifacts/template-assets/images/`
5. 写入 `image-manifest.json` 与 logs

**Input:** templateId  
**Output:** 原图、manifest 记录、logs  

**Config:** FAL_KEY, TEMPLATE_ASSETS_IMAGE_SIZE (default: landscape_16_9), FAL_IMAGE_MODEL

---

## 4. Video Pipeline (视频链路)

**Source:** `render-videos.ts`

**Flow:**
1. 读取 Phase A 视频模板（solo_speaker, dialogue_duo, opening_shot 等）
2. 优先使用首帧图（来自 image-manifest 的成功结果）作为 image-to-video 输入
3. 无首帧时使用 text-to-video
4. 调用 Runway API (gen4_turbo)
5. 轮询任务状态，下载视频至 `artifacts/template-assets/videos/`
6. 写入 `video-manifest.json` 与 logs

**Input:** templateId, optional firstFramePath  
**Output:** 视频文件、manifest、logs  

**Config:** RUNWAY_API_KEY, TEMPLATE_ASSETS_VIDEO_DURATION (5s), TEMPLATE_ASSETS_VIDEO_RATIO (16:9)

---

## 5. Data Source (数据来源)

**必须复用现有系统：**
- `template spec` / `payload` — `loadTemplatePayloadById`, `applyPayloadToProject`
- `buildPromptForScene` — 现有 prompt 输出
- `platformId`: fal (静图), runway (视频)
- `engineId`, `applyMode`, `mediaMode`, `workspace: "pro"`

**禁止：** 新写第二套 prompt builder、template apply、platform mapping

---

## 6. Manifest Design

**Fields:**
- templateId, familyId, variantId
- mediaType (image | video)
- platformId, engineId
- exportMode: "prompt"
- promptHash, promptText (optional separate file)
- assetPath, thumbnailPath, firstFramePath (video)
- status: pending | success | failed | skipped
- retryCount, score
- selected, rejected (manual curation)
- error, durationSec, fileSizeBytes, width, height

**Files:**
- `manifests/image-manifest.json`
- `manifests/video-manifest.json`
- `manifests/scored-manifest.json` (after score-assets)
- `manifests/asset-manifest-unified.json` (after save-asset-manifest)

---

## 7. Auto-QC Scope (自动质检范围)

**静图：**
- 文件是否存在
- 文件大小是否在合理范围 (10KB–50MB)
- prompt 是否非空
- 结果是否成功落盘

**视频：**
- 文件是否存在
- 文件大小是否合理 (50KB–200MB)
- 时长是否达标 (≥3s)
- 是否使用首帧图

**V1 不做：** 美学终判、AI 审美、分辨率像素级检测

---

## 8. Retry Strategy

- `retry-failed.ts` 读取 `scored-manifest.json`
- 筛选 `status !== "success"` 或 `score < 3`
- 过滤 `retryCount < retryLimit`（default: 2）
- 设置 `TEMPLATE_ASSETS_RETRY_BATCH` 传递 templateId 列表
- 重新执行 render-images / render-videos

---

## 9. Schema Change

**no**

---

## 10. Engine Change

**no**

---

## 11. New Fields

**none**

---

## 12. Ready for Asset Batch Expansion

**yes** — 在 Phase A 稳定后，可进入 Phase B/C 扩量。

---

## 13. Usage

```bash
# .env / .env.local
FAL_KEY=...
RUNWAY_API_KEY=...

# Phase A: 10 images, 3 videos
npm run template-assets:phase-a

# Or step by step
npm run template-assets:images 10
npm run template-assets:videos 3
npm run template-assets:score
npm run template-assets:manifest

# Retry failed
npm run template-assets:retry
```

---

## 14. Acceptance Format

```
Stage: Template Asset Pipeline v1

Scripts:
- render-images
- render-videos
- score-assets
- retry-failed
- save-asset-manifest

Output:
- image batch count: 10 (Phase A)
- video batch count: 3 (Phase A)
- manifests: image-manifest, video-manifest, scored-manifest, asset-manifest-unified
- logs: artifacts/template-assets/logs/

Schema change:
no

Engine change:
no

New fields:
none

Ready for Asset Batch Expansion:
yes
```
