# UI Micro Fix Patch — 左栏/画布/右栏细节修复

**Stage:** UI Micro Fix Patch

## 1. 修复项列表

| # | 问题 | 修复 |
|---|------|------|
| 1 | 左边栏「镜头控制」行间距过高 | 收紧 section/block 间距，使用 `cameraSection`、`proCameraBlock`、`proMotionBlock` 等统一常量 |
| 2 | 画面语言/背景/样式命名未完全对齐 Figma | 左栏 section 标题 EN "Camera Control" → "Camera & Lighting"；右栏 Scene Background 增加 icon |
| 3 | 画布整体偏低，提示词框需同步向上扩 | 画布 minHeight 200→160，底部面板高度 240→280 |
| 4 | 右边栏「分镜背景图」行上下过宽 | 收紧 marginTop 与 row minHeight |

## 2. 命中文件

- `src/components/Sidebar.tsx`
- `src/features/pro-workspace/components/SceneEditorPanel.tsx`
- `src/features/pro-workspace/components/ProWorkspaceEditor.tsx`
- `src/features/pro-workspace/constants.ts`

## 3. 修改说明

### 3.1 左栏镜头控制间距 (Sidebar.tsx)

- 新增 `cameraSection`：使用 `editorTheme.spacing.labelToControl` 减少 padding，与 Figma 密度一致
- 新增 `proCameraBlock`：替代 `proDirectorBlock` 用于镜头控制区域，gap/margin/padding 使用 `labelToControl`
- 镜头控制区域改用 `cameraSection` + `proCameraBlock`
- `proMotionBlock`：gap 6→4，marginBottom 8→6，padding 8px→4px
- `proMotionPanel`：gap 12→6
- 专业运镜/画面语言 label 的 `marginBottom` 与 `fieldMarginBottom` 改为 `fieldMarginBottomCompact`、`labelToControl`

### 3.2 命名对齐 Figma (Sidebar.tsx, SceneEditorPanel.tsx)

- 左栏 EN 标题："Camera Control" → "Camera & Lighting"（与 Figma 一致）
- 右栏 Scene Background 增加 `icon={ImageIcon}`，与 Figma 设计一致

### 3.3 画布上移 + 提示词框扩展 (ProWorkspaceEditor.tsx, constants.ts)

- 画布 stage 区域 `minHeight`：200 → 160（释放一个 grid unit）
- `PRO_BOTTOM_PANEL_HEIGHT`：240 → 280，底部面板增高一个 grid unit

### 3.4 右栏分镜背景图行收紧 (SceneEditorPanel.tsx)

- 分镜背景参考图外层 `marginTop`：4 → 2
- 内层 row `minHeight`：32 → 28，与 `PRO_CONTROL_HEIGHT` 对齐

## 4. 影响确认

| 项目 | 结果 |
|------|------|
| Schema change | **no** |
| Engine change | **no** |
| Function logic change | **no** |

## 5. 验收摘要

**Stage:** UI Micro Fix Patch

**Fixed:**
- left rail camera spacing
- screen language / background / style naming alignment (Camera & Lighting, Scene Background icon)
- canvas moved up + prompt area expanded
- right rail storyboard background row spacing

**Schema change:** no  
**Engine change:** no  
**Function logic change:** no
