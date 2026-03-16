import { useState, useRef, useCallback, useEffect } from "react";
import type { Lang } from "../i18n";
import type { UserState } from "../types/account";
import type { Scene, Project } from "../model";
import type { PlatformPresetId } from "../config/platformPresets";
import { getPlatformPreset } from "../config/platformPresets";
import { buildPromptForScene } from "../utils/promptEngine";
import {
  probeComfyUi,
  probeDrawThings,
  runComfyUiImage,
  runComfyUiVideoPreview,
  runDrawThingsTxt2Img,
  defaultComfyUiBaseUrls,
  defaultDrawThingsBaseUrls,
  type LocalProviderStatus,
} from "../utils/localGeneration";
import { safeExportName } from "../utils/naming";
import { reserveCredits, finalizeReservedCredits, rollbackReservedCredits } from "../services/creditService";
import { creditCostForProfile } from "../services/billingService";
import { canUseHostedGeneration, canUseBringYourOwnApi } from "../utils/entitlement";
import {
  loadGenerationPreferences,
  saveGenerationPreferences,
  currentProfileForMedia,
  type StoredGenerationPrefs,
  type GenerationProfile,
} from "../features/pro-workspace/utils/generationPreferences";

export type ProGenerationSource = "hosted" | "byo";

export type ProGeneratedAsset = {
  id: string;
  sceneId: string;
  kind: "image" | "video";
  title: string;
  prompt: string;
  source: ProGenerationSource;
  strategyPlatformId: PlatformPresetId;
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  ownedUrls: string[];
  createdAt: string;
};

const LOCAL_TEST_IMAGE_PROVIDER = "comfyui" as const;

export function useProAssets(
  lang: Lang,
  accountUser: UserState | null,
  accountCredits: number,
  safeProject: Project,
  scene: Scene,
  sceneIdx: number,
  savePlatformId: PlatformPresetId,
  openBillingPage: (page: "upgrade" | "credits") => void,
  openAccountCenter: (section: string) => void,
  openNotEnoughCredits: (msg: string) => void,
  refreshAccountState: () => Promise<void>
) {
  const [proAssetsBySceneId, setProAssetsBySceneId] = useState<Record<string, ProGeneratedAsset[]>>({});
  const [proActiveAssetBySceneId, setProActiveAssetBySceneId] = useState<Record<string, string>>({});
  const [proAssetMenuId, setProAssetMenuId] = useState<string | null>(null);
  const [proGenerateBusy, setProGenerateBusy] = useState(false);
  const [proGenerateHint, setProGenerateHint] = useState("");
  const [proAdvancedSettingsOpen, setProAdvancedSettingsOpen] = useState(false);
  const [proProfileDropdownOpen, setProProfileDropdownOpen] = useState(false);
  const [proGenerationSource, setProGenerationSource] = useState<ProGenerationSource>("hosted");
  const [proGenPrefs, setProGenPrefs] = useState<StoredGenerationPrefs>(() => loadGenerationPreferences(null));
  const [comfyStatus, setComfyStatus] = useState<LocalProviderStatus>({ provider: "comfyui", state: "idle" });
  const [drawThingsStatus, setDrawThingsStatus] = useState<LocalProviderStatus>({ provider: "drawthings", state: "idle" });

  const proAssetsRef = useRef<Record<string, ProGeneratedAsset[]>>({});
  const proProfileDropdownRef = useRef<HTMLDivElement | null>(null);

  const sceneAssetKey = scene.id || `scene_${sceneIdx + 1}`;
  const mediaMode = scene?.config?.mediaMode ?? "video" as "image" | "video";
  const currentSceneAssets = proAssetsBySceneId[sceneAssetKey] ?? [];
  const currentSceneActiveAssetId = proActiveAssetBySceneId[sceneAssetKey] ?? "canvas";
  const currentSceneActiveAsset = currentSceneAssets.find((a) => a.id === currentSceneActiveAssetId) ?? null;
  const currentGenProfile = currentProfileForMedia(proGenPrefs, mediaMode) as any;
  const videoSeconds = Math.max(1, Math.ceil(Number(scene?.duration_s) || 5));
  const hostedCostPreview = creditCostForProfile(currentGenProfile, mediaMode === "video" ? videoSeconds : 1);

  useEffect(() => { proAssetsRef.current = proAssetsBySceneId; }, [proAssetsBySceneId]);

  useEffect(() => {
    return () => {
      for (const assets of Object.values(proAssetsRef.current)) {
        for (const asset of assets) {
          for (const url of asset.ownedUrls) {
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!proGenerateHint) return;
    const timer = window.setTimeout(() => setProGenerateHint(""), 1800);
    return () => window.clearTimeout(timer);
  }, [proGenerateHint]);

  useEffect(() => {
    if (!proAssetMenuId) return;
    const onPointerDown = () => setProAssetMenuId(null);
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [proAssetMenuId]);

  useEffect(() => {
    if (!proProfileDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (proProfileDropdownRef.current && !proProfileDropdownRef.current.contains(e.target as Node)) {
        setProProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [proProfileDropdownOpen]);

  useEffect(() => {
    const userId = accountUser?.id ?? null;
    const prefs = loadGenerationPreferences(userId);
    setProGenPrefs(prefs);
    setProGenerationSource(prefs.lastProviderMode);
  }, [accountUser?.id]);

  const refreshLocalProviders = useCallback(async () => {
    setComfyStatus({ provider: "comfyui", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
    setDrawThingsStatus({ provider: "drawthings", state: "checking", detail: lang === "zh" ? "探测中..." : "checking..." });
    const [nextComfy, nextDraw] = await Promise.all([
      probeComfyUi(defaultComfyUiBaseUrls()),
      probeDrawThings(defaultDrawThingsBaseUrls()),
    ]);
    setComfyStatus(nextComfy);
    setDrawThingsStatus(nextDraw);
    return { nextComfy, nextDraw };
  }, [lang]);

  function makeProAssetId(prefix: string) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function revokeAssetUrls(asset: ProGeneratedAsset | null | undefined) {
    if (!asset) return;
    for (const url of asset.ownedUrls) {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    }
  }

  function resetProGeneratedAssets() {
    setProAssetsBySceneId((prev) => {
      for (const assets of Object.values(prev)) for (const a of assets) revokeAssetUrls(a);
      return {};
    });
    setProActiveAssetBySceneId({});
    setProAssetMenuId(null);
  }

  function setActiveProAsset(sceneKey: string, assetId: string) {
    setProActiveAssetBySceneId((prev) => ({ ...prev, [sceneKey]: assetId }));
  }

  function appendProAsset(sceneKey: string, asset: ProGeneratedAsset) {
    setProAssetsBySceneId((prev) => ({ ...prev, [sceneKey]: [...(prev[sceneKey] ?? []), asset] }));
    setActiveProAsset(sceneKey, asset.id);
  }

  function deleteProAsset(sceneKey: string, assetId: string) {
    setProAssetsBySceneId((prev) => {
      const current = prev[sceneKey] ?? [];
      const target = current.find((a) => a.id === assetId);
      revokeAssetUrls(target);
      const next = current.filter((a) => a.id !== assetId);
      const updated = { ...prev };
      if (next.length) updated[sceneKey] = next;
      else delete updated[sceneKey];
      return updated;
    });
    setProActiveAssetBySceneId((prev) =>
      prev[sceneKey] !== assetId ? prev : { ...prev, [sceneKey]: "canvas" }
    );
    setProAssetMenuId((prev) => (prev === assetId ? null : prev));
  }

  function proAssetLabel(kind: "image" | "video", index: number) {
    if (lang === "zh") return kind === "image" ? `图 ${index}` : `视频 ${index}`;
    return kind === "image" ? `Image ${index}` : `Video ${index}`;
  }

  function setProGenerationSourceAndPersist(source: ProGenerationSource) {
    setProGenerationSource(source);
    saveGenerationPreferences(accountUser?.id ?? null, { lastProviderMode: source });
    setProGenPrefs((prev) => ({ ...prev, lastProviderMode: source }));
  }

  function setGenerationProfile(profile: GenerationProfile) {
    if (profile === "image_standard" || profile === "image_hq") {
      saveGenerationPreferences(accountUser?.id ?? null, { lastImageProfile: profile });
      setProGenPrefs((prev) => ({ ...prev, lastImageProfile: profile }));
    } else {
      saveGenerationPreferences(accountUser?.id ?? null, { lastVideoProfile: profile });
      setProGenPrefs((prev) => ({ ...prev, lastVideoProfile: profile }));
    }
    setProProfileDropdownOpen(false);
  }

  function downloadProAsset(asset: ProGeneratedAsset) {
    const href = asset.kind === "video" ? asset.videoUrl : asset.imageUrl;
    if (!href) return;
    const link = document.createElement("a");
    link.href = href;
    link.download = `${safeExportName(asset.title) || asset.id}.${asset.kind === "video" ? "mp4" : "png"}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function resolveByoProviderForMedia(nextMediaMode: "image" | "video"): "fal" | "runway" | null {
    const creds = accountUser ? null : null; // BYO credentials from accountUser context
    if (!creds) return null;
    return null;
  }

  function resolveProGenerationPlatformId(source: ProGenerationSource, nextMediaMode: "image" | "video"): PlatformPresetId {
    if (source === "byo") {
      const provider = resolveByoProviderForMedia(nextMediaMode);
      if (provider === "runway") return "runway";
      if (provider === "fal") return "fal";
    }
    return nextMediaMode === "video" ? "runway" : "fal";
  }

  async function generateProAsset(requestedSource: ProGenerationSource = proGenerationSource) {
    if (proGenerateBusy) return;

    if (requestedSource === "hosted") {
      if (!canUseHostedGeneration(accountUser)) { openBillingPage("upgrade"); return; }
    } else {
      if (!accountUser) { openAccountCenter("auth"); return; }
      if (!canUseBringYourOwnApi(accountUser)) { openAccountCenter("api"); return; }
    }

    const strategyPlatformId = resolveProGenerationPlatformId(requestedSource, mediaMode);
    const prompt = buildPromptForScene({
      project: safeProject,
      scene,
      lang,
      platformId: savePlatformId,
      profile: getPlatformPreset(savePlatformId).baseProfile,
      workspace: "pro",
    }).finalCopyPrompt.trim();

    const resolution = mediaMode === "video" ? "512x288" : "576x320";
    const seed = 101 + currentSceneAssets.length;
    const cost = requestedSource === "hosted" ? creditCostForProfile(currentGenProfile, mediaMode === "video" ? videoSeconds : 1) : 0;
    let reservedEntryId = "";

    setProGenerateBusy(true);
    setProAssetMenuId(null);

    try {
      if (requestedSource === "hosted" && accountUser) {
        if (accountCredits < cost) {
          setProGenerateBusy(false);
          openNotEnoughCredits(
            lang === "zh"
              ? `Credits 不足。需要 ${cost}，当前余额 ${accountCredits}。`
              : `Not enough credits. Need ${cost}, available ${accountCredits}.`
          );
          openBillingPage("credits");
          return;
        }
        const reserved = await reserveCredits(accountUser.id, cost, `pro_generate_${mediaMode}`);
        reservedEntryId = reserved.id;
      }

      // TODO(P0-云端): 接入真实 fal/runway API 后替换此处本地引擎调用
      const localImage = await runComfyUiImage({
        prompt,
        resolution,
        seed,
        baseUrls: defaultComfyUiBaseUrls(),
        preferredCheckpoint: comfyStatus.checkpoint,
      });

      const imageCount = currentSceneAssets.filter((a) => a.kind === "image").length + 1;
      appendProAsset(sceneAssetKey, {
        id: makeProAssetId("image"),
        sceneId: sceneAssetKey,
        kind: "image",
        title: proAssetLabel("image", imageCount),
        prompt,
        source: requestedSource,
        strategyPlatformId,
        imageUrl: localImage.imageUrl,
        ownedUrls: [localImage.imageUrl],
        createdAt: new Date().toISOString(),
      });

      if (requestedSource === "hosted" && accountUser && reservedEntryId) {
        await finalizeReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      setProGenerateHint(lang === "zh" ? "已生成新结果" : "New result generated");
    } catch (error) {
      if (requestedSource === "hosted" && accountUser && reservedEntryId) {
        await rollbackReservedCredits(accountUser.id, reservedEntryId);
        await refreshAccountState();
      }
      const message = error instanceof Error ? error.message : String(error);
      setProGenerateHint(lang === "zh" ? `生成失败：${message}` : `Generation failed: ${message}`);
    } finally {
      setProGenerateBusy(false);
    }
  }

  return {
    proAssetsBySceneId,
    proActiveAssetBySceneId,
    proAssetMenuId, setProAssetMenuId,
    proGenerateBusy,
    proGenerateHint,
    proAdvancedSettingsOpen, setProAdvancedSettingsOpen,
    proProfileDropdownOpen, setProProfileDropdownOpen,
    proProfileDropdownRef,
    proGenerationSource,
    proGenPrefs,
    comfyStatus, setComfyStatus,
    drawThingsStatus, setDrawThingsStatus,
    currentGenProfile,
    hostedCostPreview,
    videoSeconds,
    currentSceneAssets,
    currentSceneActiveAssetId,
    currentSceneActiveAsset,
    sceneAssetKey,
    mediaMode,
    refreshLocalProviders,
    resetProGeneratedAssets,
    setActiveProAsset,
    appendProAsset,
    deleteProAsset,
    downloadProAsset,
    generateProAsset,
    setProGenerationSourceAndPersist,
    setGenerationProfile,
  };
}
