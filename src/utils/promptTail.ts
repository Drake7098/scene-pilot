export type PromptTailSplit = {
  main: string;
  notes: string;
};

function isHardMarker(line: string): boolean {
  const t = (line ?? "").trim();
  if (!t) return false;
  const low = t.toLowerCase();

  if (t.includes("以下为机器语言")) return true;
  if (t.startsWith("（以下为机器语言")) return true;
  if (t.includes("系统结构控制层")) return true;
  if (t.includes("系统追加结构控制层")) return true;
  if (low.includes("machine notes")) return true;
  if (low.includes("system structural control layer")) return true;
  if (/系统.*结构.*控制层/.test(t)) return true;
  if (/system.*structural.*control.*layer/i.test(t)) return true;
  return false;
}

function isTailSignal(line: string): boolean {
  const t = (line ?? "").trim();
  if (!t) return false;
  const low = t.toLowerCase();

  if (/^【系统稳定层/.test(t)) return true;
  if (/^\[stability layer/i.test(t)) return true;
  if (/^【坐标/.test(t)) return true;
  if (/^\[coords/i.test(t)) return true;
  if (t.includes("坐标数字仅作内部控制")) return true;
  if (low.includes("control metadata")) return true;
  if (t.includes("输出策略：先结构后风格")) return true;
  if (low.includes("output policy: structure first")) return true;
  return false;
}

function findFallbackSplitIndex(lines: string[]): number {
  const signals = lines
    .map((line, idx) => (isTailSignal(line) ? idx : -1))
    .filter((idx) => idx >= 0);

  if (signals.length < 2) return -1;

  for (const idx of signals) {
    if (idx <= 0) continue;

    const before = lines.slice(Math.max(0, idx - 2), idx);
    const hasBoundaryGap = before.some((line) => !(line ?? "").trim());
    if (!hasBoundaryGap) continue;

    const tail = lines.slice(idx);
    const tailSignals = tail.filter((line) => isTailSignal(line)).length;
    const tailNonEmpty = tail.filter((line) => (line ?? "").trim()).length;
    if (tailSignals >= 2 && tailNonEmpty >= 3) return idx;
  }

  const threshold = Math.floor(lines.length * 0.45);
  for (const idx of signals) {
    if (idx >= threshold) return idx;
  }

  return -1;
}

export function splitMachineNotes(allText: string): PromptTailSplit {
  const text = allText ?? "";
  const lines = text.split("\n");
  const markerIndex = lines.findIndex((line) => isHardMarker(line));
  const splitIndex = markerIndex >= 0 ? markerIndex : findFallbackSplitIndex(lines);

  if (splitIndex < 0) return { main: text.trimEnd(), notes: "" };

  const main = lines.slice(0, splitIndex).join("\n").trimEnd();
  const notes = lines.slice(splitIndex).join("\n").trimEnd();
  return { main, notes };
}
