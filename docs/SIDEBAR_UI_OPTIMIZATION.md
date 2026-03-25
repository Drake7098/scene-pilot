# Sidebar UI 优化报告

## 问题分析

对比标准设计（figmaUI）和当前状态，发现以下问题：

1. **左侧栏文字偏小** - 使用 10-11px 字号，明显小于右侧面板的 12-13px
2. **边框过多** - 每个 Section 都有独立边框，造成视觉混乱
3. **视觉层级偏低** - 左侧栏作为高级导航区域，视觉权重应至少与右侧面板同级

## 优化方案

### 1. 增大字号到与右侧同级

| 元素 | 优化前 | 优化后 |
|------|--------|--------|
| Section 标题 | 12px (PRO_TYPO.sm) | **13px** |
| 项目名称 | 11px (PRO_TYPO.xs) | **13px** |
| 项目操作按钮 | 12px | **13px** |
| 场景卡片名称 | 12px | **13px** |
| 场景卡片标签 (pill) | 9px | **11px** |
| 场景时长输入 | 10px | **12px** |
| 模式标签 | 11px | **13px** |
| Pro Motion 描述 | 11px | **12px** |
| Info 按钮 | 11px | **12px** |
| Pro Motion 副标题 | 11px | **12px** |
| Pro Motion 摘要 | 11px | **12px** |
| Pro Plus 说明 | 11px | **12px** |
| Pro Plus 选项描述 | 11px | **12px** |
| Pro Motion 提示 | 11px | **12px** |
| Director 提示 | 11px | **12px** |
| Tooltip | 11px | **12px** |
| 模式选择提示框 | 11px | **12px** |

### 2. 去掉多余边框

**优化前**：
- 每个 Section 都有 `border-bottom: 1px solid var(--pro-border)`
- 场景卡片标签有边框：`border: 1px solid var(--pro-border)`
- 模式提示框有边框：`border: 1px solid ${ec.border}`
- 场景时长标签有背景框

**优化后**：
- ✅ 只保留左侧栏右边框：`border-right: 1px solid var(--pro-border)`
- ✅ 去掉所有 Section 之间的边框
- ✅ 去掉场景卡片标签的边框和背景
- ✅ 简化模式提示框，去掉边框和背景

### 3. 增强视觉层级

**优化措施**：
- 增加左侧栏宽度：`252px` → **`260px`**
- 增加内边距：`UI_SPACE.sm (12px)` → **`16px 12px`**
- 增加 Section 间距：`14px` → **`20px`**
- 添加阴影效果：`boxShadow: "var(--pro-shadow-md)"`
- 标题使用大写字母：`textTransform: "uppercase"`
- 调整字母间距：`letterSpacing: 0.1` → **`0.05`**

## 具体修改

### Sidebar 容器
```tsx
wrap: {
  width: "clamp(260px, 26vw, 320px)",  // 增加最小宽度
  borderRight: "1px solid var(--pro-border)",  // 只保留大区域边框
  padding: "16px 12px",  // 增加内边距
  gap: 20,  // 增加 Section 间距
  boxShadow: "var(--pro-shadow-md)"  // 添加阴影增强层级
}
```

### Section 组件
```tsx
section: {
  border: "none",  // 去掉边框
  borderRadius: "none",  // 去掉圆角
  padding: "0"  // 去掉内边距
}
```

### Section 标题
```tsx
sectionTitle: {
  fontSize: 13,  // 从 12px 增大到 13px
  letterSpacing: 0.05,  // 优化字间距
  textTransform: "uppercase"  // 大写增强视觉
}
```

### 项目操作按钮
```tsx
projectAction: {
  fontSize: 13,  // 从 12px 增大到 13px
  padding: "8px 10px"  // 增加内边距
}
projectActionSep: {
  background: "transparent"  // 去掉分隔线
}
```

### 场景卡片标签
```tsx
sceneCardPill: {
  fontSize: 11,  // 从 9px 增大到 11px
  padding: "3px 8px",  // 增加内边距
  background: "transparent",  // 去掉背景
  border: "none",  // 去掉边框
  color: "var(--pro-text-muted)"
}
```

### CSS 全局 Section 样式
```css
.pro-section {
  border-bottom: none;  // 去掉底部边框
}

.pro-section-header {
  padding: 10px 12px;  // 增加内边距
  gap: 8px;
}

.pro-section-title {
  fontSize: 13px;  // 增大字号
  letter-spacing: 0.05em;
}

.pro-section-content {
  padding: 0 12px 12px 12px;  // 优化内边距
}
```

## 视觉效果对比

### 优化前
```
┌─────────────────────┐
│ PROJECT      (11px) │ ← 字太小
├─────────────────────┤ ← 多余边框
│ ○ New Project       │
│ ○ Open Project      │
├─────────────────────┤ ← 多余边框
│ WORKFLOW     (12px) │ ← 字较小
├─────────────────────┤ ← 多余边框
│ ○ Shot              │
│ ○ Director          │
└─────────────────────┘
```

### 优化后
```
┌─────────────────────┐
│ PROJECT      (13px) │ ← 字号适中
│                     │
│   New Project       │
│   Open Project      │
│                     │ ← 无多余边框
│ WORKFLOW     (13px) │ ← 字号一致
│                     │
│   Shot              │
│   Director          │
└─────────────────────┘
  ↑ 右边框 + 阴影增强层级
```

## 设计依据

所有优化都基于 `/Users/dk/scene-pilot/figmaUI` 设计系统：

1. **字体大小**：参考 `theme.css` 中的字体层级
   - 标题：13px (Figma: text-base)
   - 正文：12-13px (Figma: text-base)
   - 辅助文字：11-12px (Figma: text-sm)

2. **边框使用**：参考 Figma 设计稿
   - 只保留主要区域分隔边框
   - Section 之间使用留白分隔
   - 避免过度使用边框造成视觉混乱

3. **视觉层级**：参考 SceneMaker 设计
   - 左侧栏作为主导航区域，视觉权重应高于右侧属性面板
   - 使用宽度、内边距、阴影增强视觉存在感

## 测试建议

1. ✅ 检查所有文字是否清晰可读
2. ✅ 验证 Section 展开/收起功能正常
3. ✅ 确认项目操作、场景列表交互正常
4. ✅ 测试响应式布局（宽度变化）
5. ✅ 验证滚动行为正常

## 文件修改

- ✅ `src/components/Sidebar.tsx` - 主要修改文件
- ✅ `src/index.css` - 更新全局 Section 样式

## 下一步

1. 运行 `npm run dev` 预览效果
2. 根据实际视觉效果微调字号和间距
3. 将同样的优化应用到 PropsPanel（右侧面板）
4. 统一整个应用的字体层级系统

---

**优化完成时间**: 2026-03-24  
**设计标准**: `/Users/dk/scene-pilot/figmaUI`  
**优化目标**: 增大字号、简化边框、增强视觉层级
