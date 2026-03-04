import { expect, type Locator, type Page, test } from "@playwright/test";

type RobotMeta = {
  robotId: string;
  caseId?: string;
};

type StoredScene = { notes?: string };
type StoredProject = { scenes?: StoredScene[] };

export async function runStep(page: Page, name: string, fn: () => Promise<void>): Promise<void> {
  await test.step(name, async () => {
    try {
      await fn();
    } catch (error) {
      try {
        await page.screenshot({ path: test.info().outputPath(`${Date.now()}-${name}-error.png`), fullPage: true });
      } catch {
        // Page can be closed by test timeout; keep original assertion error.
      }
      throw error;
    }
  });
}

export async function captureArtifacts(page: Page, meta: RobotMeta): Promise<void> {
  const info = test.info();

  const finalShot = info.outputPath(`${meta.robotId}-${meta.caseId || "case"}-final.png`);
  await page.screenshot({ path: finalShot, fullPage: true });

  const storage = await page.evaluate(() => JSON.stringify(window.localStorage));
  await info.attach("localStorage.json", {
    body: Buffer.from(storage, "utf-8"),
    contentType: "application/json",
  });

  const url = page.url();
  await info.attach("page-url.txt", {
    body: Buffer.from(url, "utf-8"),
    contentType: "text/plain",
  });
}

export function requireLiveMode(): void {
  test.skip(!process.env.ROBOT_E2E_LIVE, "Set ROBOT_E2E_LIVE=1 to run live business flow");
}

const TXT = {
  startCreating: /开始创建|Start Creating/i,
  wizardStep1: /第\s*1\s*步：你要生成什么\?|Step\s*1:\s*What do you want to generate\?/i,
  newProject: /创建新项目|New Project/i,
  newWithoutSaving: /不保存，直接新建|New Without Saving/i,
  image: /^图片$|^Image$/i,
  video: /^视频$|^Video$/i,
  next: /^下一步$|^Next$/i,
  startEditing: /^开始编辑$|^Start Editing$/i,
  scenes: /分镜列表|Scenes/i,
  shotCount: /分镜数量|Shot Count/i,
  totalDuration: /总时长\(s\)|Total Duration\(s\)/i,
  durationMode: /时长分配|Duration Mode/i,
};

async function isVisible(locator: Locator): Promise<boolean> {
  try {
    return await locator.first().isVisible();
  } catch {
    return false;
  }
}

export async function openWizard(page: Page): Promise<void> {
  const onboardingStartBtn = page.getByRole("button", { name: TXT.startCreating });
  const wizardStep1Title = page.getByText(TXT.wizardStep1);

  if (await isVisible(onboardingStartBtn)) {
    await onboardingStartBtn.click();
    await expect(wizardStep1Title).toBeVisible();
    return;
  }

  if (await isVisible(wizardStep1Title)) {
    return;
  }

  await page.getByRole("button", { name: TXT.newProject }).first().click();

  const newWithoutSavingBtn = page.getByRole("button", { name: TXT.newWithoutSaving });
  if (await isVisible(newWithoutSavingBtn)) {
    await newWithoutSavingBtn.click();
  }

  await expect(wizardStep1Title).toBeVisible();
}

export async function createImageProject(page: Page, projectName: string): Promise<void> {
  await page.getByRole("button", { name: TXT.image }).click();
  await page.getByRole("button", { name: TXT.next }).click();

  const projectNameInput = page.locator(".spx-wizard-modal input").first();
  await expect(projectNameInput).toBeVisible();
  await projectNameInput.fill(projectName);
  await page.getByRole("button", { name: TXT.startEditing }).click();

  await expect(page.locator(".spx-wizard-modal")).toBeHidden({ timeout: 10_000 });
}

export async function createVideoProject(
  page: Page,
  projectName: string,
  shotCount: number,
  totalDuration: number,
  sceneTier?: "indoor" | "small_plaza" | "open_space",
): Promise<void> {
  await page.getByRole("button", { name: TXT.video }).click();
  await page.getByRole("button", { name: TXT.next }).click();

  if (shotCount > 1) {
    await page.getByRole("button", { name: /同场景多机位|Multicam/i }).click();
  }

  await page.getByRole("button", { name: TXT.next }).click();

  const modal = page.locator(".spx-wizard-modal");
  await expect(modal).toBeVisible();

  const nameInput = modal.locator("input").first();
  await nameInput.fill(projectName);

  const shotCountSelect = modal.locator("select").first();
  await shotCountSelect.selectOption(String(Math.max(1, shotCount)));

  if (sceneTier) {
    const tierSelect = modal.locator("select").nth(1);
    await tierSelect.selectOption(sceneTier);
  }

  const durationInput = modal.locator("input").nth(1);
  await durationInput.fill(String(Math.max(1, totalDuration)));

  await page.getByRole("button", { name: TXT.startEditing }).click();
  await expect(modal).toBeHidden({ timeout: 10_000 });
}

export async function assertProjectVisible(page: Page, projectName: string): Promise<void> {
  await expect(page.getByText(projectName).first()).toBeVisible();
  await expect(page.getByText(TXT.scenes).first()).toBeVisible();
}

export { TXT };

export async function getStoredProject(page: Page): Promise<StoredProject | null> {
  return await page.evaluate(() => {
    const raw = localStorage.getItem("scenepilot_project");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
}

export async function assertVideoProjectUsesV2(
  page: Page,
  options: { minScenes?: number; expectedMode?: "strict" | "short" } = {},
): Promise<void> {
  const { minScenes = 1, expectedMode = "strict" } = options;
  const stored = await getStoredProject(page);
  expect(stored).not.toBeNull();

  const scenes = (stored?.scenes ?? []) as StoredScene[];
  expect(scenes.length).toBeGreaterThanOrEqual(minScenes);

  for (const scene of scenes.slice(0, minScenes)) {
    const notes = String(scene.notes ?? "");
    expect(notes).toContain("@compiler:v2");
    expect(notes).toContain(`@v2_mode:${expectedMode}`);
    expect(notes).toContain("genmode: quick");
  }
}
