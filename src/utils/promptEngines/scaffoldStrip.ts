/**
 * scaffoldStrip.ts
 * 移除提示词中的脚手架标记，减少对模型的干扰
 */

/**
 * 去掉 V2 执行脚手架标记，不对模型产生任何价值
 */
export function stripExecutionScaffold(text: string): { text: string; passes: string[] } {
  const lines = text.split("\n");
  const out: string[] = [];
  let constraintInjected = false;

  for (const line of lines) {
    const t = line.trim();
    if (!t) { out.push(line); continue; }

    if (/^你将根据以下分镜结构生成/.test(t)) continue;
    if (/^Generate .* visuals following the storyboard/i.test(t)) continue;
    if (/^【平台执行协议：/.test(t)) continue;
    if (/^\[Platform Execution Contract:/i.test(t)) continue;
    if (/^要求：严格遵守/.test(t)) continue;
    if (/^Requirements?: strictly/i.test(t)) continue;
    if (/^优先级：/.test(t)) continue;
    if (/^Priority:/i.test(t)) continue;

    if (/^硬约束：/.test(t) || /^Hard constraints?:/i.test(t)) {
      if (!constraintInjected) {
        out.push("Constraint: 保持对象数量、身份、位置，不增删主体，不重排构图。");
        constraintInjected = true;
      }
      continue;
    }
    if (/^通用策略：/.test(t) || /^General strategy:/i.test(t)) continue;
    if (/^输出策略：/.test(t) || /^Output policy:/i.test(t)) continue;
    if (/^Conflict policy:/i.test(t) || /^冲突处理：/.test(t)) continue;

    if (/^【语言强化层】/.test(t)) continue;
    if (/^\[LRL\]/i.test(t)) continue;
    if (/^—\s*当前分镜：/.test(t)) continue;
    if (/^Global：$/.test(t) || /^Global:$/.test(t)) continue;

    if (/^【坐标\/锚点】/.test(t)) continue;
    if (/^【坐标】/.test(t)) continue;
    if (/^\[Coords\/Anchor\]/i.test(t)) continue;
    if (/^【约束】/.test(t)) continue;
    if (/^【视频】t0→t1/.test(t)) continue;
    if (/^坐标数字仅作内部控制/.test(t)) continue;

    if (/^（系统追加结构控制层）/.test(t)) continue;
    if (/^（系统结构控制层）/.test(t)) continue;
    if (/^\(system structural control layer\)/i.test(t)) continue;

    if (/^负向约束[:：]?\s*$/.test(t)) continue;
    if (/^Negative constraints?[:：]?\s*$/i.test(t)) continue;
    if (/^约束：保持指定构图/.test(t)) continue;

    if (/^起点t0[:：]/.test(t)) continue;
    if (/^终点t1[:：]/.test(t)) continue;
    if (/^Start t0[:：]/i.test(t)) continue;
    if (/^End t1[:：]/i.test(t)) continue;
    if (/^-\s*layer\d+\s*$/.test(t)) continue;
    if (/^主体\(type\)：/.test(t)) continue;
    if (/^Subject\(type\):/i.test(t)) continue;

    // platformGuide 追加过滤
    if (/^硬约束：必须保持/.test(t)) continue;
    if (/^Hard constraints?: preserve/.test(t)) continue;
    if (/^冲突处理：若用户自由文案/.test(t)) continue;
    if (/^Conflict policy: if free-form/.test(t)) continue;
    if (/^通用策略：使用清晰分段/.test(t)) continue;
    if (/^Universal: use clear sections/.test(t)) continue;
    if (/^输出策略：先结构后风格/.test(t)) continue;
    if (/^Output policy: structure first/.test(t)) continue;
    if (/^优先级：$/.test(t)) continue;
    if (/^Priority:$/.test(t)) continue;
    if (/^【平台执行协议：/.test(t)) continue;
    if (/^\[Platform Execution Contract:/i.test(t)) continue;

    out.push(line);
  }

  const next = out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text: next, passes: next === text.trim() ? [] : ["strip_execution_scaffold"] };
}

/**
 * 去掉 V2 编译脚手架标记
 */
export function stripCompileScaffold(text: string): string {
  return text
    .replace(/^\[V2 SCENEPILOT COMPILE\]\n?/m, "")
    .replace(/\n?\[END\]$/m, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
