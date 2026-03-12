import React from "react";
import { createPortal } from "react-dom";
import { Check, CreditCard, Crown, X } from "lucide-react";
import type { Lang } from "../../i18n";
import type { UserState } from "../../types/account";
import type { CreditPackConfig, ProPlanConfig } from "../../types/billing";
import { LEGAL_DOCS, legalText, type LegalDocId } from "../../content/legal";
import type { LocalProviderStatus } from "../../utils/localGeneration";

type BillingPage = "upgrade" | "credits";
type LocalTestProvider = "comfyui" | "drawthings";

type Props = {
  open: boolean;
  page: BillingPage | null;
  lang: Lang;
  user: UserState | null;
  creditsBalance: number;
  creditPacks: CreditPackConfig[];
  proPlan: ProPlanConfig | null;
  billingBusy: boolean;
  localTestBusy: boolean;
  localTestHint: string;
  localProviderStatus: {
    comfy: LocalProviderStatus;
    draw: LocalProviderStatus;
  };
  billingLegalAccepted: boolean;
  onClose: () => void;
  onOpenUpgrade: () => void;
  onOpenCredits: () => void;
  onProbeLocalProviders: () => void;
  onRunLocalTest: (provider: LocalTestProvider) => void;
  onRequireAuth: () => void;
  onBillingLegalAcceptedChange: (value: boolean) => void;
  onUpgrade: () => void;
  onBuyCredits: (packId: string) => void;
  onManageBilling: () => void;
};

const featureRows = [
  { label: "Scene structure editor", free: true, pro: true },
  { label: "Multi scene workflow", free: false, pro: true },
  { label: "Reference images", free: false, pro: true },
  { label: "Unlimited projects", free: false, pro: true },
  { label: "AI generation", free: false, pro: true }
];

export function BillingOverlay(props: Props) {
  const {
    open,
    page,
    lang,
    user,
    creditsBalance,
    creditPacks,
    proPlan,
    billingBusy,
    localTestBusy,
    localTestHint,
    localProviderStatus,
    billingLegalAccepted,
    onClose,
    onOpenUpgrade,
    onOpenCredits,
    onProbeLocalProviders,
    onRunLocalTest,
    onRequireAuth,
    onBillingLegalAcceptedChange,
    onUpgrade,
    onBuyCredits,
    onManageBilling
  } = props;
  const [activeLegalDoc, setActiveLegalDoc] = React.useState<LegalDocId | null>(null);
  const [localProvider, setLocalProvider] = React.useState<LocalTestProvider>("comfyui");
  const legalDoc = activeLegalDoc ? LEGAL_DOCS[activeLegalDoc] : null;

  if (!open || !page) return null;

  const localStatusText = (status: LocalProviderStatus) => {
    if (status.state === "ready") return status.baseUrl ? `ready · ${status.baseUrl}` : "ready";
    if (status.state === "checking") return "checking...";
    if (status.state === "handoff") return status.detail || "handoff only";
    return status.error || status.detail || "unavailable";
  };

  return createPortal(
    <div style={styles.mask} onMouseDown={onClose} role="presentation">
      <div
        style={styles.sheet}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div style={styles.head}>
          <div>
            <div style={styles.eyebrow}>Billing</div>
            <div style={styles.title}>{page === "upgrade" ? "Upgrade your scene workflow" : "Buy AI generation credits"}</div>
            <div style={styles.subTitle}>
              {page === "upgrade"
                ? "Design complex AI scenes faster and with more control."
                : "Use credits to generate images and videos."}
            </div>
          </div>
          <div style={styles.headActions}>
            <button type="button" style={{ ...styles.tab, ...(page === "upgrade" ? styles.tabOn : null) }} onClick={onOpenUpgrade} data-testid="billing-tab-upgrade">
              Upgrade
            </button>
            <button type="button" style={{ ...styles.tab, ...(page === "credits" ? styles.tabOn : null) }} onClick={onOpenCredits} data-testid="billing-tab-credits">
              Credits
            </button>
            <button type="button" style={styles.tab} onClick={onManageBilling} data-testid="billing-manage">
              Manage billing
            </button>
            <button type="button" style={styles.iconBtn} onClick={onClose} data-testid="billing-close">
              <X size={16} />
            </button>
          </div>
        </div>

        {page === "upgrade" ? (
          <section style={styles.content} data-testid="billing-upgrade-page">
            <div style={styles.priceGrid}>
              <article style={styles.priceCard} data-testid="upgrade-card-free">
                <div style={styles.priceTier}>Free</div>
                <div style={styles.priceValue}>$0</div>
                <div style={styles.priceMeta}>Scene structure tools only</div>
                <div style={styles.blockTitle}>Included</div>
                <ul style={styles.list}>
                  <li>Scene structure editor</li>
                  <li>Basic storyboard</li>
                  <li>Object placement</li>
                  <li>Prompt export</li>
                </ul>
                <div style={styles.blockTitle}>Limits</div>
                <ul style={styles.listMuted}>
                  <li>Limited projects</li>
                  <li>No AI generation</li>
                </ul>
              </article>

              <article style={{ ...styles.priceCard, ...styles.priceCardOn }} data-testid="upgrade-card-pro">
                <div style={styles.priceBadge}>Recommended</div>
                <div style={styles.priceTier}><Crown size={16} />Pro</div>
                <div style={styles.priceValue}>${proPlan?.monthlyUsdPrice ?? 12} <span style={styles.priceSlash}>/ month</span></div>
                <div style={styles.priceMeta}>AI generation still uses credits</div>
                <ul style={styles.list}>
                  <li>Advanced scene editor</li>
                  <li>Unlimited projects</li>
                  <li>Reference images</li>
                  <li>Multi-scene workflow</li>
                  <li>Prompt optimization</li>
                  <li>+ {proPlan?.monthlyCredits ?? 500} AI credits monthly</li>
                </ul>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={user ? onUpgrade : onRequireAuth}
                  disabled={billingBusy || user?.tier === "pro" || Boolean(user && !billingLegalAccepted)}
                  data-testid="upgrade-pro-cta"
                >
                  {user?.tier === "pro" ? "Current plan" : user ? "Upgrade to Pro" : "Sign in to continue"}
                </button>
              </article>
            </div>

            <div style={styles.noteCard} data-testid="upgrade-credits-note">
              <div>AI image and video generation uses credits.</div>
              <div>Credits are included with Pro and can be purchased separately.</div>
            </div>

            <div style={styles.localTestCard} data-testid="billing-local-test-card">
              <div style={styles.blockTitle}>
                {lang === "zh" ? "本地测试生成（跳过会员）" : "Local test generation (membership bypass)"}
              </div>
              <div style={styles.localTestDesc}>
                {lang === "zh"
                  ? "用于本地链路调试：选择 ComfyUI 或 Draw Things，直接本地生成。"
                  : "For local pipeline debugging: choose ComfyUI or Draw Things and generate locally."}
              </div>
              <div style={styles.localTestRow}>
                <select
                  value={localProvider}
                  onChange={(e) => setLocalProvider(e.target.value as LocalTestProvider)}
                  style={styles.localSelect}
                  data-testid="billing-local-provider-select"
                >
                  <option value="comfyui">ComfyUI</option>
                  <option value="drawthings">Draw Things</option>
                </select>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={onProbeLocalProviders}
                  disabled={localTestBusy}
                  data-testid="billing-local-probe"
                >
                  {lang === "zh" ? "检测本地 API" : "Check local APIs"}
                </button>
                <button
                  type="button"
                  style={styles.primaryBtn}
                  onClick={() => onRunLocalTest(localProvider)}
                  disabled={localTestBusy}
                  data-testid="billing-local-generate"
                >
                  {localTestBusy
                    ? (lang === "zh" ? "本地生成中..." : "Running local generation...")
                    : (lang === "zh" ? "本地测试生成" : "Run local test generate")}
                </button>
              </div>
              <div style={styles.localStatusGrid}>
                <div style={styles.localStatusItem}>
                  <span style={styles.localStatusLabel}>ComfyUI</span>
                  <span style={styles.localStatusValue}>{localStatusText(localProviderStatus.comfy)}</span>
                </div>
                <div style={styles.localStatusItem}>
                  <span style={styles.localStatusLabel}>Draw Things</span>
                  <span style={styles.localStatusValue}>{localStatusText(localProviderStatus.draw)}</span>
                </div>
              </div>
              {localTestHint ? (
                <div style={styles.localHint} data-testid="billing-local-hint">
                  {localTestHint}
                </div>
              ) : null}
            </div>

            <div style={styles.legalCard}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={billingLegalAccepted}
                  onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                  data-testid="billing-legal-consent"
                />
                <span>I agree to the Billing Terms and Refund Policy before payment.</span>
              </label>
              <div style={styles.legalLinks}>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("billing")} data-testid="billing-open-billing-terms">
                  {legalText("en", LEGAL_DOCS.billing.title)}
                </button>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("refund")} data-testid="billing-open-refund-policy">
                  {legalText("en", LEGAL_DOCS.refund.title)}
                </button>
              </div>
            </div>

            <div style={styles.compareCard}>
              <div style={styles.blockTitle}>Feature comparison</div>
              <div style={styles.compareTable}>
                <div style={styles.compareHead}>Feature</div>
                <div style={styles.compareHead}>Free</div>
                <div style={styles.compareHead}>Pro</div>
                {featureRows.map((row) => (
                  <React.Fragment key={row.label}>
                    <div style={styles.compareCell}>{row.label}</div>
                    <div style={styles.compareCell}>{row.free ? <Check size={14} /> : "—"}</div>
                    <div style={styles.compareCell}>{row.pro ? <Check size={14} /> : "—"}</div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section style={styles.content} data-testid="billing-credits-page">
            <div style={styles.balanceCard} data-testid="credits-balance">
              <div style={styles.balanceLabel}>Credits balance</div>
              <div style={styles.balanceValue}>Credits: {creditsBalance}</div>
            </div>

            <div style={styles.priceGrid}>
              {creditPacks.map((pack) => (
                <article key={pack.id} style={styles.priceCard} data-testid={`credits-card-${pack.id}`}>
                  <div style={styles.priceTier}><CreditCard size={16} />{pack.credits} credits</div>
                  <div style={styles.priceValue}>${pack.usdPrice}</div>
                  <div style={styles.priceMeta}>One-time purchase</div>
                  <button
                    type="button"
                    style={styles.primaryBtn}
                    onClick={user ? () => onBuyCredits(pack.id) : onRequireAuth}
                    disabled={billingBusy || Boolean(user && !billingLegalAccepted)}
                    data-testid={`credits-buy-${pack.id}`}
                  >
                    {user ? "Buy" : "Sign in to continue"}
                  </button>
                </article>
              ))}
            </div>

            <div style={styles.compareCard}>
              <div style={styles.blockTitle}>Usage</div>
              <ul style={styles.list}>
                <li>1 image = 1 credit</li>
                <li>HD image = 3 credits</li>
                <li>Video = 20 credits</li>
              </ul>
            </div>

            <div style={styles.legalCard}>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={billingLegalAccepted}
                  onChange={(e) => onBillingLegalAcceptedChange(e.target.checked)}
                  data-testid="billing-legal-consent"
                />
                <span>I agree to the Billing Terms and Refund Policy before payment.</span>
              </label>
              <div style={styles.legalLinks}>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("billing")} data-testid="billing-open-billing-terms">
                  {legalText("en", LEGAL_DOCS.billing.title)}
                </button>
                <button type="button" style={styles.legalLinkBtn} onClick={() => setActiveLegalDoc("refund")} data-testid="billing-open-refund-policy">
                  {legalText("en", LEGAL_DOCS.refund.title)}
                </button>
              </div>
            </div>

            <div style={styles.noteCard}>
              <div>Credits are non-refundable once used.</div>
            </div>
          </section>
        )}
        {legalDoc ? (
          <div style={styles.legalModalMask} onMouseDown={() => setActiveLegalDoc(null)} role="presentation">
            <div
              style={styles.legalModal}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div style={styles.legalModalHead}>
                <div>
                  <div style={styles.eyebrow}>{legalText("en", legalDoc.title)}</div>
                  <div style={styles.legalMeta}>{`${legalDoc.version} · ${legalDoc.updatedAt}`}</div>
                </div>
                <button type="button" style={styles.iconBtn} onClick={() => setActiveLegalDoc(null)}>
                  <X size={16} />
                </button>
              </div>
              <div style={styles.legalSummary}>{legalText("en", legalDoc.summary)}</div>
              <div style={styles.legalDocBody}>
                {legalDoc.sections.map((item) => (
                  <section key={legalText("en", item.heading)} style={styles.legalSection}>
                    <div style={styles.legalSectionTitle}>{legalText("en", item.heading)}</div>
                    {item.body.map((paragraph) => (
                      <p key={legalText("en", paragraph)} style={styles.legalParagraph}>
                        {legalText("en", paragraph)}
                      </p>
                    ))}
                  </section>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  mask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.68)",
    backdropFilter: "blur(16px)",
    zIndex: 120,
    padding: 20,
    display: "grid",
    placeItems: "center"
  },
  sheet: {
    width: "min(1080px, calc(100vw - 40px))",
    maxHeight: "min(90vh, 940px)",
    overflowY: "auto",
    borderRadius: 28,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "linear-gradient(180deg, rgba(10,11,16,0.98), rgba(8,9,14,0.96))",
    boxShadow: "0 40px 120px rgba(0,0,0,0.42)",
    color: "#f5f7fb",
    padding: 24,
    display: "grid",
    gap: 20
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.46)",
    marginBottom: 8
  },
  title: {
    fontSize: 38,
    lineHeight: 1.06,
    fontWeight: 760,
    letterSpacing: "-0.04em"
  },
  subTitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.72)"
  },
  headActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  tab: {
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#f5f7fb",
    padding: "0 14px",
    cursor: "pointer"
  },
  tabOn: {
    background: "rgba(255,255,255,0.12)"
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#f5f7fb",
    display: "grid",
    placeItems: "center",
    cursor: "pointer"
  },
  content: {
    display: "grid",
    gap: 20
  },
  priceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16
  },
  priceCard: {
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)",
    padding: 20,
    display: "grid",
    gap: 12,
    alignContent: "start"
  },
  priceCardOn: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))"
  },
  priceBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    minHeight: 26,
    padding: "0 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    fontSize: 12
  },
  priceTier: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 20,
    fontWeight: 700
  },
  priceValue: {
    fontSize: 34,
    fontWeight: 760,
    letterSpacing: "-0.05em"
  },
  priceSlash: {
    fontSize: 18,
    fontWeight: 500,
    color: "rgba(255,255,255,0.62)"
  },
  priceMeta: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "rgba(255,255,255,0.68)"
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: 680
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 8,
    color: "rgba(255,255,255,0.9)"
  },
  listMuted: {
    margin: 0,
    paddingLeft: 18,
    display: "grid",
    gap: 8,
    color: "rgba(255,255,255,0.62)"
  },
  primaryBtn: {
    marginTop: 6,
    height: 42,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "#f5f7fb",
    color: "#090b10",
    fontWeight: 700,
    cursor: "pointer"
  },
  noteCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    display: "grid",
    gap: 8,
    color: "rgba(255,255,255,0.84)",
    lineHeight: 1.6
  },
  localTestCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(70,90,188,0.16), rgba(34,44,98,0.12))",
    padding: 18,
    display: "grid",
    gap: 10
  },
  localTestDesc: {
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(236,241,255,0.86)"
  },
  localTestRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap"
  },
  localSelect: {
    minWidth: 148,
    minHeight: 36,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5f7fb",
    padding: "0 10px",
    fontSize: 13
  },
  secondaryBtn: {
    minHeight: 36,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.06)",
    color: "#f5f7fb",
    padding: "0 14px",
    cursor: "pointer",
    fontWeight: 640,
    fontSize: 13
  },
  localStatusGrid: {
    display: "grid",
    gap: 8,
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
  },
  localStatusItem: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    padding: "8px 10px",
    display: "grid",
    gap: 4
  },
  localStatusLabel: {
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.6)"
  },
  localStatusValue: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.4
  },
  localHint: {
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    padding: "8px 10px",
    fontSize: 12.5,
    color: "rgba(241,245,255,0.96)",
    lineHeight: 1.5
  },
  legalCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    display: "grid",
    gap: 12
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.86)"
  },
  legalLinks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap"
  },
  legalLinkBtn: {
    minHeight: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#f5f7fb",
    padding: "0 12px",
    cursor: "pointer"
  },
  compareCard: {
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    padding: 18,
    display: "grid",
    gap: 14
  },
  compareTable: {
    display: "grid",
    gridTemplateColumns: "minmax(180px, 1.6fr) repeat(2, minmax(90px, 0.8fr))",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderLeft: "1px solid rgba(255,255,255,0.08)"
  },
  compareHead: {
    padding: "12px 14px",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,0.58)"
  },
  compareCell: {
    minHeight: 46,
    padding: "12px 14px",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    color: "rgba(255,255,255,0.88)"
  },
  balanceCard: {
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))",
    padding: 20,
    display: "grid",
    gap: 8
  },
  balanceLabel: {
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.54)"
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: 760,
    letterSpacing: "-0.04em"
  },
  legalModalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    backdropFilter: "blur(8px)",
    display: "grid",
    placeItems: "center",
    padding: 16
  },
  legalModal: {
    width: "min(760px, calc(100vw - 32px))",
    maxHeight: "min(84vh, 900px)",
    overflow: "hidden",
    borderRadius: 22,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "linear-gradient(180deg, rgba(11,13,18,0.98), rgba(8,10,16,0.97))",
    display: "grid",
    gridTemplateRows: "auto auto minmax(0,1fr)"
  },
  legalModalHead: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 18px 0"
  },
  legalMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "rgba(255,255,255,0.56)"
  },
  legalSummary: {
    padding: "12px 18px 0",
    fontSize: 13,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.82)"
  },
  legalDocBody: {
    overflowY: "auto",
    padding: 18,
    display: "grid",
    gap: 16
  },
  legalSection: {
    display: "grid",
    gap: 8
  },
  legalSectionTitle: {
    fontSize: 14,
    fontWeight: 700
  },
  legalParagraph: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.82)"
  }
};
