import { expect, type Locator, type Page, test } from "@playwright/test";

type RobotMeta = {
  robotId: string;
  caseId?: string;
};

type StoredScene = {
  notes?: string;
  layers?: Array<{ kf?: Array<{ w?: number }> }>;
};
type StoredProject = { scenes?: StoredScene[] };

type TestFsSnapshot = {
  dirs: string[];
  files: Record<string, string>;
};

export type LocalProviderMockMode = "drawthings_ready" | "draw_fallback" | "comfy_fallback" | "handoff_only";

export type LocalProviderMockState = {
  mode: LocalProviderMockMode;
  drawProbeCalls: number;
  drawTxt2ImgCalls: number;
  comfyProbeCalls: number;
  comfyPromptCalls: number;
  comfyHistoryCalls: number;
  comfyViewCalls: number;
  drawPayloads: Array<Record<string, unknown>>;
  comfyPromptPayloads: Array<Record<string, unknown>>;
};

type MockSessionSeedOptions = {
  email?: string;
  creditsBalance?: number;
  tier?: "free" | "pro";
  preserveExistingSession?: boolean;
};

const TINY_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WnR4V8AAAAASUVORK5CYII=";

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
  newProject: /新建项目|创建新项目|New Project/i,
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

export async function dismissAccountCenterIfPresent(page: Page): Promise<void> {
  const authPanel = page.getByTestId("account-auth-panel");
  const closeBtn = page.getByTestId("account-center-close");
  const hasAuthPanel = await authPanel.count();
  if (!hasAuthPanel) return;
  if (await closeBtn.count()) {
    await closeBtn.click({ force: true });
    await expect(authPanel).toHaveCount(0);
  }
}

async function openTopMenu(page: Page): Promise<void> {
  const guideMask = page.getByTestId("workspace-entry-guide-mask");
  if (await guideMask.count()) {
    const skip = page.getByTestId("workspace-entry-guide-skip");
    if (await skip.count()) {
      await skip.click();
    } else {
      await guideMask.first().click({ position: { x: 6, y: 6 } });
    }
  }
  await page.getByTestId("top-help-trigger").click();
}

export async function openQuickWorkspace(page: Page, lang: "zh" | "en" = "en"): Promise<void> {
  await installMockSessionBeforeLoad(page, { tier: "free", creditsBalance: 120 });
  await page.goto("/app");
  await page.evaluate((nextLang) => {
    localStorage.setItem("sp_workspace_mode", "results");
    localStorage.setItem("sp_workspace_entry_guide_done_v1", "1");
    localStorage.setItem("scenepilot_lang", nextLang);
  }, lang);
  await page.reload();
  await expect(page.getByTestId("media-studio-root")).toBeVisible();
}

export async function installMockSessionBeforeLoad(
  page: Page,
  options: MockSessionSeedOptions = {}
): Promise<void> {
  const {
    email = "robot-user@example.com",
    creditsBalance = 120,
    tier = "free",
    preserveExistingSession = true,
  } = options;
  await page.addInitScript(({ nextEmail, nextCreditsBalance, nextTier, keepExistingSession }) => {
    const now = new Date().toISOString();
    const storeKey = "scenepilot_mock_account_store_v1";
    let store: Record<string, any>;
    try {
      store = JSON.parse(localStorage.getItem(storeKey) || "{}");
    } catch {
      store = {};
    }
    store.users = store.users ?? {};
    store.wallets = store.wallets ?? {};
    store.ledgers = store.ledgers ?? {};
    store.apiCredentials = store.apiCredentials ?? {};
    store.subscriptions = store.subscriptions ?? {};
    store.challenges = store.challenges ?? {};

    if (
      keepExistingSession
      && typeof store.session?.userId === "string"
      && !!store.users?.[store.session.userId]
    ) {
      return;
    }

    const normalizedEmail = String(nextEmail).trim().toLowerCase();
    const normalizedTier = nextTier === "pro" ? "pro" : "free";
    const normalizedUserId = `user_robot_${normalizedEmail.replace(/[^a-z0-9]/g, "_")}`;

    store.users[normalizedUserId] = {
      id: normalizedUserId,
      email: normalizedEmail,
      displayName: store.users[normalizedUserId]?.displayName ?? null,
      avatarUrl: store.users[normalizedUserId]?.avatarUrl ?? null,
      tier: normalizedTier,
      proConsoleEnabled: normalizedTier === "pro",
      bringYourOwnApiEnabled: normalizedTier === "pro",
      creditsBalance: nextCreditsBalance,
      createdAt: store.users[normalizedUserId]?.createdAt ?? now,
      updatedAt: now
    };
    store.wallets[normalizedUserId] = { creditsBalance: nextCreditsBalance, currency: "credits" };
    store.ledgers[normalizedUserId] = store.ledgers[normalizedUserId] ?? [];
    store.apiCredentials[normalizedUserId] = store.apiCredentials[normalizedUserId] ?? {
      defaultProvider: "fal",
      fal: {
        enabled: true,
        mode: "platform",
        apiKey: "",
        baseUrl: "https://queue.fal.run",
        preferredModel: "fal-ai/flux/dev",
        updatedAt: now
      },
      runway: {
        enabled: false,
        mode: "platform",
        apiKey: "",
        baseUrl: "https://api.dev.runwayml.com",
        preferredModel: "gen4_turbo",
        updatedAt: now
      },
      updatedAt: now
    };
    store.subscriptions[normalizedUserId] = normalizedTier === "pro"
      ? {
          userId: normalizedUserId,
          planId: "pro_monthly",
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
          lastCreditGrantAt: now,
          provider: "mock",
          customerPortalUrl: "/mock/paddle/customer-portal"
        }
      : {
          userId: normalizedUserId,
          planId: "",
          status: "inactive",
          currentPeriodStart: null,
          currentPeriodEnd: null,
          lastCreditGrantAt: null,
          provider: "mock",
          customerPortalUrl: null
        };
    store.session = {
      token: `session_${normalizedUserId}`,
      userId: normalizedUserId,
      email: normalizedEmail,
      provider: "password",
      providerSubject: null,
      createdAt: now
    };
    localStorage.setItem(storeKey, JSON.stringify(store));
  }, {
    nextEmail: email,
    nextCreditsBalance: creditsBalance,
    nextTier: tier,
    keepExistingSession: preserveExistingSession
  });
}

export async function ensureMockProAccount(
  page: Page,
  options: { email?: string; creditsBalance?: number } = {},
): Promise<void> {
  const { email = "robot-pro@example.com", creditsBalance = 200 } = options;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.evaluate(({ nextEmail, nextCreditsBalance }) => {
        const now = new Date().toISOString();
        const storeKey = "scenepilot_mock_account_store_v1";
        let store: Record<string, any>;
        try {
          store = JSON.parse(localStorage.getItem(storeKey) || "{}");
        } catch {
          store = {};
        }
        store.users = store.users ?? {};
        store.wallets = store.wallets ?? {};
        store.ledgers = store.ledgers ?? {};
        store.apiCredentials = store.apiCredentials ?? {};
        store.subscriptions = store.subscriptions ?? {};
        store.challenges = store.challenges ?? {};

        const normalizedEmail = String(nextEmail).trim().toLowerCase();
        let userId = typeof store.session?.userId === "string" ? store.session.userId : "";
        if (!userId || !store.users[userId]) {
          const byEmail = Object.values(store.users).find((item: any) => item?.email === normalizedEmail) as { id?: string } | undefined;
          userId = byEmail?.id || `user_robot_${Date.now()}`;
        }

        store.users[userId] = {
          id: userId,
          email: normalizedEmail,
          displayName: store.users[userId]?.displayName ?? null,
          avatarUrl: store.users[userId]?.avatarUrl ?? null,
          tier: "pro",
          proConsoleEnabled: true,
          bringYourOwnApiEnabled: true,
          creditsBalance: nextCreditsBalance,
          createdAt: store.users[userId]?.createdAt ?? now,
          updatedAt: now
        };
        store.wallets[userId] = { creditsBalance: nextCreditsBalance, currency: "credits" };
        store.ledgers[userId] = store.ledgers[userId] ?? [];
        store.apiCredentials[userId] = store.apiCredentials[userId] ?? {
          defaultProvider: "fal",
          fal: {
            enabled: true,
            mode: "platform",
            apiKey: "",
            baseUrl: "https://queue.fal.run",
            preferredModel: "fal-ai/flux/dev",
            updatedAt: now
          },
          runway: {
            enabled: false,
            mode: "platform",
            apiKey: "",
            baseUrl: "https://api.dev.runwayml.com",
            preferredModel: "gen4_turbo",
            updatedAt: now
          },
          updatedAt: now
        };
        store.subscriptions[userId] = {
          userId,
          planId: "pro_monthly",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
          lastCreditGrantAt: new Date().toISOString(),
          provider: "mock",
          customerPortalUrl: "/mock/paddle/customer-portal"
        };
        store.session = {
          token: `session_${userId}`,
          userId,
          email: normalizedEmail,
          provider: "password",
          providerSubject: null,
          createdAt: now
        };
        localStorage.setItem(storeKey, JSON.stringify(store));
        localStorage.setItem("sp_workspace_entry_guide_done_v1", "1");
      }, { nextEmail: email, nextCreditsBalance: creditsBalance });
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === 2 || !message.includes("Execution context was destroyed")) {
        throw error;
      }
      await page.waitForLoadState("domcontentloaded");
    }
  }

  await page.reload();
}

export async function skipProGateIfPresent(page: Page): Promise<void> {
  const skipButton = page.getByTestId("account-auth-skip-pro");
  if (await skipButton.count()) {
    await skipButton.click();
  }
}

export async function openWizard(page: Page): Promise<void> {
  const onboardingStartBtn = page.getByRole("button", { name: TXT.startCreating });
  const wizardStep1Title = page.getByText(TXT.wizardStep1);
  const tutorialTitle = page.getByText(/新手教程|Beginner Tutorial/i).first();
  const closeBtn = page.getByRole("button", { name: /^关闭$|^Close$/i }).first();

  if (await isVisible(tutorialTitle)) {
    await closeBtn.click();
    await expect(tutorialTitle).toBeHidden({ timeout: 10_000 });
  }

  if (await isVisible(onboardingStartBtn)) {
    await onboardingStartBtn.click();
    await expect(wizardStep1Title).toBeVisible();
    return;
  }

  if (await isVisible(wizardStep1Title)) {
    return;
  }

  const mediaStudioRoot = page.getByTestId("media-studio-root");
  if (await isVisible(mediaStudioRoot)) {
    await ensureMockProAccount(page, { creditsBalance: 240 });
    await page.evaluate(() => {
      localStorage.setItem("sp_workspace_mode", "pro");
    });
    await page.reload();
    if (await isVisible(wizardStep1Title)) {
      return;
    }
  }

  const projectMenuTrigger = page.getByTestId("project-menu-trigger");
  if (!(await projectMenuTrigger.count())) {
    try {
      await expect(projectMenuTrigger).toHaveCount(1, { timeout: 4_000 });
    } catch {
      // fallback below if project control bar is not shown in this mode
    }
  }
  if (await projectMenuTrigger.count()) {
    try {
      await expect(projectMenuTrigger).toBeVisible({ timeout: 2_000 });
    } catch {
      // still try force click when present in DOM but partially covered by transitions
    }
  }

  if (await isVisible(projectMenuTrigger)) {
    await projectMenuTrigger.click({ force: true });
    const projectMenuNew = page.getByTestId("project-menu-new");
    if (await isVisible(projectMenuNew)) {
      await projectMenuNew.click();
    } else {
      const altNew = page.getByRole("button", { name: /新建|New/i }).first();
      if (await isVisible(altNew)) {
        await altNew.click();
      } else {
        await page.getByRole("button", { name: TXT.newProject }).first().click();
      }
    }
  } else {
    const altNew = page.getByRole("button", { name: /新建|New/i }).first();
    if (await isVisible(altNew)) {
      await altNew.click();
    } else {
      await page.getByRole("button", { name: TXT.newProject }).first().click();
    }
  }

  const newWithoutSavingBtn = page.getByRole("button", { name: TXT.newWithoutSaving });
  if (await isVisible(newWithoutSavingBtn)) {
    await newWithoutSavingBtn.click();
  }

  const accountAuthSendCode = page.getByTestId("account-auth-send-code");
  if (await isVisible(accountAuthSendCode)) {
    await ensureMockProAccount(page, { creditsBalance: 240 });
    await page.evaluate(() => {
      localStorage.setItem("sp_workspace_mode", "pro");
    });
    await page.reload();
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

export async function openProjectMenu(page: Page): Promise<void> {
  const trigger = page.getByTestId("project-menu-trigger");
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByTestId("project-menu")).toBeVisible();
}

export async function installTestDirectoryBridge(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      dirs: ["/ScenePilotix"] as string[],
      files: {} as Record<string, string>,
      promptQueue: [] as string[],
    };

    const normalize = (input: string) => {
      const cleaned = `/${String(input || "").replace(/^\/+/, "").replace(/\/+/g, "/")}`;
      return cleaned.length > 1 ? cleaned.replace(/\/$/, "") : cleaned;
    };

    const ensureDir = (dirPath: string) => {
      const path = normalize(dirPath);
      if (!state.dirs.includes(path)) state.dirs.push(path);
      return path;
    };

    const removeTree = (targetPath: string) => {
      const path = normalize(targetPath);
      state.dirs = state.dirs.filter((dir) => dir !== path && !dir.startsWith(`${path}/`));
      for (const key of Object.keys(state.files)) {
        if (key === path || key.startsWith(`${path}/`)) delete state.files[key];
      }
    };

    const listEntries = (dirPath: string) => {
      const path = normalize(dirPath);
      const prefix = path === "/" ? "/" : `${path}/`;
      const seen = new Set<string>();
      const out: Array<{ name: string; kind: "file" | "directory"; path: string }> = [];

      for (const dir of state.dirs) {
        if (!dir.startsWith(prefix) || dir === path) continue;
        const rest = dir.slice(prefix.length);
        if (!rest || rest.includes("/")) continue;
        if (seen.has(rest)) continue;
        seen.add(rest);
        out.push({ name: rest, kind: "directory", path: dir });
      }

      for (const file of Object.keys(state.files)) {
        if (!file.startsWith(prefix)) continue;
        const rest = file.slice(prefix.length);
        if (!rest || rest.includes("/")) continue;
        if (seen.has(rest)) continue;
        seen.add(rest);
        out.push({ name: rest, kind: "file", path: file });
      }

      out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
      return out;
    };

    const toText = async (data: any): Promise<string> => {
      if (typeof data === "string") return data;
      if (data instanceof Blob) return await data.text();
      if (data instanceof Uint8Array) return new TextDecoder().decode(data);
      if (data instanceof ArrayBuffer) return new TextDecoder().decode(new Uint8Array(data));
      if (data && typeof data === "object" && "buffer" in data) {
        const view = data as ArrayBufferView;
        return new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      }
      return String(data ?? "");
    };

    const createFileHandle = (fullPath: string) => {
      const path = normalize(fullPath);
      const name = path.split("/").pop() || "file";
      return {
        kind: "file" as const,
        name,
        async createWritable() {
          let nextValue = state.files[path] ?? "";
          return {
            async write(data: any) {
              nextValue = await toText(data);
            },
            async close() {
              state.files[path] = nextValue;
            },
          };
        },
        async getFile() {
          return new File([state.files[path] ?? ""], name, { type: "text/plain" });
        },
      };
    };

    const createDirectoryHandle = (dirPath: string) => {
      const path = ensureDir(dirPath);
      const name = path === "/ScenePilotix" ? "ScenePilotix" : (path.split("/").pop() || "dir");
      return {
        kind: "directory" as const,
        name,
        async getDirectoryHandle(childName: string, options?: { create?: boolean }) {
          const childPath = normalize(`${path}/${childName}`);
          if (!state.dirs.includes(childPath)) {
            if (!options?.create) throw new Error(`Directory not found: ${childName}`);
            ensureDir(childPath);
          }
          return createDirectoryHandle(childPath);
        },
        async getFileHandle(childName: string, options?: { create?: boolean }) {
          const filePath = normalize(`${path}/${childName}`);
          if (!(filePath in state.files) && !options?.create) throw new Error(`File not found: ${childName}`);
          if (options?.create && !(filePath in state.files)) state.files[filePath] = "";
          return createFileHandle(filePath);
        },
        async removeEntry(childName: string, options?: { recursive?: boolean }) {
          const childPath = normalize(`${path}/${childName}`);
          if (state.dirs.includes(childPath)) {
            if (!options?.recursive) {
              const hasChildren = state.dirs.some((dir) => dir.startsWith(`${childPath}/`)) ||
                Object.keys(state.files).some((file) => file.startsWith(`${childPath}/`));
              if (hasChildren) throw new Error(`Directory not empty: ${childName}`);
            }
            removeTree(childPath);
            return;
          }
          delete state.files[childPath];
        },
        async *entries() {
          for (const entry of listEntries(path)) {
            yield [entry.name, entry.kind === "directory" ? createDirectoryHandle(entry.path) : createFileHandle(entry.path)] as const;
          }
        },
      };
    };

    const rootHandle = createDirectoryHandle("/ScenePilotix");
    (window as any).__SCENEPILOT_TEST_FS__ = state;
    (window as any).__SCENEPILOT_TEST_BRIDGE__ = {
      skipHandlePersistence: true,
      showDirectoryPicker: async () => rootHandle,
    };
    (window as any).showDirectoryPicker = async () => rootHandle;

    window.confirm = () => true;
    window.prompt = (_message?: string, defaultValue?: string) => {
      if (state.promptQueue.length) return state.promptQueue.shift() ?? null;
      return defaultValue ?? null;
    };
  });
}

export async function queuePromptResponse(page: Page, value: string): Promise<void> {
  await page.evaluate((nextValue) => {
    const state = (window as any).__SCENEPILOT_TEST_FS__;
    if (!state) throw new Error("Test FS bridge is not installed");
    state.promptQueue.push(nextValue);
  }, value);
}

export async function readTestFsSnapshot(page: Page): Promise<TestFsSnapshot> {
  return await page.evaluate(() => {
    const state = (window as any).__SCENEPILOT_TEST_FS__;
    return {
      dirs: [...(state?.dirs ?? [])],
      files: { ...(state?.files ?? {}) },
    };
  });
}

export async function installLocalProviderMocks(page: Page, mode: LocalProviderMockMode): Promise<LocalProviderMockState> {
  const state: LocalProviderMockState = {
    mode,
    drawProbeCalls: 0,
    drawTxt2ImgCalls: 0,
    comfyProbeCalls: 0,
    comfyPromptCalls: 0,
    comfyHistoryCalls: 0,
    comfyViewCalls: 0,
    drawPayloads: [],
    comfyPromptPayloads: []
  };
  const pngBuffer = Buffer.from(TINY_PNG_BASE64, "base64");
  const promptIds: string[] = [];

  await page.route("**/__localgen/draw/", async (route) => {
    state.drawProbeCalls += 1;
    if (mode === "drawthings_ready" || mode === "draw_fallback") {
      await route.fulfill({ status: 200, body: "ok", contentType: "text/plain" });
      return;
    }
    await route.abort("failed");
  });

  await page.route("**/__localgen/draw/sdapi/v1/txt2img", async (route) => {
    state.drawTxt2ImgCalls += 1;
    try {
      state.drawPayloads.push(JSON.parse(route.request().postData() || "{}") as Record<string, unknown>);
    } catch {
      state.drawPayloads.push({});
    }
    if (mode !== "drawthings_ready" && mode !== "draw_fallback") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ images: [TINY_PNG_BASE64] })
    });
  });

  await page.route("**/__localgen/comfy/system_stats", async (route) => {
    state.comfyProbeCalls += 1;
    if (mode === "handoff_only" || mode === "draw_fallback") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ system: { os: "robot" } })
    });
  });

  await page.route("**/__localgen/comfy/models/checkpoints", async (route) => {
    if (mode === "handoff_only" || mode === "draw_fallback") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(["robot-test.safetensors"])
    });
  });

  await page.route("**/__localgen/comfy/prompt", async (route) => {
    state.comfyPromptCalls += 1;
    try {
      state.comfyPromptPayloads.push(JSON.parse(route.request().postData() || "{}") as Record<string, unknown>);
    } catch {
      state.comfyPromptPayloads.push({});
    }
    if (mode === "handoff_only" || mode === "draw_fallback") {
      await route.abort("failed");
      return;
    }
    const promptId = `robot_prompt_${state.comfyPromptCalls}`;
    promptIds.push(promptId);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ prompt_id: promptId })
    });
  });

  await page.route(/.*\/__localgen\/comfy\/history\/.+$/, async (route) => {
    state.comfyHistoryCalls += 1;
    if (mode === "handoff_only" || mode === "draw_fallback") {
      await route.abort("failed");
      return;
    }
    const promptId = route.request().url().split("/history/").pop() || promptIds.at(-1) || "robot_prompt_1";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        [promptId]: {
          status: {
            completed: true,
            status_str: "success"
          },
          outputs: {
            "9": {
              images: [
                {
                  filename: `${promptId}.png`,
                  subfolder: "robot",
                  type: "output"
                }
              ]
            }
          }
        }
      })
    });
  });

  await page.route(/.*\/__localgen\/comfy\/view\?.*$/, async (route) => {
    state.comfyViewCalls += 1;
    if (mode === "handoff_only" || mode === "draw_fallback") {
      await route.abort("failed");
      return;
    }
    await route.fulfill({
      status: 200,
      body: pngBuffer,
      contentType: "image/png"
    });
  });

  return state;
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
