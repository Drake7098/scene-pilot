# Pro 工作台全部模块功能介绍

---

## 一、布局概览

Pro 工作台采用三栏布局：

| 区域 | 位置 | 组件 | 说明 |
|------|------|------|------|
| **左侧栏** | 左 | Sidebar | 项目、模板、场景、对象、策略、镜头 |
| **中央区** | 中 | Stage + Canvas Tabs + ExportPanel | 画布、分镜预览、提示词 |
| **右侧栏** | 右 | PropsPanel + Generate | 属性编辑、生成按钮 |

---

## 二、顶部栏（data-top）

| 元素 | 功能 |
|------|------|
| Logo | ScenePilotix / 场景领航 |
| 工作台 | 统一 Pro，无 Quick/Pro 切换 |
| 语言切换 | 中/EN |
| 账户入口 | 登录/注册 或 账户中心 |

---

## 三、左侧栏（Sidebar / pro-sidebar）

### 3.1 项目（Project）

| 功能 | 说明 |
|------|------|
| 保存项目… | 写入当前项目到保存平台 |
| 复制提示词 | 打开复制提示词流程 |
| 导出… | 打开导出弹窗 |
| 打开项目 | 从本地打开 JSON 项目文件 |
| 项目库 | 打开项目库 |
| 重命名项目 | 重命名当前项目 |
| 另存项目… | 另存为新项目 |

### 3.2 模板（Templates）

| 功能 | 说明 |
|------|------|
| **当前模板** | 显示当前项目应用的模板（标题、family/variant、category/domain、cost、apply mode），可回跳工作台、查看详情、更换模板 |
| 打开模板工作台 | 打开全屏模板工作台 |
| 最近使用 | 最近 3 个使用过的模板，点击直接应用 |
| 收藏 | 收藏的模板，点击直接应用 |

### 3.3 场景（Scenes）

| 功能 | 说明 |
|------|------|
| 场景卡片列表 | 显示所有分镜，点击切换当前分镜 |
| 场景命名 | 双击改名 |
| 场景时长 | 视频模式下可编辑 duration |
| 衔接方式 | 继承前一镜、过渡类型（cut / dissolve 等） |
| 添加场景 | + 按钮，受项目 shotPlan 限制 |
| 删除场景 | 每张卡片上的 - 按钮 |

### 3.4 连续性（Continuity）

| 功能 | 说明 |
|------|------|
| 连续摘要 | 连续 on/off、模板类型（网剧/动漫）、当前 scene / 总 scene |
| 承接关系 | 前镜、后镜、衔接方式、方向 |
| Carry-over | 角色、方向、镜头、背景 |
| 锚点摘要 | continuityId 列表 |
| 快速跳转 | 上一镜、下一镜 |

### 3.5 对象 / 图层（Layers / Objects）

| 功能 | 说明 |
|------|------|
| 对象列表 | 当前分镜内所有对象，点击选中 |
| 对象命名 | 双击改名 |
| 添加对象 | + 按钮 |
| 删除对象 | 每行 - 按钮 |
| 类型 / 模式 | 媒体类型、生成模式（Quick/Pro） |

### 3.6 场景策略（Scene Strategy）

| 功能 | 说明 |
|------|------|
| 入镜方向 | 连续视频时：N/NE/E/SE/S/SW/W/NW |
| 出镜方向 | 同上 |
| 对象继承 | 多镜时是否继承前一镜对象 |
| 预设 | 一键选择经典模式（手动/各预设） |
| 景别 / 构图 | shot（特写/中景/全景等） |
| 镜头运动 | 视频模式：movement |
| 导演级风格包 | Director Style Pack |
| 镜头语言 / 画面语言 | 视频：PRO+ 镜头语言；图片：画面语言（IMAGE_PRO 分类） |
| 衔接方式 | 多镜视频时的 transition |

### 3.7 镜头 · 光（Camera & Lighting）

| 功能 | 说明 |
|------|------|
| 光线时间 | 白天/黄昏/夜晚等 |
| 主光方向 | key_dir |
| 光线氛围 | mood |

---

## 四、中央区（Center）

### 4.1 Canvas Tab Bar（画布标签栏）

| 元素 | 功能 |
|------|------|
| 画布 | 当前分镜的布局画布（Stage） |
| 分镜资源 Tab | 每个生成结果（图片/视频）一个 Tab，可切换预览 |

### 4.2 Stage（画布）

| 功能 | 说明 |
|------|------|
| 对象框 | 拖拽、缩放、旋转 |
| 参考图 | 支持 localRef 缩略图 |
| 网格 | 扩展画布，支持负坐标 |
| 缩放 | 0.4x–2.5x |
| 视图信息 | 分辨率、缩放提示 |

### 4.3 分镜资源预览（Pro Asset Stage）

| 功能 | 说明 |
|------|------|
| 预览 | 图片/视频预览 |
| 元信息 | 标题、平台生成/我的 API、平台 |
| 菜单 | 下载、继续生成、删除 |

### 4.4 提示词区（ExportPanel / pro-prompt-zone）

| 功能 | 说明 |
|------|------|
| 提示词预览 | 实时编译的最终提示词 |
| 冲突提示 | 存在冲突时高亮，可跳转 |
| 复制 | 复制提示词 |
| 导出 | 打开导出弹窗 |

---

## 五、右侧栏（PropsPanel / pro-props-panel）

### 5.1 分镜背景（Scene Background）

| 功能 | 说明 |
|------|------|
| 预设 | 背景预设选择 |
| 自定义 | 自定义背景描述 |
| 分镜背景参考图 | 导入/管理背景参考图 |

### 5.2 对象属性（Object Properties）

| 功能 | 说明 |
|------|------|
| 类型 | 主体 / 道具等 |
| 形状 | rect / ellipse 等 |
| 外观 | look 描述 |
| 参考图 | identity / appearance / style 参考 |
| 外部提示词 | externalPrompt |
| 备注 | notes |
| 冲突检测 | 与导出冲突规则联动 |

### 5.3 对象构图（Composition）

| 功能 | 说明 |
|------|------|
| 时间轴切换 | t0 / t1（图片模式 t1 锁定） |
| 坐标 | x, y, w, h, rot |
| 关键帧 | 起止帧位置 |

### 5.5 平台模式（Platform Mode）

| 功能 | 说明 |
|------|------|
| 当前平台 | 目标平台选择，与导出同步 |
| 推荐平台 | 由模板 domain/category 推导 |
| 导出方式 | 仅提示词 / 提示词+参考图 |
| 结构提示 | 强度、坐标、抑制字面、自然语言镜头 |
| 参考图建议 | 有 refs 或 slots 时提示 |

### 5.6 底部插槽（bottomSlot）

| 功能 | 说明 |
|------|------|
| 生成源切换 | 平台生成 / 我的 API（需 BYO 权限） |
| 生成按钮 | 触发当前分镜生成 |

---

## 六、导出弹窗（Export Modal）

| 功能 | 说明 |
|------|------|
| 导出类型 | 提示词 TXT / 整个项目（含参考图） |
| 导出范围 | 当前分镜 / 连续序列 |
| 适用大模型 | 平台 Preset 选择 |
| 冲突解决 | 冲突列表与跳转 |

---

## 七、模板工作台（全屏覆盖）

| 模块 | 功能 |
|------|------|
| Header | 搜索、筛选（mediaType / storyPlan / ratio / domain / pricing）、关闭 |
| Sidebar | 分类导航（recommended / all / free / recent / favorites / category） |
| Grid | 网格/列表切换，卡片展示 600 模板 |
| Detail | 右侧详情、应用模式、使用按钮 |
| 应用模式 | 仅布局 / 布局+风格 / 完整应用 |

---

## 八、配套能力

| 能力 | 说明 |
|------|------|
| 项目菜单 | 顶部项目名点击，新建/打开/保存等 |
| 创建向导 | CreateWizard，新用户引导 |
| 计费 | credits、unlimited、同项目不重复扣点 |
| 冲突检测 | 导出前检测 scene/layer 冲突 |

---

## 九、组件与文件映射

| 模块 | 组件 | 文件 |
|------|------|------|
| 左侧栏 | Sidebar | `src/components/Sidebar.tsx` |
| 画布 | Stage | `src/components/Stage.tsx` |
| 右侧栏 | PropsPanel | `src/components/PropsPanel.tsx` |
| 提示词/导出 | ExportPanel | `src/components/ExportPanel.tsx` |
| 模板工作台 | TemplateWorkspace | `src/features/template-workspace/` |
| 可折叠区块 | ProCollapseSection | `src/components/pro-ui/ProCollapseSection.tsx` |
| 折叠状态 | useProCollapseSections | `src/hooks/useProCollapseSections.ts` |

---

*文档生成时间：基于当前代码库*
