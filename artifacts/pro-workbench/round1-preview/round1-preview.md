# Pro Workbench Round 1 Preview

- Samples: 8
- Images: 50%
- Videos: 50%
- Avg score: 100
- Image camera leak cases: none
- Image motion leak cases: none

## pro_round1_preview_001

- Title: 室内人像单主体
- Workspace: pro
- Media: image
- Engine: IM V5P
- Score: 100
- Engine passes: strip_image_video_scaffold, pro_structured
- Stripped image video scaffold: true
- Issues: none

### userInputRaw

室内人像，主体居中，背景干净，1:1，一个美女

### userIntentNormalized

室内单主体写实人像，人物居中，背景简洁，避免过度性感化。

### generatedPrompt

```text
Scene: 室内人像单主体。Style: realistic, cinematic natural light.

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 主体1（主体）：初始在中间中部，中近景，前景，年轻女性，深色上衣，写实自然, 保持主体居中，中景，前景，人物清晰；对象局部提示：人物大一些，背景干净（仅作用于 主体1）。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
```

### promptIssues

- none

## pro_round1_preview_002

- Title: 双人争执顿悟
- Workspace: pro
- Media: video
- Engine: VI V5P
- Score: 100
- Engine passes: pro_structured, video_heading_normalization
- Stripped image video scaffold: false
- Issues: none

### userInputRaw

两个人在房间里吵起来，一个男的要爆发，左边一个美女一直解释

### userIntentNormalized

室内双人对峙，男性情绪升级，女性在左侧解释，保持双人相对位置。

### generatedPrompt

```text
Scene: 双人争执顿悟（3秒）。Style: realistic, cinematic natural light.

镜头:
- 单机位，保持镜头与构图一致。
- 不自动推拉镜头，不自动换角度。
- 在 3 秒时长内完成 t0→t1 变化。
- 主要主体保持可识别。
- 在 3 秒内按 T0→T1 完成变化。

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。
- 用语言描述变化：左右位移 / 远近变化 / 尺寸增减 / 轻微转向。
- 中背景密度：远景阈值 h<0.08。

主体:
- 主体1（主体）：初始在中间中部，中近景，前景，年轻男性，深色外套, 情绪突然要爆发，保持中间中部，中景，前景；对象局部提示：快要吵起来（仅作用于 主体1）。
- 主体2（主体）：初始在左中中部，中近景，前景，年轻女性，浅色上衣, 左中中部，中景，前景，一直在解释；对象局部提示：保持自然写实，不要过度性感化（仅作用于 主体2）。

动作:
- 主体1（主体）：结束保持原位，距离与尺度稳定。
- 主体2（主体）：向右向下移动。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
- 强化前中后分离，禁止压平空间深度。
```

### promptIssues

- none

## pro_round1_preview_003

- Title: 产品静物冲突样本
- Workspace: pro
- Media: image
- Engine: IM V5P
- Score: 100
- Engine passes: strip_image_video_scaffold, pro_structured
- Stripped image video scaffold: true
- Issues: none

### userInputRaw

产品静物，近景，背景极简，1:1，同时要大场景远景感，还要镜头推近

### userIntentNormalized

产品静物近景，背景极简，以主体清晰和构图稳定优先，压制冲突镜头词。

### generatedPrompt

```text
Scene: 产品静物冲突样本。Style: realistic, cinematic natural light.

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 产品（主体）：初始在中间中部，中近景，前景，玻璃瓶护肤品，极简质感, 居中近景，保留台面留白，不新增物体；对象局部提示：产品大一些，品牌感，极简背景（仅作用于 产品）。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
```

### promptIssues

- none

## pro_round1_preview_004

- Title: 赛博女主海报
- Workspace: quick
- Media: image
- Engine: IM v5
- Score: 100
- Engine passes: strip_image_video_scaffold, quick_compaction
- Stripped image video scaffold: true
- Issues: none

### userInputRaw

赛博风女主，靠左站位，霓虹光，16:9

### userIntentNormalized

赛博风单主体海报，人物偏左，霓虹环境光，横幅构图。

### generatedPrompt

```text
Scene: 赛博女主海报。Style: realistic, cinematic natural light.

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 主体1（主体）：初始在左中中部，中近景，前景，短发女性，赛博风夹克，霓虹边缘光, 左侧站位，中景，前景，海报感；对象局部提示：人物稍大，背景压简（仅作用于 主体1）。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
```

### promptIssues

- none

## pro_round1_preview_005

- Title: 街头夜景双主体
- Workspace: quick
- Media: video
- Engine: VI V5
- Score: 100
- Engine passes: quick_compaction
- Stripped image video scaffold: false
- Issues: none

### userInputRaw

街头夜景，双主体，前后景分离，16:9

### userIntentNormalized

街头夜景双主体，前后景层次明确，保持人物数量和相对位置。

### generatedPrompt

```text
Scene: 街头夜景双主体（4秒）。Style: realistic, cinematic natural light.

镜头:
- 单机位，保持镜头与构图一致。
- 不自动推拉镜头，不自动换角度。
- 当前 t0=t1，整段 4 秒保持静止构图，不自动添加位移/缩放。

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 主体1（主体）：初始在右中中部，中近景，前景，男性，黑色夹克, 前景偏右，情绪紧张；对象局部提示：前景更清晰（仅作用于 主体1）。
- 主体2（主体）：初始在左中中部，中景，前景，女性，浅色风衣, 中景偏左，保持与主体1分离；对象局部提示：人物关系紧张（仅作用于 主体2）。

动作:
- 主体1（主体）：结束保持原位，距离与尺度稳定。
- 主体2（主体）：结束保持原位，距离与尺度稳定。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
- 强化前中后分离，禁止压平空间深度。
```

### promptIssues

- none

## pro_round1_preview_006

- Title: 海报感竖版人物
- Workspace: quick
- Media: video
- Engine: VI V5
- Score: 100
- Engine passes: quick_compaction
- Stripped image video scaffold: false
- Issues: none

### userInputRaw

海报感构图，人物大一些，背景压简，9:16

### userIntentNormalized

竖版海报式单主体，人物占比更大，背景简洁，结构优先。

### generatedPrompt

```text
Scene: 海报感竖版人物（4秒）。Style: realistic, cinematic natural light.

镜头:
- 单机位，保持镜头与构图一致。
- 不自动推拉镜头，不自动换角度。
- 当前 t0=t1，整段 4 秒保持静止构图，不自动添加位移/缩放。

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 主体1（主体）：初始在中间中部，中近景，前景，年轻女性，黑色长风衣, 前景大主体，构图稳定；对象局部提示：人物更大，背景更干净（仅作用于 主体1）。

动作:
- 主体1（主体）：结束保持原位，距离与尺度稳定。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
```

### promptIssues

- none

## pro_round1_preview_007

- Title: 有冲突的连续镜头
- Workspace: pro
- Media: video
- Engine: VI V5P
- Score: 100
- Engine passes: pro_structured, video_heading_normalization
- Stripped image video scaffold: false
- Issues: none

### userInputRaw

人物全程站着别动，但又要快速冲向镜头，连续镜头，别切

### userIntentNormalized

连续镜头单主体，优先保留对象身份和空间关系，显式处理动作冲突。

### generatedPrompt

```text
Scene: 有冲突的连续镜头（5秒）。Style: realistic, cinematic natural light.

镜头:
- 单机位，保持镜头与构图一致。
- 不自动推拉镜头，不自动换角度。
- 在 5 秒时长内完成 t0→t1 变化。
- 主要主体保持可识别。

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。

主体:
- 主体1（主体）：初始在中间中部，中近景，前景，年轻男性，衬衫, 保持主体清晰，不要漂移；对象局部提示：先站住，再轻微靠近镜头（仅作用于 主体1）。

动作:
- 主体1（主体）：尺寸增大。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
```

### promptIssues

- none

## pro_round1_preview_008

- Title: 多对象室内层次
- Workspace: pro
- Media: image
- Engine: IM V5P
- Score: 100
- Engine passes: strip_image_video_scaffold, pro_structured
- Stripped image video scaffold: true
- Issues: none

### userInputRaw

室内复杂层次，多对象构图，桌上有书和杯子，人物坐在后面

### userIntentNormalized

室内多对象构图，前景桌面物件，后方人物，层次清楚。

### generatedPrompt

```text
Scene: 多对象室内层次。Style: realistic, cinematic natural light.

布局:
- 保持对象顺序和前中后层级，不要自动重排。
- 用画面占比表达远近，保持大小层级。
- 中等背景密度：保持层次均衡，不挤压深度。
- 中背景密度：远景阈值 h<0.08。

主体:
- 物件1（道具）：初始在左中偏下，全景，背景，一本打开的书, 前景左侧桌面。
- 物件2（道具）：初始在中间偏下，全景，前景，白色陶瓷杯, 前景右侧桌面。
- 主体1（主体）：初始在中间中部，中近景，前景，年轻女性，坐姿, 后方中景，保持可识别；对象局部提示：人物不要太小（仅作用于 主体1）。

负向约束:
- 不自动居中，不做对称构图，不重排队列。
- 不强行把任何对象变成主角。
- 保持层级关系与相对顺序。
- 强化前中后分离，禁止压平空间深度。
```

### promptIssues

- none

