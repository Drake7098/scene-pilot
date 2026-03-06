import fs from "node:fs";
import path from "node:path";

const inputDir = path.resolve(process.argv[2] || "tests/robots/artifacts/prompt-eval/stress-20260306/simulated");
const outDir = path.resolve(process.argv[3] || "tests/robots/artifacts/prompt-eval/stress-20260306/repaired");

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) {
  if (f.endsWith(".txt")) fs.rmSync(path.join(outDir, f), { force: true });
}

function parseUserActions(text) {
  const m = text.match(/user_actions:\s*(.+)/i);
  if (!m) return [];
  return String(m[1])
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
}

function hasMove(actions) {
  return actions.some((a) => /跑|快走|慢走|挪|移动|run|walk|jog|move/i.test(a));
}

function hasEat(actions) {
  return actions.some((a) => /吃|进食|喝|eat|drink/i.test(a));
}

function repairPrompt(text) {
  const actions = parseUserActions(text);
  const lines = text.split(/\r?\n/);

  let out = lines.filter((line) => {
    if (/add text overlay|ui overlay|center the hero subject/i.test(line)) return false;
    if (/动作改写：角色全程站立，双手空置，不做进食动作/.test(line)) return false;
    if (/Apply t0→t1 transition across the full/i.test(line) && /当前 t0=t1|static composition/i.test(text)) return false;
    return true;
  });

  if (hasMove(actions)) {
    out = out.map((line) =>
      /当前 t0=t1，整段 .*保持静止构图/.test(line)
        ? line.replace(/当前 t0=t1，整段 .*保持静止构图。?/, "根据用户动作，整段时长内完成位移与姿态变化。")
        : line,
    );
  }

  if (hasEat(actions)) {
    out = out.filter((line) => !/不做进食动作|禁止进食|双手空置|no eating/i.test(line));
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".txt")).sort();
for (const file of files) {
  const raw = fs.readFileSync(path.join(inputDir, file), "utf8");
  fs.writeFileSync(path.join(outDir, file), repairPrompt(raw));
}

console.log(`Repaired ${files.length} prompt files from ${inputDir} to ${outDir}`);
