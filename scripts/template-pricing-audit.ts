/**
 * Template pricing audit: scan template library, run scorer + resolver, output counts and ratio.
 * Run: npx tsx scripts/template-pricing-audit.ts
 *
 * Target ratios (for reference):
 *   F0 ≈ 10%
 *   C1+C2 ≈ 30%
 *   P2+P3 ≈ 60%
 */

import { getTemplateIndex, loadTemplatePayloadById } from "../src/template-engine";
import {
  payloadToPricingInput,
  scoreTemplate,
  resolveTemplatePricing,
  type TemplatePricingBucket
} from "../src/pricing";
const BUCKETS: TemplatePricingBucket[] = ["F0", "C1", "C2", "P2", "P3"];

type AuditRow = {
  id: string;
  nameEn: string;
  nameZh: string;
  bucket: TemplatePricingBucket;
  score: number;
  creditPrice: number;
  proFeatureCount: number;
  capabilityTags: string[];
  indexCost: number;
  indexIsFree: boolean;
  mismatch: boolean;
};

async function main(): Promise<void> {
  const index = getTemplateIndex();
  const rows: AuditRow[] = [];
  let loadFail = 0;

  for (const t of index) {
    let payload;
    try {
      payload = await loadTemplatePayloadById(t.id);
    } catch {
      loadFail += 1;
      continue;
    }
    if (!payload) {
      loadFail += 1;
      continue;
    }

    const input = payloadToPricingInput(payload);
    const scoreResult = scoreTemplate(input);
    const result = resolveTemplatePricing(scoreResult);

    const indexCost = t.cost;
    const indexIsFree = t.isFree;
    const resolvedFree = result.pricingBucket === "F0";
    const resolvedCost = result.creditPrice;
    const mismatch =
      indexIsFree !== resolvedFree || (resolvedCost > 0 && indexCost !== resolvedCost);

    rows.push({
      id: t.id,
      nameEn: t.nameEn,
      nameZh: t.nameZh,
      bucket: result.pricingBucket,
      score: result.score,
      creditPrice: result.creditPrice,
      proFeatureCount: scoreResult.proFeatureCount,
      capabilityTags: result.capabilityTags,
      indexCost,
      indexIsFree,
      mismatch
    });
  }

  const total = rows.length;
  const byBucket = Object.fromEntries(BUCKETS.map((b) => [b, 0])) as Record<TemplatePricingBucket, number>;
  rows.forEach((r) => {
    byBucket[r.bucket] += 1;
  });

  console.log("--- Template pricing audit ---\n");
  console.log(`Total templates: ${total}`);
  if (loadFail) console.log(`Load failed: ${loadFail}`);
  console.log("");
  console.log("Bucket counts:");
  BUCKETS.forEach((b) => {
    const n = byBucket[b];
    const pct = total ? ((n / total) * 100).toFixed(1) : "0";
    console.log(`  ${b}: ${n} (${pct}%)`);
  });
  console.log("");
  const creditsTotal = byBucket.C1 + byBucket.C2;
  const proTotal = byBucket.P2 + byBucket.P3;
  const creditsPct = total ? ((creditsTotal / total) * 100).toFixed(1) : "0";
  const proPct = total ? ((proTotal / total) * 100).toFixed(1) : "0";
  console.log("Ratio summary:");
  console.log(`  F0: ${byBucket.F0} (~${total ? ((byBucket.F0 / total) * 100).toFixed(0) : 0}%)`);
  console.log(`  C1+C2: ${creditsTotal} (~${creditsPct}%)`);
  console.log(`  P2+P3: ${proTotal} (~${proPct}%)`);
  console.log("");
  console.log("Target: F0≈10%, C1+C2≈30%, P2+P3≈60%");
  console.log("");

  const mismatched = rows.filter((r) => r.mismatch);
  if (mismatched.length) {
    console.log("--- Index vs resolved mismatch (suggest manual review) ---");
    mismatched.slice(0, 30).forEach((r) => {
      console.log(
        `  ${r.id} | ${r.nameEn} | index: ${r.indexIsFree ? "free" : r.indexCost} credits | resolved: ${r.bucket} (${r.creditPrice} credits) score=${r.score}`
      );
    });
    if (mismatched.length > 30) console.log(`  ... and ${mismatched.length - 30} more`);
    console.log("");
  }

  const ambiguous = rows.filter(
    (r) =>
      (r.bucket === "C1" && r.score >= 3) ||
      (r.bucket === "C2" && r.score <= 4) ||
      (r.bucket === "P2" && r.score <= 6) ||
      (r.bucket === "P3" && r.score <= 7)
  );
  if (ambiguous.length) {
    console.log("--- Top ambiguous (near bucket boundaries) ---");
    ambiguous
      .sort((a, b) => Math.abs(a.score - 4) - Math.abs(b.score - 4))
      .slice(0, 15)
      .forEach((r) => {
        console.log(`  ${r.id} | ${r.bucket} score=${r.score} | ${r.nameEn}`);
      });
    console.log("");
  }

  const overpoweredFree = rows.filter(
    (r) => r.bucket === "F0" && (r.score > 2 || r.proFeatureCount > 0)
  );
  if (overpoweredFree.length) {
    console.log("--- Top overpowered free (F0 but high score or pro-like) ---");
    overpoweredFree
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .forEach((r) => {
        console.log(`  ${r.id} | score=${r.score} proFeatures=${r.proFeatureCount} | ${r.nameEn}`);
      });
    console.log("");
  }

  const underpricedPro = rows.filter(
    (r) =>
      (r.bucket === "P2" || r.bucket === "P3") &&
      (r.score < 5 || (r.bucket === "P3" && r.proFeatureCount < 2))
  );
  if (underpricedPro.length) {
    console.log("--- Top underpriced pro (P2/P3 but low score or few pro features) ---");
    underpricedPro
      .sort((a, b) => a.score - b.score)
      .slice(0, 15)
      .forEach((r) => {
        console.log(`  ${r.id} | ${r.bucket} score=${r.score} proFeatures=${r.proFeatureCount} | ${r.nameEn}`);
      });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
