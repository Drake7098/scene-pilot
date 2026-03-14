# 行业拍摄手法总库 - 主文档（Unified Technique Master）

## 1. 一级分类总览

| 一级分类 | 说明 | 文档 |
|----------|------|------|
| shot_size | 景别 | shot-size-taxonomy.md |
| camera_angle | 镜头角度 | camera-angle-taxonomy.md |
| camera_movement | 镜头运动 | camera-movement-taxonomy.md |
| camera_language | 镜头语言（三层） | camera-language-taxonomy.md |
| lighting | 布光方案 | lighting-taxonomy.md |
| composition | 构图 | composition-taxonomy.md |
| continuity_transition | 连续性与转场 | continuity-transition-taxonomy.md |
| commercial_product | 商业/产品 | commercial-product-taxonomy.md |
| anime_animation | 动漫/动画 | anime-animation-taxonomy.md |

## 2. 全部 canonical_id 与 Phase 1 级别

### shot_size（11 项）
| canonical_id | Phase 1 |
|--------------|---------|
| ecu, cu, mcu, ms, mls, fs, ls, xls, insert_closeup, over_shoulder, pov | core_user 多数 / template_default 部分 |

### camera_angle（7 项）
| canonical_id | Phase 1 |
|--------------|---------|
| eye_level, low_angle, high_angle, top_down | core_user |
| aerial_rise | template_default |
| dutch_angle, worm_eye | advanced_hidden |

### camera_movement（18 项）
| canonical_id | Phase 1 |
|--------------|---------|
| static, slow_push_in, slow_pull_out, fast_push, fast_pull | core_user / template_default |
| pan_left, pan_right, tilt_up, tilt_down, move_left, move_right | core_user |
| follow_front, follow_back, side_follow, orbit_left, orbit_right, handheld | core_user |
| crane_up | template_default / advanced_hidden |

### camera_language（35 项）
| 层级 | canonical_id | Phase 1 |
|------|--------------|---------|
| Layer 1 | realistic_restrained, commercial_ad, cinematic_narrative, dialogue_cover, product_quality, social_direct, emotional_pressure, suspense_atmosphere, anime_dramatic, premium_blockbuster | core_user |
| Layer 2 | cinematic_soft, cinematic_dark, cinematic_wide, ad_luxury, ad_clean, drama_tension, drama_close, suspense_observe, thriller_lowkey, noir_shadow, product_glossy, product_dark, anime_dynamic, anime_pose, anime_battle, hero_entry, reveal_focus, emotional_peak, handheld_real, documentary, neon_city, studio_highkey, studio_lowkey, luxury_light, rim_light_focus | template_default |
| Layer 3 | 50+（未展开） | engine_only |

### lighting（28 项）
| 类型 | canonical_id | Phase 1 |
|------|--------------|---------|
| 基础 | day, sunset, golden_hour, blue_hour, night, top_left, top_right, backlight, rim_light, warm, cold, bright, cinematic, mysterious | core_user |
| 方案 | natural_skin_readability, low_key_edge_separation, rim_scale_separation, soft_layered_breathing, premium_focal_highlights | core_user |
| 扩展 | action_path_readability, noir_shadow, studio_highkey, studio_lowkey, ecommerce_white, anime_high_contrast, neon_urban | template_default |

### composition（17 项）
| canonical_id | Phase 1 |
|--------------|---------|
| center_pressure, depth_split, clean_layering, eyeline_tension, material_focus, cinematic_air, symmetry, rule_of_thirds | core_user |
| left_right_standoff, asymmetry | core_user |
| foreground_occlusion, environment_wrap, subject_env_link, glass_glow, dream_haze, silhouette_rim, suspense_cold | template_default |

### continuity_transition（18 项）
| canonical_id | Phase 1 |
|--------------|---------|
| cut, dissolve, reverse_angle | core_user |
| camera_continues, time_jump, match_cut, same_space_shift | template_default |
| morph_cut, doorframe_wipe, light_dissolve | advanced_hidden |
| character_carry_over, direction_carry_over, camera_carry_over, bg_carry_over, identity_only | template_default |
| entry_dir, exit_dir, inherit_from_previous | core_user |

### commercial_product（14 项）
| canonical_id | Phase 1 |
|--------------|---------|
| hero_center, glossy_detail, white_bg_ecommerce, clean_testimonial, packshot, in_hand_usage, insert_closeup | core_user |
| hero_floating, premium_spotlight, cta_visual_close, lifestyle_demo, app_ui_showcase, product_compare, feature_breakdown | template_default |

### anime_animation（15 项）
| canonical_id | Phase 1 |
|--------------|---------|
| dramatic_pose | core_user |
| speed_line_equivalent, anime_hero_entry, battle_reveal, expression_shift, impact_closeup, flashback_transition, villain_pressure, power_up_release, anime_high_contrast, burst_closeup, skill_release, squad_formation, hype_peak | template_default |
| manga_panel_rhythm | advanced_hidden |

## 3. Phase 1 统计

| 级别 | 数量（估算） | 说明 |
|------|-------------|------|
| **core_user** | ~85 | 用户直接可选/必选 |
| **template_default** | ~95 | 模板自动带入，用户可改 |
| **advanced_hidden** | ~12 | 高级模板/隐藏能力 |
| **engine_only** | 50+ | 底层完整库，Phase 1 不展开 |

## 4. 总量估算

| 一级分类 | 手法项数 |
|----------|----------|
| shot_size | 11 |
| camera_angle | 7 |
| camera_movement | 18 |
| camera_language | 35（Layer 1+2）+ 50+（Layer 3） |
| lighting | 28 |
| composition | 17 |
| continuity_transition | 18 |
| commercial_product | 14 |
| anime_animation | 15 |
| **合计（Phase 1 展开）** | **~163** |
| **含 Layer 3 底层** | **~213+** |

## 5. 适合用户层的项

- 景别：cu, mcu, ms, fs, ls, ecu, insert_closeup, over_shoulder, pov
- 角度：eye_level, low_angle, high_angle, top_down
- 运动：static, slow_push_in, slow_pull_out, pan_*, tilt_*, follow_*, orbit_*, handheld
- 镜头语言：Layer 1 全部 10 项
- 布光：time/key_dir/mood 基础 + 6 个 lighting_profile
- 构图：center_pressure, depth_split, clean_layering, eyeline_tension, material_focus, cinematic_air, symmetry, rule_of_thirds
- 转场：cut, dissolve, reverse_angle
- 商业：hero_center, glossy_detail, white_bg_ecommerce, packshot, in_hand_usage 等
- 动漫：dramatic_pose

## 6. 适合模板层的项

- Layer 2 镜头语言 25 项
- 扩展 lighting_profile（noir, studio, ecommerce, anime, neon）
- 扩展构图（foreground_occlusion, environment_wrap 等）
- 转场（camera_continues, match_cut 等）
- 商业扩展（hero_floating, cta_visual_close 等）
- 动漫扩展（battle_reveal, power_up_release 等）

## 7. 必须隐藏的项

- camera_language Layer 2（模板内使用，用户显示为 Layer 1 映射）
- dutch_angle, worm_eye, crane_up
- morph_cut, doorframe_wipe, light_dissolve
- manga_panel_rhythm
- camera_language Layer 3 全部

## 8. 下一步建议

1. **进入现有系统字段映射比对**：对照 prompt-engine-inventory-full.md、template-system-inventory-full.md，明确哪些 canonical_id 已有实现、哪些缺失。
2. **camera_language 接入 prompt**：当前 camera_language 仅 marker 存储，未进 prompt；需在 formatScenePrompt / compileV2 中接入。
3. **lighting 方案库产品化**：将 lighting_profile 扩展项纳入 UI 选择器或模板默认。
4. **commercial / anime 专属模板**：基于 commercial-product 与 anime-animation 分类扩充模板库。
