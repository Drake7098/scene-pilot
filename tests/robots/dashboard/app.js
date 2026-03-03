const el = {
  status: document.getElementById("status"),
  startedAt: document.getElementById("startedAt"),
  finishedAt: document.getElementById("finishedAt"),
  appUrl: document.getElementById("appUrl"),
  tests: document.getElementById("tests"),
  passed: document.getElementById("passed"),
  failed: document.getElementById("failed"),
  skipped: document.getElementById("skipped"),
  duration: document.getElementById("duration"),
  failures: document.getElementById("failures"),
  links: document.getElementById("links"),
  generatedAt: document.getElementById("generatedAt"),
};

const fmtTime = (t) => (t ? new Date(t).toLocaleString() : "-");
const fmtDuration = (ms) => `${(ms / 1000).toFixed(1)}s`;

function statusBadge(status) {
  if (status === "running") return '<span class="badge run">running</span>';
  if (status === "passed") return '<span class="badge ok">passed</span>';
  if (status === "failed") return '<span class="badge bad">failed</span>';
  return `<span class="badge">${status || "idle"}</span>`;
}

async function load() {
  const summary = await fetch("/artifacts/summary.json", { cache: "no-store" }).then((r) => r.ok ? r.json() : null);
  if (!summary) return;

  el.status.innerHTML = statusBadge(summary.status);
  el.startedAt.textContent = fmtTime(summary.startedAt);
  el.finishedAt.textContent = fmtTime(summary.finishedAt);
  el.appUrl.textContent = summary.appUrl || "-";
  el.tests.textContent = summary.totals.tests;
  el.passed.textContent = summary.totals.passed;
  el.failed.textContent = summary.totals.failed;
  el.skipped.textContent = summary.totals.skipped;
  el.duration.textContent = fmtDuration(summary.totals.durationMs || 0);
  el.generatedAt.textContent = fmtTime(summary.generatedAt);

  el.failures.innerHTML = (summary.failures || []).length
    ? summary.failures
        .map(
          (f) => `<div class="item"><div><b>${f.title}</b></div><div class="mono">${f.file || "unknown file"}</div><div>${(f.error || "").slice(0, 220)}</div></div>`,
        )
        .join("")
    : '<div class="item">No failures in latest run.</div>';

  el.links.innerHTML = `
    <div class="item"><a href="/artifacts/html-report/index.html" target="_blank">Open Playwright HTML Report</a></div>
    <div class="item"><a href="/artifacts/results.json" target="_blank">Open Raw JSON Results</a></div>
    <div class="item"><a href="/artifacts/run-state.json" target="_blank">Open Run State</a></div>
  `;
}

load();
setInterval(load, 3000);
