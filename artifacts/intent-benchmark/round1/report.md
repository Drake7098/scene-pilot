# Intent Benchmark Report (round1)

- Total cases: 10000
- Overall weighted score: 77.65

## Field Accuracy
- mediaType: 92.42% (weight 0.18)
- goal: 87.95% (weight 0.16)
- subjectCount: 14.03% (weight 0.15)
- framing: 100.00% (weight 0.14)
- backgroundDensity: 81.56% (weight 0.12)
- ratio: 100.00% (weight 0.08)
- location: 85.01% (weight 0.06)
- style.genre: 74.73% (weight 0.05)
- style.lighting: 68.63% (weight 0.04)
- scene.timeOfDay: 73.46% (weight 0.02)

## Split Scores
- basic: 78.01%
- extended: 81.21%
- noise: 81.23%
- professional: 74.28%
- adversarial: 77.00%
- longtail: 64.35%

## Top Failure Signatures
- subjectCount: 1842
- style.lighting|subjectCount: 924
- style.genre|subjectCount: 633
- scene.timeOfDay|subjectCount: 572
- backgroundDensity|subjectCount: 415
- location|subjectCount: 378
- backgroundDensity|style.lighting|subjectCount: 301
- style.genre|style.lighting|subjectCount: 301
- goal|scene.timeOfDay|subjectCount: 212
- scene.timeOfDay|style.genre|subjectCount: 210

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
- 2 -> 4: 3889
- 1 -> 4: 3345
- 4 -> 4: 1403
- 3 -> 4: 1363

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
- [basic_00002] split=basic mismatch=location, style.genre, subjectCount
  - brief: 做一张图，场景图，双主体，城市街头，构图平衡，背景干净，横屏，cyberpunk风格，backlight光线，室内光。
- [basic_00003] split=basic mismatch=subjectCount
  - brief: 做一张图，情绪海报，双主体，户外自然，主体偏右，背景正常，横屏，realistic风格，neon光线，白天。
- [basic_00004] split=basic mismatch=subjectCount
  - brief: make an image, scene image, single subject, indoor, balanced framing, normal background complexity, ratio 16:9, cinematic style with soft lighting, night.
- [basic_00005] split=basic mismatch=location, subjectCount
  - brief: make an image, portrait, single subject, city street, subject on the left, normal background complexity, ratio 1:1, cinematic style with soft lighting, indoor lighting.
- [basic_00006] split=basic mismatch=style.lighting, subjectCount
  - brief: 做一张图，人像，单主体，室内，主体偏右，背景干净，横屏，realistic风格，low-key光线，室内光。
- [basic_00007] split=basic mismatch=location, subjectCount
  - brief: 做一张图，情绪海报，单主体，通用场景，主体居中，背景干净，竖屏，cinematic风格，backlight光线，室内光。
- [basic_00008] split=basic mismatch=location, style.lighting, subjectCount
  - brief: 做一张图，人像，双主体，城市街头，主体偏右，背景干净，1:1，anime风格，low-key光线，室内光。
- [basic_00009] split=basic mismatch=style.genre, subjectCount
  - brief: make an image, ad key visual, single subject, outdoor nature, subject on the left, normal background complexity, ratio 1:1, cyberpunk style with neon lighting, daylight.
- [basic_00010] split=basic mismatch=backgroundDensity, style.lighting, subjectCount
  - brief: 做一个6秒视频，人像，单主体，城市街头，主体居中，背景细节丰富，横屏，realistic风格，low-key光线，时间不限。
- [basic_00011] split=basic mismatch=backgroundDensity, style.lighting, subjectCount
  - brief: 做一张图，场景图，单主体，室内，主体偏左，背景细节丰富，横屏，cinematic风格，low-key光线，夜景。
- [basic_00012] split=basic mismatch=scene.timeOfDay, style.genre, subjectCount
  - brief: 做一张图，情绪海报，单主体，室内，主体偏右，背景干净，1:1，cyberpunk风格，daylight光线，时间不限。
- [basic_00013] split=basic mismatch=subjectCount
  - brief: 做一张图，广告主视觉，单主体，室内，主体居中，背景正常，竖屏，anime风格，daylight光线，白天。
- [basic_00014] split=basic mismatch=style.lighting, subjectCount
  - brief: 做一张图，场景图，单主体，城市街头，主体居中，背景正常，1:1，cinematic风格，soft光线，时间不限。
- [basic_00015] split=basic mismatch=style.genre, subjectCount
  - brief: make an image, storyframe reference, single subject, city street, subject on the left, dense background details, ratio 1:1, cyberpunk style with neon lighting, night.
- [basic_00016] split=basic mismatch=location, style.lighting, subjectCount
  - brief: 做一张图，广告主视觉，双主体，户外自然，主体偏左，背景干净，竖屏，realistic风格，low-key光线，室内光。
- [basic_00017] split=basic mismatch=backgroundDensity, style.genre, subjectCount
  - brief: 做一张图，分镜参考图，单主体，室内，主体偏左，背景细节丰富，横屏，cyberpunk风格，neon光线，白天。
- [basic_00018] split=basic mismatch=backgroundDensity, style.lighting, subjectCount
  - brief: 做一张图，场景图，单主体，城市街头，构图平衡，背景细节丰富，1:1，realistic风格，soft光线，时间不限。
- [basic_00019] split=basic mismatch=subjectCount
  - brief: make an image, storyframe reference, single subject, outdoor nature, subject on the right, normal background complexity, ratio 16:9, cinematic style with neon lighting, night.
- [basic_00020] split=basic mismatch=scene.timeOfDay, subjectCount
  - brief: make an image, scene image, single subject, indoor, subject on the left, normal background complexity, ratio 16:9, realistic style with daylight lighting, time flexible.