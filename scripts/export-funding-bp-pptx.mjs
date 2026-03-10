import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "artifacts", "funding-bp");
const HTML_PATH = path.join(OUT_DIR, "scene-pilotix-funding-bp.html");
const SLIDES_DIR = path.join(OUT_DIR, "slides");
const PPTX_PATH = path.join(OUT_DIR, "scene-pilotix-funding-bp.pptx");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function captureSlidesFromHtml() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(pathToFileURL(HTML_PATH).href, { waitUntil: "load" });

  const sections = page.locator("section.page");
  const count = await sections.count();
  if (!count) {
    await browser.close();
    throw new Error(`No section.page found in ${HTML_PATH}`);
  }

  const slidePaths = [];
  for (let i = 0; i < count; i += 1) {
    const file = path.join(SLIDES_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await sections.nth(i).screenshot({ path: file });
    slidePaths.push(file);
  }
  await browser.close();
  return slidePaths;
}

function runOsaScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const ps = spawn("osascript", [scriptPath, ...args], { stdio: "pipe" });
    let out = "";
    let err = "";
    ps.stdout.on("data", (chunk) => { out += String(chunk); });
    ps.stderr.on("data", (chunk) => { err += String(chunk); });
    ps.on("close", (code) => {
      if (code === 0) resolve(out.trim());
      else reject(new Error(`osascript failed (${code}): ${err || out}`));
    });
  });
}

async function exportWithKeynote(slidePaths) {
  const scriptPath = path.join(OUT_DIR, "export-funding-bp-pptx.applescript");
  const script = `
on run argv
  set outputPptx to item 1 of argv
  set imageCount to (count of argv) - 1

  tell application "Keynote"
    activate
    set docRef to make new document

    tell docRef
      set baseLayoutRef to item 1 of (every master slide)
      repeat with i from 1 to imageCount
        set imgPath to item (i + 1) of argv
        set newSlide to make new slide with properties {base layout:baseLayoutRef}
        tell newSlide
          set slideImage to make new image with properties {file:(POSIX file imgPath)}
          set position of slideImage to {0, 0}
          set width of slideImage to 1880
          set height of slideImage to 1060
        end tell
      end repeat

      if (count of slides) > 1 then
        delete slide 1
      end if

      export to (POSIX file outputPptx) as Microsoft PowerPoint
      close saving no
    end tell
  end tell
end run
`.trim();
  await fs.writeFile(scriptPath, `${script}\n`, "utf8");
  await runOsaScript(scriptPath, [PPTX_PATH, ...slidePaths]);
}

async function main() {
  await ensureDir(OUT_DIR);
  await ensureDir(SLIDES_DIR);
  await fs.access(HTML_PATH);

  const slidePaths = await captureSlidesFromHtml();
  await exportWithKeynote(slidePaths);

  console.log(JSON.stringify({
    html: HTML_PATH,
    slidesDir: SLIDES_DIR,
    slideCount: slidePaths.length,
    pptx: PPTX_PATH
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
