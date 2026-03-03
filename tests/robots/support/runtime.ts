import { Page, test } from "@playwright/test";

type RobotMeta = {
  robotId: string;
  caseId?: string;
};

export async function runStep(page: Page, name: string, fn: () => Promise<void>): Promise<void> {
  await test.step(name, async () => {
    try {
      await fn();
    } catch (error) {
      await page.screenshot({ path: test.info().outputPath(`${Date.now()}-${name}-error.png`), fullPage: true });
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
