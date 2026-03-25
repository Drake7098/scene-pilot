# FigmaUI 设计系统 - 快速开始

## 🎯 一句话总结

基于 `/Users/dk/scene-pilot/figmaUI` 的完整设计系统，提供一致的 UI 组件和样式规范。

## 📦 快速使用

### 1. 导入组件

```tsx
import { Button, Card, Input, Section } from '@/ui/components';
```

### 2. 使用组件

```tsx
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    <Input placeholder="输入..." />
    <Button>提交</Button>
  </CardContent>
</Card>
```

## 📚 完整文档

- **使用指南**: [`docs/figma-ui-components.md`](docs/figma-ui-components.md)
- **整合报告**: [`docs/FIGMA_UI_INTEGRATION.md`](docs/FIGMA_UI_INTEGRATION.md)
- **完成总结**: [`docs/FIGMA_UI_COMPLETE.md`](docs/FIGMA_UI_COMPLETE.md)
- **代码示例**: [`src/ui/examples.tsx`](src/ui/examples.tsx)

## 🎨 核心组件

| 组件 | 描述 |
|------|------|
| `Button` | 按钮（5 种变体，4 种尺寸） |
| `Card` | 卡片容器（Header, Content, Footer） |
| `Input` | 输入框 |
| `Select` | 选择框 |
| `Section` | 可折叠分组 |
| `Sidebar` | 侧边栏 |

## 🎯 设计令牌

所有设计令牌都在 [`src/ui/design-tokens.ts`](src/ui/design-tokens.ts) 中定义：

```tsx
import { colors, typography, spacing } from '@/ui/design-tokens';

// 或使用 CSS 变量
// var(--figma-bg), var(--figma-accent), etc.
```

## 🎨 颜色方案

| 用途 | 色值 |
|------|------|
| 背景 | `#1f2125` |
| 面板 | `#24262b` |
| 边框 | `#3a3f46` |
| 文本 | `#e5e7eb` |
| 强调色 | `#f59e0b` |

## ✅ 特点

- ✅ 基于 figmaUI/shadcn/ui 设计
- ✅ 完整 TypeScript 支持
- ✅ 响应式设计
- ✅ 无障碍访问支持
- ✅ 零运行时开销
- ✅ 与现有代码兼容

## 🚀 立即开始

查看 [`src/ui/examples.tsx`](src/ui/examples.tsx) 了解完整示例！
