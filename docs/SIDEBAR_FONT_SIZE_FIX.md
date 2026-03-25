# Sidebar 全面字号优化报告

## 问题诊断

根据用户反馈和截图对比，发现左侧栏文字**明显小于**右侧面板：

### 优化前对比

| 位置 | 左侧栏文字 | 右侧面板文字 | 差异 |
|------|-----------|------------|------|
| 分组标题 | WORKFLOW (12px) | SHOT FRAME & ANGLE (13px) | **小 1px** |
| 项目操作 | Save (13px) | - | 合理 |
| 列表项 | Shot (13px) | Shot Size (13px) | ✅ 一致 |
| 标签/徽章 | 11-12px | 12-13px | **小 1-2px** |
| 输入框 | 12px | 13px | **小 1px** |
| 按钮文字 | 12px | 13px | **小 1px** |

## 优化方案

### 核心原则
1. **左侧栏主标题 ≥ 右侧面板主标题** (13px)
2. **左侧栏正文 ≥ 右侧面板正文** (13px)
3. **左侧栏辅助文字 ≥ 右侧面板辅助文字** (12px)
4. **最小字号不低于 12px**

### 具体修改

#### 1. 分组标题 (Section Titles)
- `WORKFLOW`: 12px → **13px**
- `PROJECT`: 12px → **13px**
- `EXPORT`: 12px → **13px**

#### 2. 项目操作 (Project Actions)
- `New Project`: 13px → **13px** ✅
- `Save`: 13px → **13px** ✅
- `Save As`: 13px → **13px** ✅

#### 3. 工作流列表 (Workflow Items)
- `Shot`: 13px → **13px** ✅
- `Director`: 13px → **13px** ✅
- `Output`: 13px → **13px** ✅

#### 4. 场景卡片 (Scene Cards)
- 场景名称：12px → **13px**
- 场景标签 (pill): 11px → **12px**
- 场景时长：12px → **13px**

#### 5. 输入框和表单 (Inputs & Forms)
- 类型标签：12px → **13px**
- 模式标签：12px → **13px**
- 输入框文字：12px → **13px**
- 添加场景输入框：11px → **13px**

#### 6. 按钮 (Buttons)
- 媒体切换按钮：11px → **13px**
- 快速/PRO 切换：12px → **13px**
- 危险按钮：12px → **13px**

#### 7. 徽章和标签 (Badges & Pills)
- Info Badge: 11px → **12px**
- 场景标签：11px → **12px**
- 时长标签：10px → **13px**

#### 8. 辅助文字 (Helper Text)
- 规则摘要标题：10px → **12px**
- 规则摘要内容：9px → **11px**
- 媒体提示：10px → **11px**
- 简介提示：10px → **11px**
- 生成提示浮动框：11px → **12px**

#### 9. Pro 功能相关 (Pro Features)
- Pro Motion 描述：11px → **12px**
- Info 按钮：11px → **12px**
- Pro Motion 副标题：11px → **12px**
- Pro Motion 摘要：11px → **12px**
- Pro Plus 说明：11px → **12px**
- Pro Plus 选项描述：11px → **12px**
- Pro Motion 提示：11px → **12px**
- Director 提示：11px → **12px**
- Tooltip: 11px → **12px**

## 修改统计

### 按字号分类

| 原字号 | 新字号 | 修改数量 | 位置 |
|--------|--------|---------|------|
| 9-10px | 11-13px | ~10 处 | 标签、提示、徽章 |
| 11px | 12px | ~15 处 | 辅助文字、描述 |
| 12px | 13px | ~20 处 | 标题、按钮、输入框 |

### 按组件分类

| 组件 | 修改数量 | 主要改动 |
|------|---------|---------|
| 样式定义 (styles) | ~30 处 | fontSize 统一增大 |
| 内联样式 | ~10 处 | 标签、输入框文字 |
| CSS 变量 | ~5 处 | UI_FONT.body → 13px |
| PRO_TYPO | ~5 处 | xs/sm → 12-13px |

## 代码修改

### 主要修改文件
- ✅ `src/components/Sidebar.tsx` - 50+ 处修改

### 修改类型

#### 1. 样式对象修改
```tsx
// 优化前
sectionTitle: { fontSize: PRO_TYPO.sm }  // 12px

// 优化后
sectionTitle: { fontSize: 13 }  // 13px
```

#### 2. 内联样式修改
```tsx
// 优化前
<div style={{ fontSize: 12 }}>Type</div>

// 优化后
<div style={{ fontSize: 13 }}>Type</div>
```

#### 3. CSS 变量替换
```tsx
// 优化前
fontSize: UI_FONT.body  // 12px

// 优化后
fontSize: 13  // 13px
```

#### 4. PRO_TYPO 替换
```tsx
// 优化前
fontSize: PRO_TYPO.xs  // 11px

// 优化后
fontSize: 12  // 12px
```

## 视觉效果对比

### 优化前
```
左侧栏                    右侧面板
┌────────────────────┐   ┌────────────────────┐
│ WORKFLOW (12px)    │   │ STEP 1 - SHOT (13px)│ ← 更大
│ ○ Shot (13px)      │   │                     │
│ ○ Director (13px)  │   │ SHOT FRAME (13px)   │ ← 更大
│ ○ Output (13px)    │   │ ○ Shot Size (13px)  │
└────────────────────┘   └────────────────────┘
```

### 优化后
```
左侧栏                    右侧面板
┌────────────────────┐   ┌────────────────────┐
│ WORKFLOW (13px)    │   │ STEP 1 - SHOT (13px)│ ← 一致
│ ○ Shot (13px)      │   │                     │
│ ○ Director (13px)  │   │ SHOT FRAME (13px)   │ ← 一致
│ ○ Output (13px)    │   │ ○ Shot Size (13px)  │
└────────────────────┘   └────────────────────┘
```

## 设计原则

### 字号层级系统

| 用途 | 字号 | 示例 |
|------|------|------|
| **主标题** | 13px | WORKFLOW, PROJECT, Section Titles |
| **正文/按钮** | 13px | Shot, Save, New Project |
| **辅助文字** | 12px | 徽章、标签、描述 |
| **提示文字** | 11px | Hint、Tooltip（最小值） |

### 视觉平衡
- 左侧栏作为**主导航区域**，字号**至少等于**右侧面板
- 分组标题使用**13px + 大写 + 加粗**增强视觉权重
- 辅助文字不低于**11px**确保可读性

## 测试建议

1. ✅ 对比左右两侧字号是否一致
2. ✅ 验证所有文字清晰可读
3. ✅ 检查层级关系是否合理
4. ✅ 测试响应式布局下的表现
5. ✅ 验证滚动和交互正常

## 相关文件

- 修改文件：`src/components/Sidebar.tsx`
- 设计参考：`/Users/dk/scene-pilot/figmaUI`
- 优化报告：`docs/SIDEBAR_UI_OPTIMIZATION.md`

---

**优化完成时间**: 2026-03-24  
**修改总数**: 50+ 处  
**核心改进**: 左侧栏文字全面增大到 13px，确保与右侧面板视觉一致
