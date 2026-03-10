import { expect, type Locator } from "@playwright/test";

export type UiReadabilityThresholds = {
  minTextPaddingPx?: number;
  maxSlackRatio?: number;
  maxSlackPx?: number;
  maxWrapHeightPx?: number;
};

type OptionMeta = { value: string; text: string };

export async function assertNoVerticalOverlap(
  upper: Locator,
  lower: Locator,
  minGapPx = 6,
): Promise<void> {
  const upperBox = await upper.boundingBox();
  const lowerBox = await lower.boundingBox();
  expect(upperBox).not.toBeNull();
  expect(lowerBox).not.toBeNull();
  if (!upperBox || !lowerBox) return;
  expect(upperBox.y + upperBox.height + minGapPx).toBeLessThanOrEqual(lowerBox.y);
}

export async function assertSelectReadable(
  select: Locator,
  thresholds: UiReadabilityThresholds = {},
): Promise<void> {
  const {
    minTextPaddingPx = 4,
    maxSlackRatio = 2.75,
    maxSlackPx = 74,
    maxWrapHeightPx = 34,
  } = thresholds;

  const metrics = await select.evaluate((node) => {
    const el = node as HTMLSelectElement;
    const selected = el.options[el.selectedIndex]?.text ?? "";
    const style = getComputedStyle(el);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    }
    const textWidth = ctx ? ctx.measureText(selected).width : 0;
    const pl = Number.parseFloat(style.paddingLeft || "0") || 0;
    const pr = Number.parseFloat(style.paddingRight || "0") || 0;
    const available = el.clientWidth - pl - pr - 2;
    const ratio = textWidth > 0 ? available / textWidth : 1;
    const wrapHeight = (el.closest("label") as HTMLElement | null)?.getBoundingClientRect().height ?? el.clientHeight;
    const slack = available - textWidth;
    return { textWidth, available, ratio, wrapHeight, slack };
  });

  expect(metrics.available).toBeGreaterThan(metrics.textWidth + minTextPaddingPx);
  expect(metrics.slack).toBeLessThanOrEqual(maxSlackPx);
  if (metrics.textWidth > 34) {
    expect(metrics.ratio).toBeLessThanOrEqual(maxSlackRatio);
  }
  expect(metrics.wrapHeight).toBeLessThanOrEqual(maxWrapHeightPx);
}

async function readSelectOptions(select: Locator): Promise<OptionMeta[]> {
  return select.locator("option").evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: (node as HTMLOptionElement).value,
      text: (node as HTMLOptionElement).textContent?.trim() ?? "",
    })),
  );
}

export async function verifySelectRepresentativeOptions(
  select: Locator,
  thresholds: UiReadabilityThresholds = {},
): Promise<void> {
  await expect(select).toBeVisible();
  const options = await readSelectOptions(select);
  if (options.length === 0) return;

  const sortedByText = [...options].sort((a, b) => a.text.length - b.text.length);
  const candidates = [options[0], sortedByText[0], sortedByText[sortedByText.length - 1], options[options.length - 1]]
    .filter(Boolean)
    .map((item) => item.value)
    .filter((value, index, arr) => arr.indexOf(value) === index);

  for (const value of candidates) {
    await select.selectOption(value);
    await assertSelectReadable(select, thresholds);
  }
}
