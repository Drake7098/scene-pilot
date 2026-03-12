#!/usr/bin/env node
import process from "node:process";

const targets = [
  { id: "comfyui-8000", url: "http://127.0.0.1:8000/system_stats", expect: "comfyui" },
  { id: "comfyui-8188", url: "http://127.0.0.1:8188/system_stats", expect: "comfyui" },
  { id: "drawthings-7860", url: "http://127.0.0.1:7860/sdapi/v1/options", expect: "drawthings" }
];

async function probe(target) {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(target.url, { signal: controller.signal });
    clearTimeout(timer);
    const text = await res.text();
    return {
      id: target.id,
      expect: target.expect,
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - startedAt,
      snippet: text.slice(0, 180)
    };
  } catch (error) {
    return {
      id: target.id,
      expect: target.expect,
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

const results = await Promise.all(targets.map(probe));
const comfyOk = results.some((item) => item.expect === "comfyui" && item.ok);
const drawOk = results.some((item) => item.expect === "drawthings" && item.ok);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    comfyuiReady: comfyOk,
    drawthingsReady: drawOk,
    preferredLocalProvider: comfyOk ? "comfyui" : drawOk ? "drawthings" : "none"
  },
  checks: results
};

console.log(JSON.stringify(report, null, 2));

if (!comfyOk && !drawOk) {
  process.exit(2);
}

