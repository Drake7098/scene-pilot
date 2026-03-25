# FigmaUI Design System Integration

本文档说明如何在项目中使用来自 `/Users/dk/scene-pilot/figmaUI` 的设计系统组件。

## 概述

我们已从 figmaUI 目录导入了一个完整的设计系统，包括：
- 设计令牌（颜色、字体、间距等）
- 可复用 UI 组件（Button, Card, Input, Select, Section, Sidebar）
- 统一的 CSS 样式系统

## 文件结构

```
src/
├── ui/
│   ├── components/
│   │   ├── Button.tsx       # 按钮组件
│   │   ├── Card.tsx         # 卡片组件
│   │   ├── Input.tsx        # 输入框组件
│   │   ├── Select.tsx       # 选择框组件
│   │   ├── Section.tsx      # 折叠分组组件
│   │   ├── Sidebar.tsx      # 侧边栏组件
│   │   └── index.ts         # 组件导出
│   └── design-tokens.ts     # 设计令牌
├── styles/
│   └── figma-ui.css         # FigmaUI 样式系统
└── utils/
    └── cn.ts                # className 合并工具
```

## 使用示例

### 1. Button 组件

```tsx
import { Button } from '@/ui/components';

// 默认按钮
<Button>点击</Button>

// 变体
<Button variant="default">主操作</Button>
<Button variant="secondary">次操作</Button>
<Button variant="outline">边框按钮</Button>
<Button variant="ghost">幽灵按钮</Button>
<Button variant="destructive">危险操作</Button>

// 尺寸
<Button size="sm">小按钮</Button>
<Button size="md">中按钮</Button>
<Button size="lg">大按钮</Button>
<Button size="icon" icon={SomeIcon} />
```

### 2. Card 组件

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/ui/components';

<Card>
  <CardHeader>
    <CardTitle>卡片标题</CardTitle>
    <CardDescription>卡片描述</CardDescription>
  </CardHeader>
  <CardContent>
    卡片内容
  </CardContent>
  <CardFooter>
    卡片底部
  </CardFooter>
</Card>
```

### 3. Input 组件

```tsx
import { Input } from '@/ui/components';

<Input
  type="text"
  placeholder="请输入..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### 4. Select 组件

```tsx
import { Select } from '@/ui/components';

<Select
  label="选择选项"
  options={[
    { label: '选项 1', value: '1' },
    { label: '选项 2', value: '2' },
    { label: '选项 3', value: '3', disabled: true },
  ]}
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
/>
```

### 5. Section 组件

```tsx
import { Section } from '@/ui/components';
import { Camera } from 'lucide-react';

<Section
  title="相机控制"
  icon={Camera}
  defaultOpen={true}
>
  {/* Section 内容 */}
</Section>
```

### 6. Sidebar 组件

```tsx
import { Sidebar, SidebarSection, SidebarItem } from '@/ui/components';
import { Video } from 'lucide-react';

<Sidebar>
  <SidebarSection title="场景列表">
    <SidebarItem
      icon={Video}
      label="场景 1"
      active={true}
      onClick={() => setActiveScene(1)}
    />
    <SidebarItem
      icon={Video}
      label="场景 2"
      onClick={() => setActiveScene(2)}
    />
  </SidebarSection>
</Sidebar>
```

### 7. 使用 CSS 类（直接使用样式）

```tsx
<div className="figma-ui">
  <button className="figma-btn figma-btn--default figma-btn--md">
    按钮
  </button>
  
  <input className="figma-input" placeholder="输入框" />
  
  <div className="figma-card">
    <div className="figma-card__header">
      <div className="figma-card__title">标题</div>
    </div>
  </div>
  
  <div className="figma-section">
    <div className="figma-section__header">
      <span className="figma-section__title">分组标题</span>
    </div>
    <div className="figma-section__content">
      内容
    </div>
  </div>
</div>
```

## 设计令牌

所有设计令牌都定义在 `src/ui/design-tokens.ts` 中：

### 颜色
- `colors.background` - 主背景色 `#1f2125`
- `colors.backgroundPanel` - 面板背景 `#24262b`
- `colors.accent` - 强调色 `#f59e0b`（琥珀色）
- `colors.textPrimary` - 主文本 `#e5e7eb`
- `colors.textSecondary` - 次要文本 `#9ca3af`

### 字体
- `typography.fontSize.xs/sm/base/lg` - 字号 (11px-14px)
- `typography.fontWeight.normal/medium/bold` - 字重 (400-700)

### 间距
- `spacing` - 完整间距标尺 (1px-8rem)

### 圆角
- `radius.sm/md/lg/xl` - 圆角大小 (6px-16px)

## CSS 变量

所有设计令牌都可通过 CSS 变量访问：

```css
.color {
  background: var(--figma-bg-panel);
  border: 1px solid var(--figma-border);
  color: var(--figma-text-primary);
}

.button {
  height: var(--figma-control-height-md);
  border-radius: var(--figma-radius-md);
  transition: var(--figma-transition-fast);
}
```

## 迁移指南

### 从旧组件迁移

**旧代码：**
```tsx
<button style={{ background: '#f59e0b', padding: '8px 16px' }}>
  按钮
</button>
```

**新代码：**
```tsx
<Button variant="default" size="md">
  按钮
</Button>
```

### 从硬编码样式迁移

**旧代码：**
```tsx
<div style={{ 
  background: '#24262b',
  border: '1px solid #3a3f46',
  borderRadius: '12px',
  padding: '16px'
}}>
  卡片内容
</div>
```

**新代码：**
```tsx
<Card>
  <CardContent>
    卡片内容
  </CardContent>
</Card>
```

或者使用 CSS 类：
```tsx
<div className="figma-card">
  <div className="figma-card__content">
    卡片内容
  </div>
</div>
```

## 最佳实践

1. **优先使用组件**：尽量使用封装好的 UI 组件，而不是直接使用 CSS 类
2. **保持一致性**：所有新 UI 应该使用 figmaUI 设计系统
3. **不要硬编码样式**：使用设计令牌和 CSS 变量
4. **响应式设计**：组件默认支持响应式
5. **无障碍访问**：组件内置基本的无障碍支持

## 依赖项

确保已安装以下依赖：

```json
{
  "lucide-react": "^0.263.1",
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0"
}
```

## 参考资料

- 原始设计系统：`/Users/dk/scene-pilot/figmaUI`
- Figma 设计稿：`src/design-reference/figma/app.tsx`
- 设计令牌：`src/ui/design-tokens.ts`
- 样式系统：`src/styles/figma-ui.css`
