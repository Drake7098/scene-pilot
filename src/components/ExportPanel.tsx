import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Copy, Download, HelpCircle, MoreHorizontal } from "lucide-react";
import type { Lang } from "../i18n";
import type { Project } from "../model";
import type { PromptProfile } from "../utils/prompt";
import type { PromptExportAction, PromptExportTicket } from "../types/promptExport";
import { getRefBlob } from "../utils/localRefs";
import { detectSceneConflicts, type PromptConflict } from "../utils/conflictRules";
import { getPlatformPreset, PLATFORM_PRESETS } from "../config/platformPresets";
import type { PlatformPresetId } from "../config/platformPresets";
import { runPromptEngine } from "../utils/promptEngine";
import { splitMachineNotes } from "../utils/promptTail";
import { availableExportScopes, recommendExportMode, type ExportMode } from "../utils/exportViewModel";
import { useFieldState } from "../hooks/useFieldState";
import { useAllowedOptions } from "../hooks/useAllowedOptions";
import { FIELD_KEYS } from "../rules/fieldKeys";
import { defaultProjectName, safeExportName } from "../utils/naming";
import { acknowledgePolicy, getPolicyAckVersion, hasPolicyAck, logPolicyAction } from "../services/policyAckService";
import { UI_ACTION, UI_COLOR, UI_CONTROL, UI_EFFECT, UI_FONT, UI_INFO, UI_OPACITY, UI_PALETTE, UI_PANEL, UI_RADIUS, UI_SIZE, UI_STATUS, UI_TYPO } from "../uiTokens";
import type { PromptExportScope } from "../types/export";

type Props = {
  lang: Lang;
  project: Project;
  projectLabel?: string;
  sceneIdx: number;
  platformId?: PlatformPresetId;
  openExportNonce?: number;
  openExportAction?: "open" | "copy" | "package" | "prompt_txt" | "prompt_plus_refs";
  promptExportNote?: string;
  onPreparePromptExport?: (action: PromptExportAction) => Promise<PromptExportTicket>;
  onSettlePromptExport?: (reservationId: string | undefined, committed: boolean) => Promise<void>;
  onPlatformChange?: (id: PlatformPresetId) => void;
  selectedLayerId: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
  exportScope?: PromptExportScope;
  onExportScopeChange?: (scope: PromptExportScope) => void;
  /** Controlled export mode (quick/package) - when provided, syncs with Platform Mode */
  exportMode?: ExportMode;
  onExportModeChange?: (m: ExportMode) => void;
  /** Optional: called with a short message when an export/copy action succeeds (e.g. for FeedbackBar). */
  onFeedbackMessage?: (msg: string) => void;
  /** Optional: last used export directory handle for picker default location. */
  defaultExportDirectoryHandle?: any | null;
  /** Optional: emits selected export directory for host persistence. */
  onExportDirectorySelected?: (dirHandle: any, dirLabel: string) => void;
  userId?: string | null;
};

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

function limitRefLinks(raw: string, max: number): string {
  const lines = (raw ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.slice(0, max).join("\n");
}

function safeName(input: string): string {
  return safeExportName(input);
}

function refShort(type: "identity" | "appearance" | "style") {
  if (type === "identity") return "id";
  if (type === "appearance") return "app";
  return "style";
}

function extFromName(name: string) {
  const m = (name ?? "").trim().match(/\.([a-zA-Z0-9]{2,5})$/);
  return m ? m[1].toLowerCase() : "jpg";
}

type FlowFile = { path: string; content: string };
type FlowBlobFile = { path: string; refId: string };
type ZipEntry = { path: string; data: Uint8Array };
type ExportPackageType = "general" | "with_refs" | "without_refs" | "txt";
const OBJECT_REF_LIMIT = 1;

function stripReferenceHints(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => !/(reference|references|ref image|参考图|参考|上传参考)/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

function enhancePromptForExport(raw: string, mode: ExportPackageType, lang: Lang): string {
  if (mode === "with_refs") {
    const hint = lang === "zh"
      ? "参考图说明：上传 images/ 中的参考图，并优先保持主体、风格、构图与一致性。"
      : "Reference note: upload the reference images in images/ and preserve subject, style, composition, and consistency.";
    return `${raw.trimEnd()}\n\n${hint}\n`;
  }
  if (mode === "without_refs") {
    const stripped = stripReferenceHints(raw);
    const hint = lang === "zh"
      ? "无参考图模式：请仅依据文字描述生成，并补足主体细节、构图、风格、材质与光线。"
      : "No-reference mode: generate from text only and fully describe subject details, composition, style, material, and lighting.";
    return `${stripped}\n\n${hint}\n`;
  }
  return `${raw.trimEnd()}\n`;
}

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = table[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16LE(v: number): Uint8Array {
  return new Uint8Array([v & 255, (v >>> 8) & 255]);
}

function u32LE(v: number): Uint8Array {
  return new Uint8Array([v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]);
}

function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const size = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function buildZipStored(entries: ZipEntry[]): Blob {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path.replace(/^\/+/, ""));
    const data = entry.data;
    const crc = crc32(data);
    const size = data.length >>> 0;
    const flags = 0x0800; // UTF-8 filename

    const localHeader = concatBytes([
      u32LE(0x04034b50),
      u16LE(20),
      u16LE(flags),
      u16LE(0), // store
      u16LE(0),
      u16LE(0),
      u32LE(crc),
      u32LE(size),
      u32LE(size),
      u16LE(name.length),
      u16LE(0),
      name
    ]);
    localParts.push(localHeader, data);

    const centralHeader = concatBytes([
      u32LE(0x02014b50),
      u16LE(20),
      u16LE(20),
      u16LE(flags),
      u16LE(0), // store
      u16LE(0),
      u16LE(0),
      u32LE(crc),
      u32LE(size),
      u32LE(size),
      u16LE(name.length),
      u16LE(0),
      u16LE(0),
      u16LE(0),
      u16LE(0),
      u32LE(0),
      u32LE(localOffset),
      name
    ]);
    centralParts.push(centralHeader);
    localOffset += localHeader.length + data.length;
  }

  const centralDirectory = concatBytes(centralParts);
  const localBlob = concatBytes(localParts);
  const eocd = concatBytes([
    u32LE(0x06054b50),
    u16LE(0),
    u16LE(0),
    u16LE(entries.length),
    u16LE(entries.length),
    u32LE(centralDirectory.length),
    u32LE(localBlob.length),
    u16LE(0)
  ]);

  return new Blob([toArrayBuffer(localBlob), toArrayBuffer(centralDirectory), toArrayBuffer(eocd)], { type: "application/zip" });
}

async function writeTextToDirectory(dirHandle: any, fullPath: string, content: string) {
  const parts = fullPath.split("/").filter(Boolean);
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  const file = await current.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await file.createWritable();
  await writable.write(content);
  await writable.close();
}

async function writeBlobToDirectory(dirHandle: any, fullPath: string, blob: Blob) {
  const parts = fullPath.split("/").filter(Boolean);
  let current = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    current = await current.getDirectoryHandle(parts[i], { create: true });
  }
  const file = await current.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await file.createWritable();
  await writable.write(blob);
  await writable.close();
}

export function ExportPanel({
  lang,
  project,
  projectLabel,
  sceneIdx,
  platformId = "universal",
  openExportNonce = 0,
  openExportAction = "open",
  promptExportNote = "",
  onPreparePromptExport,
  onSettlePromptExport,
  onPlatformChange,
  selectedLayerId,
  onJumpToConflict,
  exportScope: controlledExportScope,
  onExportScopeChange,
  exportMode: controlledExportMode,
  onExportModeChange,
  onFeedbackMessage,
  defaultExportDirectoryHandle = null,
  onExportDirectorySelected,
  userId = null
}: Props) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflictAction, setPendingConflictAction] = useState<null | "copy" | "save" | "prompt_txt" | "prompt_plus_refs">(null);
  const [pendingConflicts, setPendingConflicts] = useState<PromptConflict[]>([]);
  const [actionHint, setActionHint] = useState("");
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [copyRiskAccepted, setCopyRiskAccepted] = useState(false);
  const [copyRiskError, setCopyRiskError] = useState("");
  const [exportPackageType, setExportPackageType] = useState<ExportPackageType>("general");
  const [exportRiskAccepted, setExportRiskAccepted] = useState(false);
  const [exportRiskError, setExportRiskError] = useState("");
  const [internalExportScope, setInternalExportScope] = useState<PromptExportScope>("current_scene");
  const exportScope = controlledExportScope ?? internalExportScope;
  const setExportScope = onExportScopeChange ?? setInternalExportScope;
  const [internalExportMode, setInternalExportMode] = useState<ExportMode>("prompt_only");
  const exportMode = controlledExportMode ?? internalExportMode;
  const setExportMode = onExportModeChange ?? setInternalExportMode;
  const [exporting, setExporting] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [moreExportOpen, setMoreExportOpen] = useState(false);
  const [readonlyHelpOpen, setReadonlyHelpOpen] = useState(false);
  const moreExportRef = useRef<HTMLDivElement>(null);
  const readonlyHelpRef = useRef<HTMLDivElement>(null);
  const canSaveDirectory = typeof window !== "undefined" && "showDirectoryPicker" in window;
  const copyPolicyAccepted = hasPolicyAck(userId, "copy_prompt");
  const exportPolicyAccepted = hasPolicyAck(userId, "export_project");

  const scenes = useMemo(() => project.scenes ?? [], [project.scenes]);
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIdx] ?? null;
  const scopeOptions = useMemo(() => availableExportScopes(project, safeIdx), [project, safeIdx]);
  const rangeField = useFieldState(FIELD_KEYS.EXPORT_RANGE, currentScene, project, lang);
  const rangeOptions = useAllowedOptions(FIELD_KEYS.EXPORT_RANGE, ["current_scene", "continuous_sequence"], currentScene, project, lang);
  const recommendedExportMode = useMemo(() => recommendExportMode(project, safeIdx), [project, safeIdx]);
  const sceneConflicts = useMemo(() => {
    if (!currentScene) return [];
    return detectSceneConflicts(currentScene, lang);
  }, [currentScene, lang]);

  useEffect(() => {
    if (!scopeOptions.includes(exportScope)) {
      setExportScope(scopeOptions[0] ?? "current_scene");
    }
  }, [scopeOptions, exportScope]);

  useEffect(() => {
    if (controlledExportMode == null) setInternalExportMode(recommendedExportMode);
  }, [recommendedExportMode, safeIdx, controlledExportMode]);

  function resetExportState() {
    setExporting(false);
  }

  useEffect(() => {
    if (!openExportNonce) return;
    resetExportState();
    if (openExportAction === "copy") {
      void guardBeforeExport("copy");
      return;
    }
    if (openExportAction === "prompt_txt") {
      applyExportPackageType("txt");
      void guardBeforeExportTxt();
      return;
    }
    if (openExportAction === "prompt_plus_refs") {
      if (sceneConflicts.length) {
        setPendingConflictAction("prompt_plus_refs");
        setPendingConflicts(sceneConflicts);
        setShowConflictModal(true);
      } else {
        void runExportPromptPlusRefs();
      }
      return;
    }
    if (openExportAction === "package") {
      applyExportPackageType("general");
      if (sceneConflicts.length) {
        setPendingConflictAction("save");
        setPendingConflicts(sceneConflicts);
        setShowConflictModal(true);
      } else {
        runOpenSaveModal("package");
      }
      return;
    }
    setShowExportModal(true);
  }, [openExportNonce, openExportAction]); // eslint-disable-line react-hooks/exhaustive-deps

  function applyExportPackageType(next: ExportPackageType) {
    setExportPackageType(next);
    setExportMode(next === "txt" ? "prompt_only" : "package");
  }

  void selectedLayerId;

  const platformPreset = useMemo(
    () => getPlatformPreset(platformId),
    [platformId]
  );
  const exportProfile: PromptProfile = platformPreset.baseProfile;

  const promptProject = useMemo<Project>(() => {
    const refLimit = OBJECT_REF_LIMIT;
    const sourceScenes = exportScope === "continuous_sequence" ? scenes.slice(safeIdx) : currentScene ? [currentScene] : [];
    const nextScenes = sourceScenes.map((s) => ({
      ...s,
      layers: (s.layers ?? []).map((l) => ({
        ...l,
        referenceLinks: limitRefLinks(l.referenceLinks ?? "", refLimit)
      }))
    }));
    return { ...project, scenes: nextScenes };
  }, [project, currentScene, exportScope, scenes, safeIdx]);

  const sceneTitle = useMemo(() => {
    if (!currentScene) return lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`;
    if (exportScope === "continuous_sequence") {
      return lang === "zh"
        ? `${(currentScene.name ?? "").trim() || currentScene.id || `分镜 ${safeIdx + 1}`} 起连续序列`
        : `${(currentScene.name ?? "").trim() || currentScene.id || `Scene ${safeIdx + 1}`} sequence`;
    }
    return (currentScene.name ?? "").trim() || currentScene.id || (lang === "zh" ? `分镜 ${safeIdx + 1}` : `Scene ${safeIdx + 1}`);
  }, [currentScene, lang, safeIdx, exportScope]);

  const promptPipeline = useMemo(() => runPromptEngine({
    project: promptProject,
    lang,
    profile: exportProfile,
    platformId,
    scope: exportScope
  }), [promptProject, lang, exportProfile, platformId, exportScope]);

  const { main: promptsMain, notes: promptsNotes } = useMemo(() => splitMachineNotes(promptPipeline.finalCopyPrompt), [promptPipeline.finalCopyPrompt]);
  const quickCopyPrompt = useMemo(() => promptPipeline.finalCopyPrompt.trimEnd(), [promptPipeline.finalCopyPrompt]);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove(); // ✅ 标准方式移除
    }
  }

  function renderOverlay(node: React.ReactNode) {
    if (typeof document === "undefined") return node;
    return createPortal(node, document.body);
  }

  useEffect(() => {
    const hasAnyModal = showExportModal || showConflictModal || copyConfirmOpen;
    if (!hasAnyModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showConflictModal) {
        setShowConflictModal(false);
        return;
      }
      if (showExportModal) {
        setShowExportModal(false);
        return;
      }
      if (copyConfirmOpen) {
        setCopyConfirmOpen(false);
        setCopyDone(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showExportModal, showConflictModal, copyConfirmOpen]);

  useEffect(() => {
    if (!actionHint) return;
    const t = window.setTimeout(() => setActionHint(""), 1800);
    return () => window.clearTimeout(t);
  }, [actionHint]);

  async function runCopyPrompt() {
    setCopyRiskAccepted(copyPolicyAccepted);
    setCopyRiskError("");
    setCopyDone(false);
    setCopyConfirmOpen(true);
  }

  async function confirmCopyPrompt() {
    if (!copyPolicyAccepted && !copyRiskAccepted) {
      setCopyRiskError(lang === "zh" ? "请先确认复制提示词风险提示。" : "Please confirm the prompt-copy disclosure first.");
      return;
    }
    let ticket: PromptExportTicket = { allowed: true };
    if (onPreparePromptExport) {
      ticket = await onPreparePromptExport("pro_copy");
      if (!ticket.allowed) return;
    }
    let committed = false;
    try {
      await copy(quickCopyPrompt);
      if (!copyPolicyAccepted) {
        acknowledgePolicy(userId, "copy_prompt");
        logPolicyAction(userId, "copy_prompt", "copy_prompt");
      }
      committed = true;
      setCopyDone(true);
      setActionHint(lang === "zh" ? "已复制当前提示词" : "Current prompt copied");
      onFeedbackMessage?.(lang === "zh" ? "已复制提示词" : "Prompt copied");
    } finally {
      if (onSettlePromptExport) {
        await onSettlePromptExport(ticket.reservationId, committed);
      }
    }
  }

  function runOpenSaveModal(mode?: ExportMode) {
    if (mode) {
      setExportMode(mode);
      setExportPackageType(mode === "prompt_only" ? "txt" : "general");
    }
    setExportRiskAccepted(exportPolicyAccepted);
    setExportRiskError("");
    setShowExportModal(true);
    resetExportState();
  }

  async function guardBeforeExport(action: "copy" | "save") {
    if (!sceneConflicts.length) {
      if (action === "copy") await runCopyPrompt();
      else runOpenSaveModal();
      return;
    }
    setPendingConflictAction(action);
    setPendingConflicts(sceneConflicts);
    setShowConflictModal(true);
  }

  /** Unified export: download prompt.txt only. Used by openExportAction "prompt_txt". */
  async function runExportTxt(): Promise<void> {
    let ticket: PromptExportTicket = { allowed: true };
    if (onPreparePromptExport) {
      ticket = await onPreparePromptExport("pro_export_prompt");
      if (!ticket.allowed) return;
    }
    setExporting(true);
    let committed = false;
    try {
      const res = await downloadQuickPromptFile();
      committed = res.ok;
      if (res.ok) {
        setActionHint(lang === "zh" ? "prompt.txt 下载成功" : "prompt.txt downloaded");
        onFeedbackMessage?.(lang === "zh" ? "已导出 TXT" : "Exported TXT");
      } else {
        setActionHint(res.fileLabel || (lang === "zh" ? "导出失败" : "Export failed"));
      }
    } finally {
      setExporting(false);
      if (onSettlePromptExport) {
        await onSettlePromptExport(ticket.reservationId, committed);
      }
    }
  }

  async function guardBeforeExportTxt() {
    if (!sceneConflicts.length) {
      await runExportTxt();
      return;
    }
    setPendingConflictAction("prompt_txt");
    setPendingConflicts(sceneConflicts);
    setShowConflictModal(true);
  }

  const flowBundle = useMemo(() => {
    const projectNameForFile = safeName(projectLabel || defaultProjectName(lang));
    const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
    const rootDir = "ScenePilotix";
    const projectDir = projectNameForFile || defaultProjectName(lang);
    const shouldIncludeRefs = exportPackageType === "general" || exportPackageType === "with_refs";

    const noRefProject: Project = {
      ...project,
      scenes: (project.scenes ?? []).map((scene) => ({
        ...scene,
        backgroundRef: undefined,
        layers: (scene.layers ?? []).map((layer) => ({
          ...layer,
          referenceLinks: "",
          localRefs: []
        }))
      }))
    };

    const packageProject = exportPackageType === "without_refs" ? noRefProject : project;
    const packageScenes = packageProject.scenes ?? [];
    const promptText = enhancePromptForExport(quickCopyPrompt, exportPackageType, lang);
    const packagePromptText = packageScenes.length
      ? packageScenes.map((scene, index) => {
          const singleScenePrompt = runPromptEngine({
            project: { ...packageProject, scenes: [scene] },
            lang,
            profile: exportProfile,
            platformId,
            scope: "current_scene"
          }).finalCopyPrompt;
          const title = scene.name?.trim() || scene.id || (lang === "zh" ? `分镜 ${index + 1}` : `Scene ${index + 1}`);
          return `## ${title}\n${enhancePromptForExport(singleScenePrompt, exportPackageType, lang).trimEnd()}`;
        }).join("\n\n")
      : promptText.trimEnd();

    const bgBlobFiles: FlowBlobFile[] = shouldIncludeRefs
      ? (project.scenes ?? []).flatMap((scene, sceneOrder) => {
          const bgRef = scene.backgroundRef;
          if (!bgRef?.id) return [];
          const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
          const ext = extFromName(bgRef.name);
          const fileName = `${sceneTag}__BG__${safeName(bgRef.name || `background.${ext}`)}`;
          return [{ path: `${projectDir}/images/${fileName}`, refId: bgRef.id }];
        })
      : [];

    const objectBlobFiles: FlowBlobFile[] = shouldIncludeRefs
      ? (project.scenes ?? []).flatMap((scene, sceneOrder) =>
          (scene.layers ?? []).flatMap((layer, idx) => {
            const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
            const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
            return (layer.localRefs ?? []).slice(0, OBJECT_REF_LIMIT).map((ref, i) => {
              const ext = extFromName(ref.name);
              const fileName = `${sceneTag}_${code}__${refShort(ref.type)}__${String(i + 1).padStart(2, "0")}.${ext}`;
              return { path: `${projectDir}/images/${fileName}`, refId: ref.id };
            });
          })
        )
      : [];

    const files: FlowFile[] = exportPackageType === "txt"
      ? [{ path: `${projectDir}/prompt.txt`, content: promptText }]
      : [
          { path: `${projectDir}/prompt.txt`, content: `${packagePromptText}\n` },
          { path: `${projectDir}/scene.json`, content: `${JSON.stringify(packageProject, null, 2)}\n` }
        ];

    const quickPromptFileName = `${projectNameForFile}__${shotNameForFile}__prompt.txt`;

    return {
      rootDir,
      projectDir,
      promptText,
      packagePromptText,
      quickPromptFileName,
      files,
      blobFiles: [...bgBlobFiles, ...objectBlobFiles]
    };
  }, [exportPackageType, exportProfile, lang, platformId, project, projectLabel, quickCopyPrompt, sceneTitle]);

  const promptPlusRefsBundle = useMemo(() => {
    const projectNameForFile = safeName(projectLabel || defaultProjectName(lang));
    const rootDir = "ScenePilotix";
    const projectDir = projectNameForFile || defaultProjectName(lang);
    const sourceScenes = promptProject.scenes ?? [];
    if (sourceScenes.length === 0) return flowBundle;

    const promptText = sourceScenes.map((scene, index) => {
      const singleScenePrompt = runPromptEngine({
        project: { ...project, scenes: [scene] },
        lang,
        profile: exportProfile,
        platformId,
        scope: "current_scene"
      }).finalCopyPrompt;
      const title = scene.name?.trim() || scene.id || (lang === "zh" ? `分镜 ${index + 1}` : `Scene ${index + 1}`);
      return `## ${title}\n${enhancePromptForExport(singleScenePrompt, "with_refs", lang).trimEnd()}`;
    }).join("\n\n");

    const bgBlobFiles: FlowBlobFile[] = sourceScenes.flatMap((scene, sceneOrder) => {
      const bgRef = scene.backgroundRef;
      if (!bgRef?.id) return [];
      const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
      const ext = extFromName(bgRef.name);
      const fileName = `${sceneTag}__BG__${safeName(bgRef.name || `background.${ext}`)}`;
      return [{ path: `${projectDir}/images/${fileName}`, refId: bgRef.id }];
    });

    const objectBlobFiles: FlowBlobFile[] = sourceScenes.flatMap((scene, sceneOrder) =>
      (scene.layers ?? []).flatMap((layer, idx) => {
        const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
        const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
        return (layer.localRefs ?? []).slice(0, OBJECT_REF_LIMIT).map((ref, i) => {
          const ext = extFromName(ref.name);
          const fileName = `${sceneTag}_${code}__${refShort(ref.type)}__${String(i + 1).padStart(2, "0")}.${ext}`;
          return { path: `${projectDir}/images/${fileName}`, refId: ref.id };
        });
      })
    );

    return {
      ...flowBundle,
      rootDir,
      projectDir,
      promptText: `${promptText}\n`,
      packagePromptText: `${promptText}\n`,
      files: [
        { path: `${projectDir}/prompt.txt`, content: `${promptText}\n` },
        { path: `${projectDir}/scene.json`, content: `${JSON.stringify(promptProject, null, 2)}\n` }
      ],
      blobFiles: [...bgBlobFiles, ...objectBlobFiles]
    };
  }, [exportProfile, flowBundle, lang, platformId, project, projectLabel, promptProject]);

  const manualSaveGuide = useMemo(() => {
    const fileLines = [
      ...flowBundle.files.map((f) => `- ${f.path}`),
      ...flowBundle.blobFiles.map((b) => `- ${b.path}`)
    ];
    if (lang === "zh") {
      return [
        "手动建目录流程",
        `1) 在目标位置新建根目录：${flowBundle.rootDir}`,
        `2) 在根目录下新建项目目录：${flowBundle.projectDir}`,
        "3) 在项目目录下按以下文件名保存文件：",
        ...fileLines,
        "4) 将提示词 txt 与同名参考图一起上传到目标大模型。"
      ].join("\n");
    }
    return [
      "Manual directory workflow",
      `1) Create root folder: ${flowBundle.rootDir}`,
      `2) Create project folder under root: ${flowBundle.projectDir}`,
      "3) Save files in the project folder using these exact names:",
      ...fileLines,
      "4) Upload prompt txt and same-name references to your target model."
    ].join("\n");
  }, [flowBundle, lang]);

  async function exportFlowPackage(): Promise<{ ok: boolean; folderLabel: string }> {
    if (!canSaveDirectory) {
      return { ok: false, folderLabel: lang === "zh" ? "当前浏览器不支持目录保存" : "Directory save is not supported" };
    }
    try {
      const picker = (window as any).showDirectoryPicker;
      const pickedDir = await picker({
        mode: "readwrite",
        ...(defaultExportDirectoryHandle ? { startIn: defaultExportDirectoryHandle } : {})
      });
      try {
        onExportDirectorySelected?.(pickedDir, String(pickedDir?.name || ""));
      } catch {
        // ignore callback errors
      }
      const root = await pickedDir.getDirectoryHandle(flowBundle.rootDir, { create: true });
      for (const file of flowBundle.files) {
        await writeTextToDirectory(root, file.path, file.content);
      }
      for (const blobFile of flowBundle.blobFiles) {
        const blob = await getRefBlob(blobFile.refId);
        if (!blob) continue;
        await writeBlobToDirectory(root, blobFile.path, blob);
      }
      return { ok: true, folderLabel: `${pickedDir.name}/${flowBundle.rootDir}` };
    } catch {
      return { ok: false, folderLabel: lang === "zh" ? "保存已取消或失败" : "Save cancelled or failed" };
    }
  }

  async function downloadFlowZipPackage(bundle = flowBundle): Promise<{ ok: boolean; fileLabel: string }> {
    try {
      const encoder = new TextEncoder();
      const zipEntries: ZipEntry[] = bundle.files.map((f) => ({
        path: `${bundle.rootDir}/${f.path}`.replace(/\/+/g, "/"),
        data: encoder.encode(f.content)
      }));
      for (const blobFile of bundle.blobFiles) {
        const blob = await getRefBlob(blobFile.refId);
        if (!blob) continue;
        zipEntries.push({
          path: `${bundle.rootDir}/${blobFile.path}`.replace(/\/+/g, "/"),
          data: new Uint8Array(await blob.arrayBuffer())
        });
      }
      const zipBlob = buildZipStored(zipEntries);
      const projectNameForFile = safeName(projectLabel || defaultProjectName(lang));
      const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
      const zipName = `${projectNameForFile}__${shotNameForFile}.zip`;
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, fileLabel: zipName };
    } catch {
      return { ok: false, fileLabel: lang === "zh" ? "ZIP 下载失败" : "ZIP download failed" };
    }
  }

  useEffect(() => {
    if (!moreExportOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = moreExportRef.current;
      if (el && !el.contains(e.target as Node)) setMoreExportOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [moreExportOpen]);

  useEffect(() => {
    if (!readonlyHelpOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = readonlyHelpRef.current;
      if (el && !el.contains(e.target as Node)) setReadonlyHelpOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [readonlyHelpOpen]);

  async function downloadQuickPromptFile(): Promise<{ ok: boolean; fileLabel: string }> {
    try {
      const blob = new Blob([flowBundle.promptText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = flowBundle.quickPromptFileName;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true, fileLabel: flowBundle.quickPromptFileName };
    } catch {
      return { ok: false, fileLabel: lang === "zh" ? "prompt.txt 下载失败" : "prompt.txt download failed" };
    }
  }

  async function runExportPromptPlusRefs(skipConflictGuard = false) {
    if (!skipConflictGuard && sceneConflicts.length) {
      setPendingConflictAction("prompt_plus_refs");
      setPendingConflicts(sceneConflicts);
      setShowConflictModal(true);
      return;
    }
    let ticket: PromptExportTicket = { allowed: true };
    if (onPreparePromptExport) {
      ticket = await onPreparePromptExport("pro_export_prompt");
      if (!ticket.allowed) return;
    }
    setExporting(true);
    let committed = false;
    try {
      const res = await downloadFlowZipPackage(promptPlusRefsBundle);
      committed = res.ok;
      if (res.ok) {
        setActionHint(lang === "zh" ? "提示词 + 参考图已导出" : "Prompt + refs exported");
        onFeedbackMessage?.(lang === "zh" ? "已导出 ZIP" : "Exported ZIP");
      } else {
        setActionHint(res.fileLabel || (lang === "zh" ? "导出失败" : "Export failed"));
      }
    } finally {
      setExporting(false);
      if (onSettlePromptExport) {
        await onSettlePromptExport(ticket.reservationId, committed);
      }
    }
  }

  const promptPreviewLines = (promptsMain + (promptsNotes ? `\n${promptsNotes}` : "")).trimEnd().split("\n");
  const compactLineLimit = 4;
  const showExpandToggle = promptPreviewLines.length > compactLineLimit;
  const displayPromptMain = promptExpanded
    ? promptsMain.trimEnd()
    : promptPreviewLines.slice(0, compactLineLimit).join("\n").trimEnd();
  const displayPromptNotes = promptExpanded && promptsNotes ? promptsNotes : null;

  const readonlyHelpText = lang === "zh"
    ? "这是系统根据模板、对象和场景策略自动生成的结构化提示词，仅用于查看、复制与导出。如需修改，请前往：模板、对象属性、场景策略、镜头/光。"
    : "This prompt is auto-generated from template, objects, and scene strategy. Read-only; for viewing, copy, and export. To edit, use: Template, Object Properties, Scene Strategy, Camera/Light.";

  return (
    <div className="pro-export-panel" style={styles.wrap}>
      {actionHint ? <div style={styles.actionHint}>{actionHint}</div> : null}

      <div style={styles.splitLayout}>
        <div style={styles.leftColumn} role="region" aria-label={lang === "zh" ? "结构化提示词展示区" : "Structured Prompt Preview"}>
          <div style={styles.titleRow}>
            <div style={styles.sectionTitle}>
              {lang === "zh" ? "结构化提示词展示区" : "Structured Prompt Preview"}
            </div>
            <div ref={readonlyHelpRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="pro-btn-ghost"
                style={styles.helpIcon}
                onClick={() => setReadonlyHelpOpen((v) => !v)}
                aria-label={lang === "zh" ? "说明" : "Help"}
                title={readonlyHelpText}
              >
                <HelpCircle size={14} />
              </button>
              {readonlyHelpOpen ? (
                <div style={styles.helpPopover} role="tooltip">
                  {readonlyHelpText}
                </div>
              ) : null}
            </div>
          </div>
          {sceneConflicts.length > 0 ? (
            <button
              className="pro-btn-ghost"
              type="button"
              onClick={() => {
                setPendingConflictAction(null);
                setPendingConflicts(sceneConflicts);
                setShowConflictModal(true);
              }}
              style={styles.conflictBadge}
            >
              {lang === "zh" ? `冲突 ${sceneConflicts.length}` : `Conflicts ${sceneConflicts.length}`}
            </button>
          ) : null}
          <div
            style={styles.promptPane}
            className="pro-prompt-readonly"
            aria-readonly="true"
          >
            <div className="pro-prompt-preview pro-prompt-result-preview" style={styles.preWrap}>
              <pre style={styles.preReadonly}>{displayPromptMain}</pre>
              {displayPromptNotes ? <pre style={styles.preNotes}>{displayPromptNotes}</pre> : null}
            </div>
            {showExpandToggle ? (
              <button
                type="button"
                className="pro-btn-ghost"
                style={styles.expandBtn}
                onClick={() => setPromptExpanded((v) => !v)}
                aria-expanded={promptExpanded}
              >
                {promptExpanded ? (
                  <><ChevronUp size={12} />{lang === "zh" ? "收起" : "Collapse"}</>
                ) : (
                  <><ChevronDown size={12} />{lang === "zh" ? "展开完整内容" : "Expand full"}</>
                )}
              </button>
            ) : null}
          </div>
        </div>

        <div style={styles.rightColumn} role="region" aria-label={lang === "zh" ? "生成与导出" : "Generate & Export"}>
          <div style={styles.rightColumnScroll}>
            <div style={styles.sectionTitle}>
              {lang === "zh" ? "生成与导出" : "Generate & Export"}
            </div>
          <div style={styles.primaryActions}>
            <button
              className="pro-btn"
              type="button"
              data-testid="export-copy-prompt-primary"
              onClick={(e) => {
                e.stopPropagation();
                void guardBeforeExport("copy");
              }}
              style={styles.primaryBtn}
            >
              <Copy size={14} />
              {lang === "zh" ? "复制提示词" : "Copy Prompt"}
            </button>
            <button
              className="pro-btn"
              type="button"
              data-testid="export-prompt-refs-primary"
              onClick={(e) => {
                e.stopPropagation();
                void runExportPromptPlusRefs();
              }}
              disabled={exporting}
              style={styles.primaryBtn}
            >
              <Download size={14} />
              {exporting ? (lang === "zh" ? "导出中…" : "Exporting…") : (lang === "zh" ? "导出提示词 + 参考图" : "Export Prompt + Refs")}
            </button>
          </div>
          <div style={styles.exportPolicyLinks}>
            <a href="/disclaimer" style={styles.exportPolicyLink}>
              {lang === "zh" ? "免责声明" : "Disclaimer"}
            </a>
            <a href="/ip-user-content" style={styles.exportPolicyLink}>
              {lang === "zh" ? "素材与权利说明" : "IP & Content"}
            </a>
          </div>
          <div style={styles.moreExportWrap} ref={moreExportRef}>
            <button
              type="button"
              className="pro-btn-ghost"
              style={styles.moreExportBtn}
              onClick={() => setMoreExportOpen((v) => !v)}
              aria-expanded={moreExportOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal size={14} />
              {lang === "zh" ? "更多导出" : "More Export"}
              <ChevronDown size={12} style={{ opacity: 0.8 }} />
            </button>
            {moreExportOpen ? (
              <div style={styles.moreExportMenu} role="menu">
                <button
                  type="button"
                  className="pro-btn-ghost"
                  style={styles.moreExportItem}
                  role="menuitem"
                  onClick={() => {
                    setMoreExportOpen(false);
                    void guardBeforeExportTxt();
                  }}
                >
                  {lang === "zh" ? "下载 prompt.txt" : "Download prompt.txt"}
                </button>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      </div>

      {copyConfirmOpen ? renderOverlay(
        <div style={styles.modalMask} onMouseDown={() => {
          setCopyConfirmOpen(false);
          setCopyDone(false);
        }}>
          <div style={{ ...styles.modal, width: "min(700px, calc(100vw - 48px))" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.copyModalHead}>
              <div style={styles.modalTitle}>{lang === "zh" ? "复制提示词" : "Copy Prompt"}</div>
              <button className="pro-btn-ghost" type="button" onClick={() => {
                setCopyConfirmOpen(false);
                setCopyDone(false);
              }} style={{ width: 28, height: 28, minWidth: 28, padding: 0, fontSize: 14, fontWeight: 900 }} aria-label={lang === "zh" ? "关闭" : "Close"}>×</button>
            </div>
            <div style={styles.platformTips}>
              {lang === "zh"
                ? exportScope === "continuous_sequence"
                  ? "本次复制的是当前连续序列的最终提示词，包含当前分镜及后续连续衔接。"
                  : "本次复制的是当前分镜的最终提示词，不含项目内其它分镜。"
                : exportScope === "continuous_sequence"
                  ? "This copy includes the current continuity sequence prompt, starting from this shot and preserving following transitions."
                  : "This copy includes current-scene final prompt only; no other scenes are included."}
            </div>
            {!copyPolicyAccepted ? (
              <div style={styles.exportPolicyHint}>
                <label style={styles.exportPolicyCheckbox}>
                  <input
                    type="checkbox"
                    checked={copyRiskAccepted}
                    onChange={(e) => {
                      setCopyRiskAccepted(e.target.checked);
                      if (e.target.checked) setCopyRiskError("");
                    }}
                  />
                  <span>
                    {lang === "zh"
                      ? "我理解复制的提示词仅为创作辅助，不保证第三方平台生成结果、审核结果或商用结果。"
                      : "I understand copied prompts are creative aids only and do not guarantee third-party output, review, or commercial results."}
                  </span>
                </label>
                <div style={styles.exportPolicyLinksInline}>
                  <a href="/disclaimer" style={styles.exportPolicyLink}>{lang === "zh" ? "查看免责声明" : "View Disclaimer"}</a>
                </div>
                {copyRiskError ? <div style={styles.exportPolicyError}>{copyRiskError}</div> : null}
              </div>
            ) : null}
            <pre style={styles.copyPreview}>{quickCopyPrompt}</pre>
            {copyDone ? <div style={styles.copyOk}>{lang === "zh" ? "复制成功" : "Copied"}</div> : null}
            <div style={styles.modalBtns}>
              <button className="pro-btn" type="button" onClick={() => void confirmCopyPrompt()}>
                {lang === "zh" ? "复制" : "Copy"}
              </button>
              <button className="pro-btn-ghost" type="button" onClick={() => {
                setCopyConfirmOpen(false);
                setCopyDone(false);
              }}>
                {lang === "zh" ? "关闭" : "Close"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showExportModal ? renderOverlay(
        <div style={styles.modalMask} onMouseDown={() => setShowExportModal(false)}>
          <div style={{ ...styles.modal, width: "min(560px, calc(100vw - 48px))" }} data-testid="export-modal" onMouseDown={(e) => e.stopPropagation()}>
          <div style={styles.copyModalHead}>
            <div style={styles.modalTitle}>{lang === "zh" ? "导出" : "Export"}</div>
            <button
              className="pro-btn-ghost"
              type="button"
              data-testid="export-close-top"
              onClick={() => setShowExportModal(false)}
              aria-label={lang === "zh" ? "关闭导出弹窗" : "Close export modal"}
              title={lang === "zh" ? "关闭" : "Close"}
              style={{ width: 28, height: 28, minWidth: 28, padding: 0, fontSize: 14, fontWeight: 900 }}
            >
              ×
            </button>
          </div>
          {promptExportNote ? (
            <div style={styles.exportPolicyHint} data-testid="export-prompt-note">
              {promptExportNote}
            </div>
          ) : null}
          {!exportPolicyAccepted ? (
            <div style={styles.exportPolicyHint}>
              <label style={styles.exportPolicyCheckbox}>
                <input
                  type="checkbox"
                  checked={exportRiskAccepted}
                  onChange={(e) => {
                    setExportRiskAccepted(e.target.checked);
                    if (e.target.checked) setExportRiskError("");
                  }}
                />
                <span>
                  {lang === "zh"
                    ? "我理解导出后的兼容性、素材授权、分享、传输、商用与后续使用责任由我自行承担。"
                    : "I understand that compatibility, source authorization, sharing, transfer, commercial use, and subsequent use after export are my responsibility."}
                </span>
              </label>
              <div style={styles.exportPolicyLinksInline}>
                <a href="/disclaimer" style={styles.exportPolicyLink}>{lang === "zh" ? "免责声明" : "Disclaimer"}</a>
                <a href="/ip-user-content" style={styles.exportPolicyLink}>{lang === "zh" ? "素材与权利说明" : "IP & Content"}</a>
              </div>
              {exportRiskError ? <div style={styles.exportPolicyError}>{exportRiskError}</div> : null}
            </div>
          ) : null}
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "导出类型" : "Export Type"}</div>
            <div style={styles.exportTypeList}>
              {[
                {
                  id: "general" as const,
                  label: lang === "zh" ? "通用" : "General",
                  desc: lang === "zh" ? "默认项目包，适合大多数外部平台。" : "Default package for most external tools.",
                  includes: "prompt.txt · scene.json · images/"
                },
                {
                  id: "with_refs" as const,
                  label: lang === "zh" ? "含参考图" : "With References",
                  desc: lang === "zh" ? "保留参考图，并强化提示词中的参考图使用说明。" : "Keeps references and strengthens reference usage in prompt.",
                  includes: "prompt.txt · scene.json · images/"
                },
                {
                  id: "without_refs" as const,
                  label: lang === "zh" ? "不含参考图" : "Without References",
                  desc: lang === "zh" ? "删除参考图依赖，仅导出文字描述和结构。" : "Removes reference dependencies and exports text + structure only.",
                  includes: "prompt.txt · scene.json"
                },
                {
                  id: "txt" as const,
                  label: lang === "zh" ? "仅提示词（TXT）" : "Prompt Only (TXT)",
                  desc: lang === "zh" ? "只导出一个 prompt.txt 文件。" : "Exports only one prompt.txt file.",
                  includes: "prompt.txt"
                }
              ].map((item) => (
                <button
                  key={item.id}
                  data-testid={`export-type-${item.id}`}
                  type="button"
                  className="pro-btn-ghost"
                  style={{ ...styles.exportTypeRow, ...(exportPackageType === item.id ? styles.exportTypeRowOn : {}) }}
                  onClick={() => applyExportPackageType(item.id)}
                  aria-pressed={exportPackageType === item.id}
                >
                  <div style={styles.exportTypeRadio} aria-hidden="true">
                    <span style={{ ...styles.exportTypeRadioDot, ...(exportPackageType === item.id ? styles.exportTypeRadioDotOn : {}) }} />
                  </div>
                  <div style={styles.exportTypeCopy}>
                    <div style={styles.exportTypeTitle}>{item.label}</div>
                    <div style={styles.exportTypeDesc}>{item.desc}</div>
                    <div style={styles.exportTypeMeta}>{lang === "zh" ? `包含内容：${item.includes}` : `Includes: ${item.includes}`}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {exportPackageType === "txt" && scopeOptions.length > 1 && rangeField.visible ? (
            <div style={styles.modalRow}>
              <div style={styles.profileLabel}>{lang === "zh" ? "导出范围" : "Export Scope"}{rangeField.reason ? ` · ${rangeField.reason}` : ""}</div>
              <div style={styles.optionWrap}>
                <button data-testid="export-scope-current" type="button" disabled={!rangeField.enabled} title={rangeOptions.find((o) => o.value === "current_scene")?.reason} className={exportScope === "current_scene" ? "pro-btn" : "pro-btn-ghost"} style={styles.optionBtn} onClick={() => setExportScope("current_scene")}>
                  {lang === "zh" ? "当前分镜" : "Current Scene"}
                </button>
                <button data-testid="export-scope-sequence" type="button" disabled={!rangeOptions.find((o) => o.value === "continuous_sequence")?.enabled} title={rangeOptions.find((o) => o.value === "continuous_sequence")?.reason} className={exportScope === "continuous_sequence" ? "pro-btn" : "pro-btn-ghost"} style={styles.optionBtn} onClick={() => rangeOptions.find((o) => o.value === "continuous_sequence")?.enabled && setExportScope("continuous_sequence")}>
                  {lang === "zh" ? "连续序列" : "Continuity Sequence"}
                </button>
              </div>
            </div>
          ) : null}
          {exportPackageType !== "txt" && !canSaveDirectory ? (
            <div style={styles.unsupportedCard}>
              <div style={styles.unsupportedText}>
                {lang === "zh"
                  ? "目录保存不可用：可下载 ZIP，或复制手动建目录流程。"
                  : "Directory save unavailable: use ZIP download or copy the manual workflow."}
              </div>
              <div style={styles.unsupportedActions}>
                <button
                  className="pro-btn-ghost"
                  type="button"
                  onClick={async () => {
                    await copy(manualSaveGuide);
                    setActionHint(lang === "zh" ? "已复制手动建目录流程" : "Manual workflow copied");
                    onFeedbackMessage?.(lang === "zh" ? "已复制流程" : "Workflow copied");
                  }}
                >
                  {lang === "zh" ? "复制手动建目录流程" : "Copy Manual Workflow"}
                </button>
              </div>
            </div>
          ) : null}
          <div style={styles.modalBtns}>
            <div style={styles.modalBtnLeft}>
              <button data-testid="export-close" className="pro-btn-ghost" onClick={() => setShowExportModal(false)} type="button">
                {lang === "zh" ? "关闭" : "Close"}
              </button>
            </div>
            <div style={styles.modalBtnRight}>
              <button
                data-testid="export-submit"
                className="pro-btn"
                onClick={async () => {
                if (!exportPolicyAccepted && !exportRiskAccepted) {
                  setExportRiskError(lang === "zh" ? "请先确认导出风险提示。" : "Please confirm the export disclosure first.");
                  return;
                }
                if (exportPackageType === "txt") {
                  let ticket: PromptExportTicket = { allowed: true };
                  if (onPreparePromptExport) {
                    ticket = await onPreparePromptExport("pro_export_prompt");
                    if (!ticket.allowed) return;
                  }
                  setExporting(true);
                  let committed = false;
                  try {
                    const res = await downloadQuickPromptFile();
                    committed = res.ok;
                    if (res.ok) {
                      if (!exportPolicyAccepted) {
                        acknowledgePolicy(userId, "export_project");
                        logPolicyAction(userId, "export_project", "export_project");
                      }
                      setActionHint(lang === "zh" ? "prompt.txt 下载成功" : "prompt.txt downloaded");
                      setShowExportModal(false);
                      onFeedbackMessage?.(lang === "zh" ? "已导出 TXT" : "Exported TXT");
                    } else {
                      setActionHint(res.fileLabel || (lang === "zh" ? "导出失败" : "Export failed"));
                    }
                  } finally {
                    setExporting(false);
                    if (onSettlePromptExport) {
                      await onSettlePromptExport(ticket.reservationId, committed);
                    }
                  }
                  return;
                }

                setExporting(true);
                if (canSaveDirectory) {
                  const res = await exportFlowPackage();
                  setExporting(false);
                  if (res.ok) {
                    if (!exportPolicyAccepted) {
                      acknowledgePolicy(userId, "export_project");
                      logPolicyAction(userId, "export_project", "export_project");
                    }
                    setActionHint(lang === "zh" ? `项目包已导出：${res.folderLabel}` : `Project package exported: ${res.folderLabel}`);
                    setShowExportModal(false);
                    onFeedbackMessage?.(lang === "zh" ? "已导出项目" : "Exported project");
                  } else {
                    setActionHint(res.folderLabel || (lang === "zh" ? "保存失败" : "Save failed"));
                  }
                } else {
                  const zip = await downloadFlowZipPackage();
                  setExporting(false);
                  if (zip.ok) {
                    if (!exportPolicyAccepted) {
                      acknowledgePolicy(userId, "export_project");
                      logPolicyAction(userId, "export_project", "export_project");
                    }
                    setActionHint(lang === "zh" ? "项目包 ZIP 已下载" : "Project package ZIP downloaded");
                    setShowExportModal(false);
                    onFeedbackMessage?.(lang === "zh" ? "已导出项目 ZIP" : "Exported project ZIP");
                  } else {
                    setActionHint(zip.fileLabel || (lang === "zh" ? "ZIP 下载失败" : "ZIP download failed"));
                  }
                }
                }}
                type="button"
                disabled={exporting}
              >
                {exporting
                  ? lang === "zh"
                    ? exportPackageType === "txt" ? "导出中..." : "保存中..."
                    : exportPackageType === "txt" ? "Exporting..." : "Saving..."
                  : exportPackageType === "txt"
                    ? (lang === "zh" ? "导出提示词 TXT" : "Export Prompt TXT")
                    : canSaveDirectory
                      ? (lang === "zh" ? "导出项目包" : "Export Project Package")
                      : (lang === "zh" ? "下载项目 ZIP" : "Download Project ZIP")}
              </button>
            </div>
          </div>
          </div>
        </div>
      ) : null}
      {showConflictModal ? renderOverlay(
        <div style={styles.modalMask} onMouseDown={() => setShowConflictModal(false)}>
          <div style={{ ...styles.modal, width: "min(700px, calc(100vw - 48px))" }} onMouseDown={(e) => e.stopPropagation()}>
            <div style={styles.copyModalHead}>
              <div style={styles.modalTitle}>{lang === "zh" ? "检测到冲突，请先修正" : "Conflicts Detected"}</div>
              <button
                className="pro-btn-ghost"
                type="button"
                onClick={() => setShowConflictModal(false)}
                aria-label={lang === "zh" ? "关闭冲突弹窗" : "Close conflict modal"}
                title={lang === "zh" ? "关闭" : "Close"}
                style={{ width: 28, height: 28, minWidth: 28, padding: 0, fontSize: 14, fontWeight: 900 }}
              >
                ×
              </button>
            </div>
            <div style={styles.platformTips}>
              {lang === "zh"
                ? "以下冲突来自对象备注/对象局部提示词与结构约束的冲突。点击“定位”可直接跳到对象编辑。"
                : "Conflicts were found between object text and structural constraints. Click Jump to locate the object quickly."}
            </div>
            <div style={styles.conflictList}>
              {pendingConflicts.map((c) => (
                <div key={c.id} style={{ ...styles.conflictItem, ...(c.severity === "high" ? styles.conflictItemHigh : {}) }}>
                  <div style={styles.conflictTitle}>
                    {c.title}
                    {c.layerId ? ` · ${c.layerId}` : ""}
                  </div>
                  <div style={styles.conflictDetail}>{c.detail}</div>
                  <div style={styles.conflictActions}>
                    {c.layerId ? (
                      <button
                        className="pro-btn-ghost"
                        type="button"
                        onClick={() => {
                          onJumpToConflict?.(c.layerId);
                          setShowConflictModal(false);
                        }}
                      >
                        {lang === "zh" ? "定位" : "Jump"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.modalBtns}>
              <button className="pro-btn-ghost" type="button" onClick={() => setShowConflictModal(false)}>
                {lang === "zh" ? "返回修改" : "Back to Edit"}
              </button>
              <button
                className="pro-btn"
                type="button"
                onClick={async () => {
                  const action = pendingConflictAction;
                  setShowConflictModal(false);
                  if (action === "copy") await runCopyPrompt();
                  if (action === "save") runOpenSaveModal();
                  if (action === "prompt_txt") await runExportTxt();
                  if (action === "prompt_plus_refs") await runExportPromptPlusRefs(true);
                }}
              >
                {lang === "zh" ? "忽略并继续导出" : "Continue Anyway"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: "10px 14px",
    minHeight: 140,
    height: 140,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: "none",
    background: "var(--pro-bg-panel)",
    position: "relative",
    backdropFilter: "none"
  },

  splitLayout: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "row",
    gap: 12
  },
  leftColumn: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  rightColumn: {
    flexShrink: 0,
    width: 220,
    display: "flex",
    flexDirection: "column",
    minHeight: 0
  },
  rightColumnScroll: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  platformModeBlock: {
    marginTop: 4
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  sectionTitle: {
    fontWeight: 800,
    fontSize: UI_TYPO.size12,
    opacity: UI_OPACITY.title,
    color: "var(--pro-text-primary)"
  },
  helpIcon: {
    width: 20,
    height: 20,
    minWidth: 20,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--pro-text-muted)",
    opacity: 0.75
  },
  helpPopover: {
    position: "absolute",
    left: 0,
    top: "100%",
    marginTop: 4,
    padding: "8px 10px",
    maxWidth: 320,
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    color: "var(--pro-text-primary)",
    background: "var(--pro-bg-panel)",
    border: "1px solid var(--pro-border)",
    borderRadius: 6,
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    zIndex: 100
  },
  readonlyHint: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.35,
    opacity: 0.82,
    color: "var(--pro-text-muted)"
  },
  conflictBadge: {
    borderColor: "rgba(255,120,120,0.58)",
    color: "rgba(255,200,200,0.96)",
    padding: "4px 8px",
    fontSize: UI_FONT.hint,
    fontWeight: 800,
    alignSelf: "flex-start"
  },
  preReadonly: {
    flex: "0 0 auto",
    margin: 0,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: "ui-monospace, SF Mono, Menlo, Consolas, monospace",
    fontSize: "var(--pro-font-xs)",
    lineHeight: 1.4,
    cursor: "default",
    userSelect: "text"
  },
  expandBtn: {
    padding: "4px 8px",
    fontSize: UI_FONT.hint,
    fontWeight: 700,
    marginTop: 4,
    alignSelf: "flex-start"
  },
  primaryActions: {
    display: "flex",
    flexDirection: "column",
    gap: 6
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 12px",
    fontSize: UI_FONT.body,
    fontWeight: 800
  },
  moreExportWrap: {
    position: "relative"
  },
  moreExportBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    fontSize: UI_FONT.hint,
    fontWeight: 700,
    width: "100%"
  },
  moreExportMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    padding: 4,
    borderRadius: UI_RADIUS.control,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  moreExportItem: {
    padding: "6px 10px",
    fontSize: UI_FONT.hint,
    fontWeight: 700,
    textAlign: "left",
    whiteSpace: "nowrap"
  },

  head: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" },
  title: { fontWeight: 850, fontSize: UI_TYPO.size13, opacity: UI_OPACITY.title, color: UI_PALETTE.text.secondary },

  sceneHint: {
    fontSize: UI_FONT.hint,
    fontWeight: 900,
    opacity: 0.68,
    padding: "4px 8px",
    borderRadius: 10,
    border: `1px solid ${UI_INFO.border.default}`,
    background: UI_INFO.surface.subtle,
    maxWidth: 260,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    lineHeight: 1.25
  },

  scopeSelect: {
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.controlRadius,
    border: `1px solid ${UI_COLOR.border}`,
    background: UI_COLOR.bgInput,
    color: UI_COLOR.text,
    outline: "none",
    padding: "0 34px 0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 700
  },

  tab: {
    padding: "6px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft,
    WebkitTapHighlightColor: "transparent" as any
  },

  tabOff: {
    opacity: 0.72,
    borderColor: UI_CONTROL.border.default,
    background: UI_CONTROL.bg.default
  },

  tabOn: {
    opacity: 1,
    borderColor: UI_CONTROL.border.active,
    background: UI_CONTROL.bg.accent,
    boxShadow: UI_CONTROL.shadow.hover,
    ["--spx-btn-bg-hover" as any]: UI_CONTROL.bg.accentHover,
    ["--spx-btn-bg-active" as any]: UI_CONTROL.bg.accentActive,
    ["--spx-btn-border-hover" as any]: UI_CONTROL.border.active,
    ["--spx-btn-border-active" as any]: UI_CONTROL.border.active
  },

  btnPrimary: {
    padding: "6px 10px",
    borderRadius: 10,
    border: `1px solid ${UI_ACTION.border.default}`,
    background: UI_ACTION.surface.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft,
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent" as any,
    ["--spx-btn-bg-hover" as any]: UI_ACTION.surface.hover,
    ["--spx-btn-bg-active" as any]: UI_ACTION.surface.active,
    ["--spx-btn-border-hover" as any]: UI_ACTION.border.hover,
    ["--spx-btn-border-active" as any]: UI_ACTION.border.active,
    ["--spx-btn-shadow-hover" as any]: UI_ACTION.shadow.hover
  },
  btnGhost: {
    padding: "6px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft,
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent" as any
  },
  qBtn: {
    width: 28,
    height: 28,
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    fontWeight: 900,
    cursor: "pointer",
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  actionHint: {
    position: "absolute",
    right: 10,
    top: 44,
    zIndex: 60,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg-panel)",
    fontSize: "var(--pro-info-font-size)",
    fontFamily: "var(--pro-info-font)",
    maxHeight: "var(--pro-info-height)",
    lineHeight: 1.2,
    display: "flex",
    alignItems: "center",
    color: "var(--pro-text-primary)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
  },
  helpFloat: {
    position: "absolute",
    right: 10,
    top: 44,
    zIndex: 59,
    maxWidth: 420,
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_INFO.border.default}`,
    background: UI_INFO.surface.elevated,
    fontSize: UI_FONT.body,
    lineHeight: 1.4,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
  },
  contentLayout: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  promptPane: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    border: "1px solid var(--pro-border)",
    borderRadius: 6,
    background: "var(--pro-bg)",
    boxShadow: "none",
    padding: 6
  },
  promptTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap"
  },
  metaLiteRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap"
  },
  promptTabs: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap"
  },
  platformLite: {
    fontSize: UI_TYPO.size11,
    fontWeight: 800,
    color: UI_INFO.text.body,
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.chip,
    background: UI_INFO.surface.subtle,
    padding: "4px 8px"
  },
  explainPane: {
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto"
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8
  },
  infoCard: {
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    background: UI_INFO.surface.default,
    padding: "8px 10px",
    display: "grid",
    gap: 4
  },
  infoTitle: {
    fontSize: UI_TYPO.size12,
    fontWeight: 900
  },
  infoLine: {
    fontSize: UI_TYPO.size11,
    color: UI_PALETTE.text.secondary
  },
  stageTabs: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap"
  },
  stageTab: {
    padding: "4px 8px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_PALETTE.surface.surface2,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_TYPO.size11,
    fontWeight: 800
  },
  stageTabOn: {
    border: `1px solid ${UI_PALETTE.border.active}`,
    background: UI_PALETTE.surface.surfaceActive
  },
  stagePre: {
    margin: 0,
    padding: "8px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "#1f2125",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 180,
    overflow: "auto",
    fontSize: UI_TYPO.size11,
    lineHeight: 1.4
  },
  assistBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  assistTitle: {
    fontSize: UI_TYPO.size11,
    fontWeight: 900,
    opacity: 0.88
  },
  profileRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  profileLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#9ca3af",
    letterSpacing: "0.04em",
    marginBottom: 6,
    textTransform: "uppercase" as const
  },
  platformTips: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.88,
    border: `1px solid ${UI_INFO.border.default}`,
    borderRadius: UI_RADIUS.control,
    background: UI_INFO.surface.default,
    padding: "8px 10px"
  },
  exportPolicyHint: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.35,
    color: UI_PALETTE.text.secondary,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    borderRadius: UI_RADIUS.control,
    background: "rgba(255,255,255,0.02)",
    padding: "7px 10px"
  },
  exportPolicyLinks: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 2
  },
  exportPolicyLinksInline: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 6
  },
  exportPolicyLink: {
    fontSize: UI_FONT.hint,
    color: UI_PALETTE.text.secondary,
    textDecoration: "underline"
  },
  exportPolicyCheckbox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8
  },
  exportPolicyError: {
    marginTop: 6,
    fontSize: UI_FONT.hint,
    color: "#f87171"
  },
  platformPendingHint: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.35,
    opacity: 0.86,
    color: UI_INFO.text.body
  },
  unsupportedCard: {
    border: `1px solid ${UI_STATUS.border.warn}`,
    borderRadius: UI_RADIUS.control,
    background: UI_STATUS.surface.warn,
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  unsupportedTitle: {
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.95
  },
  unsupportedText: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.86
  },
  unsupportedActions: {
    marginTop: 4,
    display: "flex",
    justifyContent: "flex-end"
  },
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    padding: "16px 16px max(16px, env(safe-area-inset-bottom))",
    zIndex: 9999,
    overflowY: "auto"
  },
  modal: {
    width: "min(1100px, calc(100vw - 48px))",
    maxHeight: "min(calc(100vh - 32px), 92vh)",
    position: "relative",
    margin: "0 auto",
    borderRadius: 12,
    border: "1px solid #3a3f46",
    background: "#24262b",
    boxShadow: "0 24px 56px rgba(0,0,0,0.46)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowX: "hidden",
    overflowY: "auto",
  },
  modalTitle: { fontWeight: 900, fontSize: UI_TYPO.size14, opacity: UI_OPACITY.title },
  copyModalHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  iconCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    border: "1px solid #3a3f46",
    background: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1,
  },
  copyPreview: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "#1f2125",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 320,
    overflow: "auto",
    fontSize: UI_TYPO.size11,
    lineHeight: 1.45
  },
  copyOk: {
    fontSize: UI_TYPO.size11,
    color: "rgba(108,221,162,0.96)",
    fontWeight: 800
  },
  modalRow: { display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 },
  modalBtns: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 4, flexWrap: "wrap" },
  modalBtnLeft: { display: "flex", justifyContent: "flex-start", flex: "0 0 auto" },
  modalBtnRight: { display: "flex", justifyContent: "flex-end", flex: "0 0 auto" },
  optionWrap: { display: "flex", flexWrap: "wrap", gap: 6, flex: 1 },
  optionBtn: {
    padding: "5px 12px",
    borderRadius: 8,
    border: "1px solid #3a3f46",
    background: "#1f2125",
    color: "#9ca3af",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    outline: "none",
  },
  optionBtnOn: {
    border: "1px solid #f59e0b",
    background: "rgba(245,158,11,0.12)",
    color: "#e5e7eb",
  },
  exportTypeList: {
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  exportTypeRow: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #3a3f46",
    background: "#1f2125",
    color: "#e5e7eb",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    outline: "none"
  },
  exportTypeRowOn: {
    border: "1px solid rgba(245,158,11,0.55)",
    background: "rgba(245,158,11,0.12)"
  },
  exportTypeRadio: {
    width: 16,
    height: 16,
    minWidth: 16,
    marginTop: 2,
    borderRadius: 999,
    border: "1px solid rgba(229,231,235,0.28)",
    display: "grid",
    placeItems: "center"
  },
  exportTypeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "transparent"
  },
  exportTypeRadioDotOn: {
    background: "#f59e0b"
  },
  exportTypeCopy: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 0
  },
  exportTypeTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#e5e7eb"
  },
  exportTypeDesc: {
    fontSize: 12,
    lineHeight: 1.45,
    color: "#9ca3af"
  },
  exportTypeMeta: {
    fontSize: 11,
    lineHeight: 1.4,
    color: "#cbd5e1"
  },
  modalDivider: {
    height: 1,
    background: "rgba(229,231,235,0.15)",
    margin: "4px 0 12px"
  },
  conflictBadgeBtn: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,120,120,0.58)",
    background: "rgba(255,120,120,0.16)",
    color: "rgba(255,226,226,0.96)",
    fontSize: UI_FONT.hint,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  conflictList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 300,
    overflow: "auto"
  },
  conflictItem: {
    border: "1px solid rgba(255,180,120,0.35)",
    borderRadius: 10,
    background: "rgba(255,180,120,0.09)",
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 4
  },
  conflictItemHigh: {
    border: "1px solid rgba(255,120,120,0.56)",
    background: "rgba(255,120,120,0.12)"
  },
  conflictTitle: {
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: 0.95
  },
  conflictDetail: {
    fontSize: UI_FONT.hint,
    lineHeight: 1.4,
    opacity: 0.88
  },
  conflictActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8
  },

  preWrap: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: 4,
    scrollbarWidth: "thin"
  },

  pre: {
    flex: "0 0 auto",
    margin: 0,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-primary)",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: 'ui-monospace, SF Mono, Menlo, Consolas, monospace',
    fontSize: "var(--pro-font-xs)",
    lineHeight: 1.4
  },

  preNotes: {
    flex: "0 0 auto",
    margin: 0,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--pro-border)",
    background: "var(--pro-bg)",
    color: "var(--pro-text-muted)",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: 'ui-monospace, SF Mono, Menlo, Consolas, monospace',
    fontSize: "var(--pro-font-xs)",
    lineHeight: 1.4
  }
};
