#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = path.resolve(__dirname, "../docs/development-tracker.json");
const BOARD_PATH = path.resolve(__dirname, "../docs/development-board.md");

const STATUS_ORDER = ["active", "testing", "blocked", "backlog", "done", "archived"];

function loadTracker() {
  const raw = fs.readFileSync(TRACKER_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || !Array.isArray(parsed.items)) {
    throw new Error(`Invalid tracker data: ${TRACKER_PATH}`);
  }
  return parsed;
}

function normalizeText(text) {
  return String(text ?? "").replace(/\|/g, "\\|").trim();
}

function sortItems(items) {
  const statusIdx = new Map(STATUS_ORDER.map((s, idx) => [s, idx]));
  const prioIdx = new Map(["p0", "p1", "p2", "p3"].map((s, idx) => [s, idx]));
  return [...items].sort((a, b) => {
    const sa = statusIdx.get(a.status) ?? 99;
    const sb = statusIdx.get(b.status) ?? 99;
    if (sa !== sb) return sa - sb;
    const pa = prioIdx.get(a.priority) ?? 99;
    const pb = prioIdx.get(b.priority) ?? 99;
    if (pa !== pb) return pa - pb;
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function renderTable(items) {
  if (!items.length) return "_无_";
  const lines = [
    "| ID | 优先级 | 类型 | 工作台 | 测试 | 进度 | 提醒 | 触发 | 标题 | 标签 |",
    "|---|---|---|---|---|---:|---:|---|---|---|"
  ];
  for (const item of items) {
    const tags = Array.isArray(item.tags) && item.tags.length ? item.tags.join(", ") : "-";
    const reminders = Array.isArray(item.reminders)
      ? item.reminders.filter((it) => it.status === "pending").length
      : 0;
    const notifyStatus = Array.isArray(item.notifyRules?.status) && item.notifyRules.status.length
      ? item.notifyRules.status.join(",")
      : "-";
    const notifyTest = Array.isArray(item.notifyRules?.testStatus) && item.notifyRules.testStatus.length
      ? item.notifyRules.testStatus.join(",")
      : "-";
    const notify = `${notifyStatus}${notifyTest !== "-" ? ` | test:${notifyTest}` : ""}`;
    lines.push(
      `| ${normalizeText(item.id)} | ${normalizeText(item.priority)} | ${normalizeText(item.type)} | ${normalizeText(item.workspace)} | ${normalizeText(item.testStatus)} | ${Number(item.progress || 0)} | ${reminders} | ${normalizeText(notify)} | ${normalizeText(item.title)} | ${normalizeText(tags)} |`
    );
  }
  return lines.join("\n");
}

function sectionTitle(status) {
  if (status === "active") return "进行中（Active）";
  if (status === "testing") return "测试中（Testing）";
  if (status === "blocked") return "阻塞（Blocked）";
  if (status === "backlog") return "待开发（Backlog）";
  if (status === "done") return "已完成（Done）";
  return "归档（Archived）";
}

function renderBoard(tracker) {
  const items = sortItems(tracker.items);
  const unreadAlerts = Array.isArray(tracker.alerts)
    ? tracker.alerts.filter((it) => !it.read).length
    : 0;
  const dueReminders = items
    .flatMap((item) => (Array.isArray(item.reminders) ? item.reminders : []))
    .filter((reminder) => reminder.status === "pending" && Number(new Date(reminder.at)) <= Date.now()).length;
  const lines = [
    "# Development Board（全局进度看板）",
    "",
    `更新时间：${tracker.updatedAt || ""}`,
    "",
    "说明：这个文件由 `docs/development-tracker.json` 自动生成，用于快速查看全局进度与测试状态。",
    "",
    `未读提醒：${unreadAlerts} ｜到期待触发提醒：${dueReminders}`,
    ""
  ];

  for (const status of STATUS_ORDER) {
    const group = items.filter((item) => item.status === status);
    if (!group.length) continue;
    lines.push(`## ${sectionTitle(status)}`);
    lines.push("");
    lines.push(renderTable(group));
    lines.push("");
  }

  lines.push("## 快速录入模板");
  lines.push("");
  lines.push("当你只想一句话加任务，直接发我：");
  lines.push("`加入待开发：<一句话>`");
  lines.push("");
  lines.push("当你要加提醒时，直接发我：");
  lines.push("`给 TK-xxxx 增加提醒：<时间> <内容>`");
  lines.push("");
  lines.push("当你要加触发通知时，直接发我：");
  lines.push("`给 TK-xxxx 设置触发：完成提醒，测试失败提醒`");
  lines.push("");
  lines.push("例如：");
  lines.push("`加入待开发：接入 Runway 视频生成 API，走 Pro hosted 主链路`");
  lines.push("");
  return lines.join("\n");
}

const tracker = loadTracker();
const content = renderBoard(tracker);
fs.writeFileSync(BOARD_PATH, `${content}\n`, "utf8");
console.log(`Rendered board: ${BOARD_PATH}`);
