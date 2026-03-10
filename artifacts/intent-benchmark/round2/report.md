# Intent Benchmark Report (round2)

- Total cases: 10000
- Overall weighted score: 89.17

## Field Accuracy
- mediaType: 92.42% (weight 0.18)
- goal: 87.95% (weight 0.16)
- subjectCount: 82.39% (weight 0.15)
- framing: 100.00% (weight 0.14)
- backgroundDensity: 81.56% (weight 0.12)
- ratio: 100.00% (weight 0.08)
- location: 85.01% (weight 0.06)
- style.genre: 100.00% (weight 0.05)
- style.lighting: 68.63% (weight 0.04)
- scene.timeOfDay: 73.46% (weight 0.02)

## Split Scores
- basic: 91.93%
- extended: 91.64%
- noise: 91.75%
- professional: 84.83%
- adversarial: 87.48%
- longtail: 74.90%

## Top Failure Signatures
- style.lighting: 1210
- scene.timeOfDay: 707
- subjectCount: 628
- backgroundDensity: 626
- backgroundDensity|style.lighting: 462
- location: 440
- location|style.lighting: 277
- goal|scene.timeOfDay: 266
- scene.timeOfDay|style.lighting: 240
- scene.timeOfDay|subjectCount: 199

## Top Confusion
### mediaType
- image -> image: 8890
- video -> image: 758
- video -> video: 352

### goal
- ad -> ad: 1830
- scene -> scene: 1788
- portrait -> portrait: 1767
- poster -> poster: 1705
- storyframe -> storyframe: 1705
- scene -> unknown: 146
- poster -> unknown: 145
- storyframe -> unknown: 140

### subjectCount
- 1 -> 1: 3345
- 2 -> 2: 2128
- 2 -> 4: 1761
- 4 -> 4: 1403
- 3 -> 3: 1363

### framing
- center -> center: 2542
- left -> left: 2510
- balanced -> balanced: 2489
- right -> right: 2459

### backgroundDensity
- clean -> clean: 3355
- normal -> normal: 3290
- rich -> normal: 1844
- rich -> rich: 1511

## Typical Failures
- [basic_00001] split=basic mismatch=subjectCount
  - brief: make an image, scene image, two subjects, city street, subject on the left, normal background complexity, ratio 9:16, anime style with neon lighting, night.
- [basic_00002] split=basic mismatch=location
  - brief: 做一张图，场景图，双主体，城市街头，构图平衡，背景干净，横屏，cyberpunk风格，backlight光线，室内光。
- [basic_00005] split=basic mismatch=location
  - brief: make an image, portrait, single subject, city street, subject on the left, normal background complexity, ratio 1:1, cinematic style with soft lighting, indoor lighting.
- [basic_00006] split=basic mismatch=style.lighting
  - brief: 做一张图，人像，单主体，室内，主体偏右，背景干净，横屏，realistic风格，low-key光线，室内光。
- [basic_00007] split=basic mismatch=location
  - brief: 做一张图，情绪海报，单主体，通用场景，主体居中，背景干净，竖屏，cinematic风格，backlight光线，室内光。
- [basic_00008] split=basic mismatch=location, style.lighting
  - brief: 做一张图，人像，双主体，城市街头，主体偏右，背景干净，1:1，anime风格，low-key光线，室内光。
- [basic_00010] split=basic mismatch=backgroundDensity, style.lighting
  - brief: 做一个6秒视频，人像，单主体，城市街头，主体居中，背景细节丰富，横屏，realistic风格，low-key光线，时间不限。
- [basic_00011] split=basic mismatch=backgroundDensity, style.lighting
  - brief: 做一张图，场景图，单主体，室内，主体偏左，背景细节丰富，横屏，cinematic风格，low-key光线，夜景。
- [basic_00012] split=basic mismatch=scene.timeOfDay
  - brief: 做一张图，情绪海报，单主体，室内，主体偏右，背景干净，1:1，cyberpunk风格，daylight光线，时间不限。
- [basic_00014] split=basic mismatch=style.lighting
  - brief: 做一张图，场景图，单主体，城市街头，主体居中，背景正常，1:1，cinematic风格，soft光线，时间不限。
- [basic_00016] split=basic mismatch=location, style.lighting
  - brief: 做一张图，广告主视觉，双主体，户外自然，主体偏左，背景干净，竖屏，realistic风格，low-key光线，室内光。
- [basic_00017] split=basic mismatch=backgroundDensity
  - brief: 做一张图，分镜参考图，单主体，室内，主体偏左，背景细节丰富，横屏，cyberpunk风格，neon光线，白天。
- [basic_00018] split=basic mismatch=backgroundDensity, style.lighting
  - brief: 做一张图，场景图，单主体，城市街头，构图平衡，背景细节丰富，1:1，realistic风格，soft光线，时间不限。
- [basic_00020] split=basic mismatch=scene.timeOfDay
  - brief: make an image, scene image, single subject, indoor, subject on the left, normal background complexity, ratio 16:9, realistic style with daylight lighting, time flexible.
- [basic_00022] split=basic mismatch=style.lighting
  - brief: 做一张图，场景图，单主体，室内，主体偏右，背景干净，竖屏，cyberpunk风格，low-key光线，室内光。
- [basic_00024] split=basic mismatch=backgroundDensity
  - brief: 做一张图，分镜参考图，单主体，户外自然，构图平衡，背景细节丰富，横屏，realistic风格，daylight光线，白天。
- [basic_00025] split=basic mismatch=scene.timeOfDay, style.lighting
  - brief: 做一张图，场景图，单主体，室内，主体偏右，背景正常，竖屏，cinematic风格，low-key光线，时间不限。
- [basic_00026] split=basic mismatch=location, subjectCount
  - brief: make an image, scene image, two subjects, city street, subject centered, normal background complexity, ratio 16:9, cyberpunk style with soft lighting, indoor lighting.
- [basic_00028] split=basic mismatch=style.lighting
  - brief: make an image, portrait, single subject, indoor, balanced framing, clean background, ratio 9:16, cinematic style with low-key lighting, night.
- [basic_00029] split=basic mismatch=location, style.lighting, subjectCount
  - brief: make an image, portrait, two subjects, outdoor nature, subject on the left, dense background details, ratio 1:1, cyberpunk style with low-key lighting, indoor lighting.