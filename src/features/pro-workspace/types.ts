/**
 * Pro Workspace UI v1 - Type definitions
 * Workflow order: shot → director → output → camera_lang → scene_bg → objects → lighting → style → tech
 */

export type ProWorkspaceSection =
  // ── 新工作流顺序 ─────────────────────────────
  | "shot"           // 1. 镜头（景别 / 运动 / 时长）
  | "director"       // 2. 导演风格（影响结构字段，不直接输出名字）
  | "output"         // 3. 输出类型（image / video）
  | "camera_lang"    // 4. 镜头语言
  | "scene_bg"       // 5. 场景 & 背景
  | "objects"        // 6. 对象
  | "lighting"       // 7. 灯光
  | "style"          // 8. 风格
  | "tech"           // 9. 技术
  // ── 工具面板（保留，收至底部）─────────────────
  | "composition"
  | "constraints"
  | "prompt_preview"
  | "generate_settings"
  | "export"
  | "platform"
  | "scene";  // legacy alias
