#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRACKER_PATH = path.resolve(__dirname, "../docs/development-tracker.json");

const STATUSES = new Set(["backlog", "active", "blocked", "testing", "done", "archived"]);
const TEST_STATUSES = new Set(["none", "planned", "running", "passed", "failed"]);
const PRIORITIES = new Set(["p0", "p1", "p2", "p3"]);
const TYPES = new Set(["feature", "api", "infra", "bug", "test", "ux", "prompt", "ops", "docs"]);
const WORKSPACES = new Set(["quick", "pro", "global"]);
const STATUS_ORDER = ["active", "testing", "blocked", "backlog", "done", "archived"];

function nowIso() {
  return new Date().toISOString();
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseCsv(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumber(value, fallback = 0) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseArgs(args) {
  const positionals = [];
  const flags = {};
  let i = 0;
  while (i < args.length) {
    const token = args[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        flags[key] = true;
        i += 1;
      }
      continue;
    }
    positionals.push(token);
    i += 1;
  }
  return { positionals, flags };
}

function assertInSet(name, value, allowed) {
  if (!allowed.has(value)) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function loadTracker() {
  if (!fs.existsSync(TRACKER_PATH)) {
    return {
      version: 1,
      updatedAt: nowIso(),
      alerts: [],
      items: []
    };
  }
  const raw = fs.readFileSync(TRACKER_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid tracker file: ${TRACKER_PATH}`);
  }
  const items = ensureArray(parsed.items).map(normalizeItem);
  const alerts = ensureArray(parsed.alerts);
  return {
    version: Number(parsed.version || 1),
    updatedAt: String(parsed.updatedAt || nowIso()),
    alerts,
    items
  };
}

function saveTracker(tracker) {
  tracker.updatedAt = nowIso();
  fs.writeFileSync(TRACKER_PATH, `${JSON.stringify(tracker, null, 2)}\n`, "utf8");
}

function normalizeItem(item) {
  const normalized = { ...item };
  normalized.id = String(normalized.id || "");
  normalized.title = String(normalized.title || "");
  normalized.status = String(normalized.status || "backlog");
  normalized.type = String(normalized.type || "feature");
  normalized.priority = String(normalized.priority || "p1");
  normalized.workspace = String(normalized.workspace || "global");
  normalized.owner = String(normalized.owner || "dk");
  normalized.testStatus = String(normalized.testStatus || "none");
  normalized.progress = parseNumber(normalized.progress, 0);
  normalized.tags = ensureArray(normalized.tags).map((tag) => String(tag).trim()).filter(Boolean);
  normalized.createdAt = String(normalized.createdAt || nowIso());
  normalized.updatedAt = String(normalized.updatedAt || normalized.createdAt || nowIso());
  normalized.notes = ensureArray(normalized.notes).map((note) => ({
    at: String(note?.at || normalized.updatedAt),
    text: String(note?.text || "")
  }));
  normalized.reminders = ensureArray(normalized.reminders).map((reminder) => ({
    id: String(reminder?.id || newReminderId()),
    at: String(reminder?.at || normalized.updatedAt),
    message: String(reminder?.message || "任务提醒"),
    status: String(reminder?.status || "pending"),
    sentAt: reminder?.sentAt ? String(reminder.sentAt) : undefined,
    doneAt: reminder?.doneAt ? String(reminder.doneAt) : undefined
  }));
  normalized.notifyRules = {
    status: ensureArray(normalized.notifyRules?.status).map((s) => String(s).trim()).filter(Boolean),
    testStatus: ensureArray(normalized.notifyRules?.testStatus).map((s) => String(s).trim()).filter(Boolean)
  };
  if (!normalized.notifyRules.status.length && !normalized.notifyRules.testStatus.length) {
    normalized.notifyRules.status = ["done"];
  }
  return normalized;
}

function newAlertId() {
  return `AL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function newReminderId() {
  return `RM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getStatusRank(status) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 99;
}

function getPriorityRank(priority) {
  const map = { p0: 0, p1: 1, p2: 2, p3: 3 };
  return map[priority] ?? 99;
}

function sortItems(items) {
  return [...items].sort((a, b) => {
    const sr = getStatusRank(a.status) - getStatusRank(b.status);
    if (sr !== 0) return sr;
    const pr = getPriorityRank(a.priority) - getPriorityRank(b.priority);
    if (pr !== 0) return pr;
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });
}

function matches(item, flags) {
  if (flags.status && item.status !== flags.status) return false;
  if (flags.type && item.type !== flags.type) return false;
  if (flags.workspace && item.workspace !== flags.workspace) return false;
  if (flags.owner && item.owner !== flags.owner) return false;
  if (flags.test && item.testStatus !== flags.test) return false;
  if (flags.tag) {
    const expectedTags = parseCsv(flags.tag);
    const tagSet = new Set(item.tags);
    for (const tag of expectedTags) {
      if (!tagSet.has(tag)) return false;
    }
  }
  if (flags.q) {
    const q = String(flags.q).toLowerCase();
    const haystack = [item.id, item.title, item.workspace, item.type, item.priority, item.status, ...item.tags].join(" ").toLowerCase();
    if (!haystack.includes(q)) return false;
  }
  return true;
}

function printItemLine(item) {
  const reminderPending = ensureArray(item.reminders).filter((r) => r.status === "pending").length;
  console.log(
    `${item.id} [${item.status}] ${item.priority}/${item.type}/${item.workspace} test=${item.testStatus} progress=${item.progress}% reminders=${reminderPending} ${item.title}`
  );
}

function formatItem(item) {
  const summary = {
    id: item.id,
    title: item.title,
    status: item.status,
    type: item.type,
    priority: item.priority,
    workspace: item.workspace,
    owner: item.owner,
    testStatus: item.testStatus,
    progress: item.progress,
    tags: item.tags,
    notifyRules: item.notifyRules,
    reminders: item.reminders,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    notes: item.notes
  };
  return JSON.stringify(summary, null, 2);
}

function findItem(tracker, id) {
  const item = tracker.items.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Task not found: ${id}`);
  }
  return item;
}

function pushNote(item, text) {
  if (!text) return;
  item.notes.push({ at: nowIso(), text: String(text) });
}

function pushAlert(tracker, alert) {
  tracker.alerts.push({
    id: newAlertId(),
    at: nowIso(),
    read: false,
    ...alert
  });
}

function applyStatusTrigger(tracker, item, fromStatus, toStatus) {
  if (fromStatus === toStatus) return;
  if (!item.notifyRules.status.includes(toStatus)) return;
  pushAlert(tracker, {
    source: "status-trigger",
    level: toStatus === "blocked" ? "warn" : "info",
    itemId: item.id,
    title: `任务状态触发：${item.title}`,
    message: `${item.id} 状态从 ${fromStatus} 变更为 ${toStatus}`
  });
}

function applyTestTrigger(tracker, item, fromTest, toTest) {
  if (fromTest === toTest) return;
  if (!item.notifyRules.testStatus.includes(toTest)) return;
  pushAlert(tracker, {
    source: "test-trigger",
    level: toTest === "failed" ? "warn" : "info",
    itemId: item.id,
    title: `测试状态触发：${item.title}`,
    message: `${item.id} 测试状态从 ${fromTest} 变更为 ${toTest}`
  });
}

function generateTaskId(tracker) {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const day = `${y}${m}${d}`;
  const prefix = `TK-${day}-`;
  const currentMax = tracker.items
    .map((item) => item.id)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0);
  const seq = String(currentMax + 1).padStart(3, "0");
  return `${prefix}${seq}`;
}

function normalizeIso(value) {
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) {
    throw new Error(`Invalid date time: ${value}`);
  }
  return ts.toISOString();
}

function commandSummary(tracker) {
  const byStatus = {};
  const byType = {};
  const byTest = {};
  for (const item of tracker.items) {
    byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    byType[item.type] = (byType[item.type] || 0) + 1;
    byTest[item.testStatus] = (byTest[item.testStatus] || 0) + 1;
  }
  const now = Date.now();
  const duePendingReminders = tracker.items
    .flatMap((item) => ensureArray(item.reminders).map((reminder) => ({ itemId: item.id, reminder })))
    .filter(({ reminder }) => reminder.status === "pending" && new Date(reminder.at).getTime() <= now).length;
  const unreadAlerts = ensureArray(tracker.alerts).filter((alert) => !alert.read).length;
  console.log(`items=${tracker.items.length} updatedAt=${tracker.updatedAt}`);
  console.log(`status=${JSON.stringify(byStatus)}`);
  console.log(`type=${JSON.stringify(byType)}`);
  console.log(`test=${JSON.stringify(byTest)}`);
  console.log(`duePendingReminders=${duePendingReminders}`);
  console.log(`unreadAlerts=${unreadAlerts}`);
}

function commandList(tracker, flags) {
  const filtered = sortItems(tracker.items).filter((item) => matches(item, flags));
  if (flags.json) {
    console.log(JSON.stringify(filtered, null, 2));
    return;
  }
  if (!filtered.length) {
    console.log("No tasks matched.");
    return;
  }
  for (const item of filtered) {
    printItemLine(item);
  }
}

function commandNext(tracker, flags) {
  const limit = Math.max(1, parseNumber(flags.limit, 5));
  const queue = sortItems(
    tracker.items.filter((item) => item.status !== "done" && item.status !== "archived")
  );
  const sliced = queue.slice(0, limit);
  if (!sliced.length) {
    console.log("No active backlog items.");
    return;
  }
  for (const item of sliced) {
    printItemLine(item);
  }
}

function commandShow(tracker, id) {
  const item = findItem(tracker, id);
  console.log(formatItem(item));
}

function commandAdd(tracker, title, flags) {
  if (!title) throw new Error("Usage: add <title> [--type --priority --workspace ...]");
  const type = String(flags.type || "feature");
  const priority = String(flags.priority || "p1");
  const workspace = String(flags.workspace || "global");
  const status = String(flags.status || "backlog");
  const testStatus = String(flags.test || "none");
  assertInSet("type", type, TYPES);
  assertInSet("priority", priority, PRIORITIES);
  assertInSet("workspace", workspace, WORKSPACES);
  assertInSet("status", status, STATUSES);
  assertInSet("testStatus", testStatus, TEST_STATUSES);

  const item = normalizeItem({
    id: generateTaskId(tracker),
    title,
    status,
    type,
    priority,
    workspace,
    owner: String(flags.owner || "dk"),
    testStatus,
    progress: Math.min(100, Math.max(0, parseNumber(flags.progress, status === "done" ? 100 : 0))),
    tags: parseCsv(flags.tags),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    notes: [],
    reminders: [],
    notifyRules: {
      status: parseCsv(flags["notify-status"] || "done"),
      testStatus: parseCsv(flags["notify-test"])
    }
  });
  pushNote(item, flags.note);

  if (flags["remind-at"]) {
    item.reminders.push({
      id: newReminderId(),
      at: normalizeIso(flags["remind-at"]),
      message: String(flags["remind-msg"] || `${item.id}：${item.title}`),
      status: "pending"
    });
  }

  tracker.items.push(item);
  saveTracker(tracker);
  console.log(`Created task: ${item.id}`);
  printItemLine(item);
}

function commandMove(tracker, id, nextStatus, flags) {
  assertInSet("status", nextStatus, STATUSES);
  const item = findItem(tracker, id);
  const prevStatus = item.status;
  item.status = nextStatus;
  if (flags.progress !== undefined) {
    item.progress = Math.min(100, Math.max(0, parseNumber(flags.progress, item.progress)));
  } else if (nextStatus === "done") {
    item.progress = 100;
  }
  pushNote(item, flags.note);
  item.updatedAt = nowIso();
  applyStatusTrigger(tracker, item, prevStatus, nextStatus);
  saveTracker(tracker);
  console.log(`Moved ${id}: ${prevStatus} -> ${nextStatus}`);
}

function commandTest(tracker, id, nextTestStatus, flags) {
  assertInSet("testStatus", nextTestStatus, TEST_STATUSES);
  const item = findItem(tracker, id);
  const prevTestStatus = item.testStatus;
  item.testStatus = nextTestStatus;
  if (flags.progress !== undefined) {
    item.progress = Math.min(100, Math.max(0, parseNumber(flags.progress, item.progress)));
  }
  pushNote(item, flags.note);
  item.updatedAt = nowIso();
  applyTestTrigger(tracker, item, prevTestStatus, nextTestStatus);
  saveTracker(tracker);
  console.log(`Updated test status ${id}: ${prevTestStatus} -> ${nextTestStatus}`);
}

function commandNote(tracker, id, text) {
  if (!text) throw new Error("Usage: note <id> <text>");
  const item = findItem(tracker, id);
  pushNote(item, text);
  item.updatedAt = nowIso();
  saveTracker(tracker);
  console.log(`Note added: ${id}`);
}

function commandNotify(tracker, id, flags) {
  const item = findItem(tracker, id);
  if (!flags.status && !flags.test) {
    console.log(JSON.stringify(item.notifyRules, null, 2));
    return;
  }
  const statusRules = flags.status ? parseCsv(flags.status) : item.notifyRules.status;
  const testRules = flags.test ? parseCsv(flags.test) : item.notifyRules.testStatus;
  for (const status of statusRules) assertInSet("notify status", status, STATUSES);
  for (const test of testRules) assertInSet("notify test status", test, TEST_STATUSES);
  item.notifyRules = { status: statusRules, testStatus: testRules };
  item.updatedAt = nowIso();
  saveTracker(tracker);
  console.log(`Notify rules updated: ${id}`);
}

function commandRemind(tracker, args, flags) {
  const sub = args[0] || "list";
  if (sub === "list") {
    const filterId = flags.id;
    const dueOnly = Boolean(flags.due);
    const status = flags.status ? String(flags.status) : undefined;
    const reminders = [];
    const now = Date.now();
    for (const item of tracker.items) {
      if (filterId && item.id !== filterId) continue;
      for (const reminder of ensureArray(item.reminders)) {
        if (status && reminder.status !== status) continue;
        const due = new Date(reminder.at).getTime() <= now;
        if (dueOnly && !due) continue;
        reminders.push({
          itemId: item.id,
          itemTitle: item.title,
          reminderId: reminder.id,
          at: reminder.at,
          due,
          status: reminder.status,
          message: reminder.message
        });
      }
    }
    reminders.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    if (flags.json) {
      console.log(JSON.stringify(reminders, null, 2));
      return;
    }
    if (!reminders.length) {
      console.log("No reminders matched.");
      return;
    }
    for (const reminder of reminders) {
      console.log(
        `${reminder.reminderId} item=${reminder.itemId} due=${reminder.due ? "yes" : "no"} status=${reminder.status} at=${reminder.at} ${reminder.message}`
      );
    }
    return;
  }

  if (sub === "add") {
    const id = args[1];
    if (!id) throw new Error("Usage: remind add <id> --at <time> [--msg <message>]");
    if (!flags.at) throw new Error("Missing --at for remind add");
    const item = findItem(tracker, id);
    const reminder = {
      id: newReminderId(),
      at: normalizeIso(flags.at),
      message: String(flags.msg || `${item.id}：${item.title}`),
      status: "pending"
    };
    item.reminders.push(reminder);
    item.updatedAt = nowIso();
    saveTracker(tracker);
    console.log(`Reminder added: ${id} ${reminder.id}`);
    return;
  }

  if (sub === "done") {
    const id = args[1];
    const reminderId = args[2];
    if (!id || !reminderId) throw new Error("Usage: remind done <id> <reminderId>");
    const item = findItem(tracker, id);
    const reminder = item.reminders.find((entry) => entry.id === reminderId);
    if (!reminder) throw new Error(`Reminder not found: ${reminderId}`);
    reminder.status = "done";
    reminder.doneAt = nowIso();
    item.updatedAt = nowIso();
    saveTracker(tracker);
    console.log(`Reminder marked done: ${id} ${reminderId}`);
    return;
  }

  throw new Error("Usage: remind <list|add|done> ...");
}

function commandCheck(tracker, flags) {
  const now = Date.now();
  const generated = [];
  for (const item of tracker.items) {
    for (const reminder of ensureArray(item.reminders)) {
      if (reminder.status !== "pending") continue;
      if (new Date(reminder.at).getTime() > now) continue;
      reminder.status = "sent";
      reminder.sentAt = nowIso();
      const alert = {
        source: "time-reminder",
        level: "info",
        itemId: item.id,
        title: `时间提醒：${item.title}`,
        message: reminder.message
      };
      pushAlert(tracker, alert);
      generated.push(alert);
    }
  }

  if (flags.ack === "all") {
    for (const alert of tracker.alerts) {
      alert.read = true;
      alert.readAt = nowIso();
    }
  } else if (typeof flags.ack === "string") {
    const target = tracker.alerts.find((alert) => alert.id === flags.ack);
    if (target) {
      target.read = true;
      target.readAt = nowIso();
    }
  }

  saveTracker(tracker);

  const unread = tracker.alerts.filter((alert) => !alert.read);
  const sortedUnread = [...unread].sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const limit = Math.max(1, parseNumber(flags.limit, 20));
  const visible = sortedUnread.slice(0, limit);

  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          generated,
          unreadCount: unread.length,
          unread: visible
        },
        null,
        2
      )
    );
    return;
  }

  console.log(`generatedAlerts=${generated.length} unreadAlerts=${unread.length}`);
  if (!visible.length) {
    console.log("No unread alerts.");
    return;
  }
  for (const alert of visible) {
    console.log(
      `${alert.id} [${alert.level}] ${alert.source} item=${alert.itemId || "-"} at=${alert.at} ${alert.message}`
    );
  }
}

function help() {
  console.log("Usage:");
  console.log("  list [--status --type --workspace --test --tag --q --json]");
  console.log("  summary");
  console.log("  next [--limit 5]");
  console.log("  show <id>");
  console.log("  add <title> [--type --priority --workspace --status --test --tags --note]");
  console.log("  move <id> <status> [--progress --note]");
  console.log("  test <id> <testStatus> [--progress --note]");
  console.log("  note <id> <text>");
  console.log("  notify <id> [--status done,blocked --test failed]");
  console.log("  remind list [--id <id> --status pending --due]");
  console.log("  remind add <id> --at <iso> [--msg <text>]");
  console.log("  remind done <id> <reminderId>");
  console.log("  check [--ack all|<alertId>] [--limit 20]");
}

function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];
  if (!command || command === "help" || command === "--help" || command === "-h") {
    help();
    return;
  }

  const tracker = loadTracker();
  const tail = argv.slice(1);

  if (command === "summary") {
    commandSummary(tracker);
    return;
  }

  if (command === "list") {
    const { flags } = parseArgs(tail);
    if (flags.status) assertInSet("status", flags.status, STATUSES);
    if (flags.type) assertInSet("type", flags.type, TYPES);
    if (flags.workspace) assertInSet("workspace", flags.workspace, WORKSPACES);
    if (flags.test) assertInSet("test status", flags.test, TEST_STATUSES);
    commandList(tracker, flags);
    return;
  }

  if (command === "next") {
    const { flags } = parseArgs(tail);
    commandNext(tracker, flags);
    return;
  }

  if (command === "show") {
    const id = tail[0];
    if (!id) throw new Error("Usage: show <id>");
    commandShow(tracker, id);
    return;
  }

  if (command === "add") {
    const { positionals, flags } = parseArgs(tail);
    const title = positionals.join(" ").trim();
    commandAdd(tracker, title, flags);
    return;
  }

  if (command === "move") {
    const { positionals, flags } = parseArgs(tail);
    const id = positionals[0];
    const status = positionals[1];
    if (!id || !status) throw new Error("Usage: move <id> <status> [--progress --note]");
    commandMove(tracker, id, status, flags);
    return;
  }

  if (command === "test") {
    const { positionals, flags } = parseArgs(tail);
    const id = positionals[0];
    const testStatus = positionals[1];
    if (!id || !testStatus) throw new Error("Usage: test <id> <testStatus> [--progress --note]");
    commandTest(tracker, id, testStatus, flags);
    return;
  }

  if (command === "note") {
    const { positionals } = parseArgs(tail);
    const id = positionals[0];
    const text = positionals.slice(1).join(" ").trim();
    if (!id || !text) throw new Error("Usage: note <id> <text>");
    commandNote(tracker, id, text);
    return;
  }

  if (command === "notify") {
    const { positionals, flags } = parseArgs(tail);
    const id = positionals[0];
    if (!id) throw new Error("Usage: notify <id> [--status done,blocked --test failed]");
    commandNotify(tracker, id, flags);
    return;
  }

  if (command === "remind") {
    const { positionals, flags } = parseArgs(tail);
    commandRemind(tracker, positionals, flags);
    return;
  }

  if (command === "check") {
    const { flags } = parseArgs(tail);
    commandCheck(tracker, flags);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

try {
  main();
} catch (error) {
  console.error(`tracker error: ${error.message}`);
  process.exit(1);
}
