import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { availableExportScopes, recommendExportMode } from "../utils/exportViewModel";
import { useFieldState } from "../hooks/useFieldState";
import { useAllowedOptions } from "../hooks/useAllowedOptions";
import { FIELD_KEYS } from "../rules/fieldKeys";
import { defaultProjectName, safeExportName } from "../utils/naming";
import { UI_ACTION, UI_COLOR, UI_CONTROL, UI_EFFECT, UI_FONT, UI_INFO, UI_OPACITY, UI_PALETTE, UI_PANEL, UI_RADIUS, UI_SIZE, UI_STATUS, UI_TYPO } from "../uiTokens";
import type { PromptExportScope } from "../types/export";

type Props = {
  lang: Lang;
  project: Project;
  projectLabel?: string;
  sceneIdx: number;
  platformId?: PlatformPresetId;
  openExportNonce?: number;
  openExportAction?: "open" | "copy" | "package";
  promptExportNote?: string;
  onPreparePromptExport?: (action: PromptExportAction) => Promise<PromptExportTicket>;
  onSettlePromptExport?: (reservationId: string | undefined, committed: boolean) => Promise<void>;
  onPlatformChange?: (id: PlatformPresetId) => void;
  selectedLayerId: string | null;
  onJumpToConflict?: (layerId: string | null) => void;
  exportScope?: PromptExportScope;
  onExportScopeChange?: (scope: PromptExportScope) => void;
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
const OBJECT_REF_LIMIT = 1;
type ExportMode = "quick" | "package";

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
  onExportScopeChange
}: Props) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingConflictAction, setPendingConflictAction] = useState<null | "copy" | "save">(null);
  const [pendingConflicts, setPendingConflicts] = useState<PromptConflict[]>([]);
  const [actionHint, setActionHint] = useState("");
  const [copyConfirmOpen, setCopyConfirmOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [platformPresetId, setPlatformPresetId] = useState<PlatformPresetId>(platformId);
  const [internalExportScope, setInternalExportScope] = useState<PromptExportScope>("current_scene");
  const exportScope = controlledExportScope ?? internalExportScope;
  const setExportScope = onExportScopeChange ?? setInternalExportScope;
  const [exportMode, setExportMode] = useState<ExportMode>("quick");
  const [exporting, setExporting] = useState(false);
  const canSaveDirectory = typeof window !== "undefined" && "showDirectoryPicker" in window;

  const scenes = useMemo(() => project.scenes ?? [], [project.scenes]);
  const safeIdx = clampInt(sceneIdx, 0, Math.max(0, scenes.length - 1));
  const currentScene = scenes[safeIdx] ?? null;
  const scopeOptions = useMemo(() => availableExportScopes(project, safeIdx), [project, safeIdx]);
  const rangeField = useFieldState(FIELD_KEYS.EXPORT_RANGE);
  const rangeOptions = useAllowedOptions(FIELD_KEYS.EXPORT_RANGE, ["current_scene", "continuous_sequence"]);
  const targetOptions = useAllowedOptions(FIELD_KEYS.EXPORT_TARGET, PLATFORM_PRESETS.map((p) => p.id));
  const recommendedExportMode = useMemo(() => recommendExportMode(project, safeIdx), [project, safeIdx]);
  const sceneConflicts = useMemo(() => {
    if (!currentScene) return [];
    return detectSceneConflicts(currentScene, lang);
  }, [currentScene, lang]);

  useEffect(() => {
    setPlatformPresetId(platformId);
  }, [platformId]);

  useEffect(() => {
    if (!scopeOptions.includes(exportScope)) {
      setExportScope(scopeOptions[0] ?? "current_scene");
    }
  }, [scopeOptions, exportScope]);

  useEffect(() => {
    setExportMode(recommendedExportMode);
  }, [recommendedExportMode, safeIdx]);

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
    if (openExportAction === "package") {
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
  }, [openExportNonce, openExportAction, sceneConflicts]);

  function changePlatform(id: PlatformPresetId) {
    setPlatformPresetId(id);
    onPlatformChange?.(id);
  }

  void selectedLayerId;

  const platformPreset = useMemo(
    () => getPlatformPreset(platformPresetId),
    [platformPresetId]
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
    platformId: platformPresetId,
    scope: exportScope
  }), [promptProject, lang, exportProfile, platformPresetId, exportScope]);

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
    setCopyDone(false);
    setCopyConfirmOpen(true);
  }

  async function confirmCopyPrompt() {
    let ticket: PromptExportTicket = { allowed: true };
    if (onPreparePromptExport) {
      ticket = await onPreparePromptExport("pro_copy");
      if (!ticket.allowed) return;
    }
    let committed = false;
    try {
      await copy(quickCopyPrompt);
      committed = true;
      setCopyDone(true);
      setActionHint(lang === "zh" ? "已复制当前提示词" : "Current prompt copied");
    } finally {
      if (onSettlePromptExport) {
        await onSettlePromptExport(ticket.reservationId, committed);
      }
    }
  }

  function runOpenSaveModal(mode?: ExportMode) {
    if (mode) setExportMode(mode);
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

  const flowBundle = useMemo(() => {
    const scenesToExport = exportMode === "package" ? scenes : (promptProject.scenes ?? []);
    const sceneBackgrounds = scenesToExport
      .map((scene, sceneOrder) => {
        const bgRef = scene.backgroundRef;
        if (!bgRef?.id) return null;
        const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
        const ext = extFromName(bgRef.name);
        const fileName = `${sceneTag}__BG__${safeName(bgRef.name || `background.${ext}`)}`;
        return {
          sceneTag,
          sceneName: scene.name ?? scene.id,
          fileName,
          refId: bgRef.id
        };
      })
      .filter(Boolean) as Array<{ sceneTag: string; sceneName: string; fileName: string; refId: string }>;

    const objects = scenesToExport.flatMap((scene, sceneOrder) =>
      (scene.layers ?? []).map((layer, idx) => {
      const sceneTag = String((scene.index ?? sceneOrder + 1)).padStart(2, "0");
      const code = `OBJ_${String.fromCharCode(65 + (idx % 26))}${idx >= 26 ? `_${idx + 1}` : ""}`;
      const localRefs = (layer.localRefs ?? []).slice(0, OBJECT_REF_LIMIT);
      const refItems = localRefs.map((ref, i) => {
        const type = ref.type;
        const ext = extFromName(ref.name);
        const fileName = `${sceneTag}_${code}__${refShort(type)}__${String(i + 1).padStart(2, "0")}.${ext}`;
        return { source: `local:${ref.name}`, type, fileName, refId: ref.id };
      });
      return {
        sceneTag,
        sceneName: scene.name ?? scene.id,
        code,
        layerId: layer.id,
        type: (layer.type ?? "").trim(),
        look: (layer.look ?? "").trim(),
        notes: (layer.notes ?? "").trim(),
        referencePolicy: layer.referencePolicy ?? "optional",
        refItems
      };
    }));

    const projectNameForFile = safeName(projectLabel || defaultProjectName(lang));
    const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
    const platformForFile = safeName(lang === "zh" ? platformPreset.labelZh : platformPreset.labelEn);
    const rootDir = "ScenePilotix";
    const projectDir = projectNameForFile || defaultProjectName(lang);
    const modeLabelZh = "稳妥高质（两步）";
    const modeLabelEn = "Stable Quality (Two-step)";

    const readmeText = lang === "zh"
      ? [
          "ScenePilotix 交付包说明",
          "",
          `适用大模型：${platformPreset.labelZh}`,
          `导出范围：${exportMode === "package" ? "整个项目" : exportScope === "continuous_sequence" ? "连续序列" : "当前分镜"}`,
          `导出方式：${modeLabelZh}`,
          "",
          "1) 先打开 prompt.txt，直接复制提示词。",
          "2) 再按 refs-manifest.txt 上传参考图。",
          "3) 若浏览器不支持目录保存，可下载 ZIP 后按相同文件结构使用。",
          "",
          "补充说明：",
          "- 不调用 API，不上传云端。",
          "- 对象若没图，不会导出空图片文件。",
          "- 分镜背景参考图为可选项，不填也可导出。"
        ].join("\n")
      : [
          "ScenePilotix Package Guide",
          "",
          `Target Model: ${platformPreset.labelEn}`,
          `Export Scope: ${exportMode === "package" ? "Whole Project" : exportScope === "continuous_sequence" ? "Continuity Sequence" : "Current Scene"}`,
          `Flow: ${modeLabelEn}`,
          "",
          "1) Open prompt.txt first and copy the prompt directly.",
          "2) Upload references by refs-manifest.txt.",
          "3) If directory save is unavailable, use the ZIP package with the same structure.",
          "",
          "Notes:",
          "- No API call, no cloud upload.",
          "- Objects with no images won't generate empty files.",
          "- Shot background references are optional."
        ].join("\n");

    const refsManifestText = [
      lang === "zh" ? "参考图清单" : "Reference Manifest",
      "",
      lang === "zh"
        ? `适用大模型：${platformPreset.labelZh}  |  模式：${modeLabelZh}`
        : `Target Model: ${platformPreset.labelEn} | Mode: ${modeLabelEn}`,
      "",
      lang === "zh" ? "## 分镜背景参考图" : "## Shot Background Refs",
      ...(
        sceneBackgrounds.length
          ? sceneBackgrounds.flatMap((bg) => [
              lang === "zh"
                ? `- [${bg.sceneTag}] ${bg.sceneName} -> ${bg.fileName}`
                : `- [${bg.sceneTag}] ${bg.sceneName} -> ${bg.fileName}`
            ])
          : [lang === "zh" ? "- 无" : "- None"]
      ),
      "",
      lang === "zh" ? "## 对象参考图" : "## Object Refs",
      "",
      ...objects.flatMap((obj) => {
        const head =
          lang === "zh"
            ? `# [${obj.sceneTag}] ${obj.sceneName} / ${obj.code} (${obj.layerId})`
            : `# [${obj.sceneTag}] ${obj.sceneName} / ${obj.code} (${obj.layerId})`;
        const lines = [
          head,
          obj.type ? (lang === "zh" ? `- 类型: ${obj.type}` : `- Type: ${obj.type}`) : "",
          obj.look ? (lang === "zh" ? `- 外观: ${obj.look}` : `- Look: ${obj.look}`) : "",
          obj.notes ? (lang === "zh" ? `- 备注: ${obj.notes}` : `- Notes: ${obj.notes}`) : "",
          obj.refItems.length
            ? lang === "zh"
              ? `- 参考文件: ${obj.refItems.map((r) => `${r.fileName}(${r.type})`).join(", ")}`
              : `- Ref files: ${obj.refItems.map((r) => `${r.fileName}(${r.type})`).join(", ")}`
            : lang === "zh"
              ? "- 参考文件: 无（仅文本描述）"
              : "- Ref files: none (text-only fallback)"
          ,
          lang === "zh"
            ? `- 参考图策略: ${obj.referencePolicy === "required" ? "必须带图" : "可选"}`
            : `- Ref policy: ${obj.referencePolicy === "required" ? "required" : "optional"}`
        ].filter(Boolean);
        return [...lines, ""];
      })
    ].join("\n");

    const promptText = `${quickCopyPrompt}\n`;
    const packagePromptText = exportMode === "package"
      ? scenesToExport.map((scene, index) => {
          const singleScenePrompt = runPromptEngine({
            project: { ...project, scenes: [scene] },
            lang,
            profile: exportProfile,
            platformId: platformPresetId,
            scope: "current_scene"
          }).finalCopyPrompt.trimEnd();
          const title = scene.name?.trim() || scene.id || (lang === "zh" ? `分镜 ${index + 1}` : `Scene ${index + 1}`);
          return `## ${title}\n${singleScenePrompt}`;
        }).join("\n\n")
      : promptText;

    const bgBlobFiles: FlowBlobFile[] = sceneBackgrounds.map((bg) => ({
      path: `${projectDir}/${bg.fileName}`,
      refId: bg.refId
    }));
    const objectBlobFiles: FlowBlobFile[] = objects.flatMap((obj) =>
      obj.refItems
        .filter((r) => typeof (r as any).refId === "string")
        .map((r) => ({
          path: `${projectDir}/${r.fileName}`,
          refId: (r as any).refId as string
        }))
    );
    const blobFiles: FlowBlobFile[] = [...bgBlobFiles, ...objectBlobFiles];

    const files: FlowFile[] = [
      { path: `${projectDir}/prompt.txt`, content: packagePromptText },
      { path: `${projectDir}/README.txt`, content: readmeText },
      { path: `${projectDir}/refs-manifest.txt`, content: refsManifestText }
    ];
    const quickPromptFileName = `${projectNameForFile}__${shotNameForFile}__${platformForFile}__prompt.txt`;

    return {
      rootDir,
      projectDir,
      promptText,
      packagePromptText,
      readmeText,
      refsManifestText,
      quickPromptFileName,
      files,
      blobFiles
    };
  }, [exportMode, exportProfile, exportScope, lang, platformPreset, platformPresetId, project, projectLabel, promptProject.scenes, quickCopyPrompt, sceneTitle, scenes]);
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
      const pickedDir = await picker({ mode: "readwrite" });
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

  async function downloadFlowZipPackage(): Promise<{ ok: boolean; fileLabel: string }> {
    try {
      const encoder = new TextEncoder();
      const zipEntries: ZipEntry[] = flowBundle.files.map((f) => ({
        path: `${flowBundle.rootDir}/${f.path}`.replace(/\/+/g, "/"),
        data: encoder.encode(f.content)
      }));
      for (const blobFile of flowBundle.blobFiles) {
        const blob = await getRefBlob(blobFile.refId);
        if (!blob) continue;
        zipEntries.push({
          path: `${flowBundle.rootDir}/${blobFile.path}`.replace(/\/+/g, "/"),
          data: new Uint8Array(await blob.arrayBuffer())
        });
      }
      const zipBlob = buildZipStored(zipEntries);
      const projectNameForFile = safeName(projectLabel || defaultProjectName(lang));
      const shotNameForFile = safeName(sceneTitle || (lang === "zh" ? "分镜" : "shot"));
      const platformForFile = safeName(lang === "zh" ? platformPreset.labelZh : platformPreset.labelEn);
      const zipName = `${projectNameForFile}__${shotNameForFile}__${platformForFile}.zip`;
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

  return (
    <div className="pro-export-panel" style={styles.wrap}>
      <div style={styles.head}>
        {sceneConflicts.length > 0 ? (
          <button style={styles.conflictBadgeBtn} type="button" onClick={() => {
            setPendingConflictAction(null);
            setPendingConflicts(sceneConflicts);
            setShowConflictModal(true);
          }}>
            {lang === "zh" ? `冲突 ${sceneConflicts.length}` : `Conflicts ${sceneConflicts.length}`}
          </button>
        ) : null}
      </div>
      {actionHint ? <div style={styles.actionHint}>{actionHint}</div> : null}

      <div style={styles.promptPane}>
        <div className="pro-prompt-preview" style={styles.preWrap}>
          <pre style={styles.pre}>{promptsMain.trimEnd()}</pre>
          {promptsNotes ? <pre style={styles.preNotes}>{promptsNotes}</pre> : null}
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
              <button style={styles.iconCloseBtn} type="button" onClick={() => {
                setCopyConfirmOpen(false);
                setCopyDone(false);
              }}>×</button>
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
            <pre style={styles.copyPreview}>{quickCopyPrompt}</pre>
            {copyDone ? <div style={styles.copyOk}>{lang === "zh" ? "复制成功" : "Copied"}</div> : null}
            <div style={styles.modalBtns}>
              <button style={styles.btnPrimary} type="button" onClick={() => void confirmCopyPrompt()}>
                {lang === "zh" ? "复制" : "Copy"}
              </button>
              <button style={styles.btnGhost} type="button" onClick={() => {
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
              style={styles.iconCloseBtn}
              type="button"
              data-testid="export-close-top"
              onClick={() => setShowExportModal(false)}
              aria-label={lang === "zh" ? "关闭导出弹窗" : "Close export modal"}
              title={lang === "zh" ? "关闭" : "Close"}
            >
              ×
            </button>
          </div>
          {promptExportNote ? (
            <div style={styles.exportPolicyHint} data-testid="export-prompt-note">
              {promptExportNote}
            </div>
          ) : null}
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "导出类型" : "Export Type"}</div>
            <div style={styles.optionWrap}>
              <button data-testid="export-mode-quick" type="button" style={{ ...styles.optionBtn, ...(exportMode === "quick" ? styles.optionBtnOn : {}) }} onClick={() => setExportMode("quick")}>
                {lang === "zh" ? "提示词 TXT" : "Prompt TXT"}
              </button>
              <button data-testid="export-mode-package" type="button" style={{ ...styles.optionBtn, ...(exportMode === "package" ? styles.optionBtnOn : {}) }} onClick={() => setExportMode("package")}>
                {lang === "zh" ? "整个项目（含参考图）" : "Whole Project (with refs)"}
              </button>
            </div>
          </div>
          {exportMode === "quick" && scopeOptions.length > 1 && rangeField.visible ? (
            <div style={styles.modalRow}>
              <div style={styles.profileLabel}>{lang === "zh" ? "导出范围" : "Export Scope"}{rangeField.reason ? ` · ${rangeField.reason}` : ""}</div>
              <div style={styles.optionWrap}>
                <button data-testid="export-scope-current" type="button" disabled={!rangeField.enabled} title={rangeOptions.find((o) => o.value === "current_scene")?.reason} style={{ ...styles.optionBtn, ...(exportScope === "current_scene" ? styles.optionBtnOn : {}) }} onClick={() => setExportScope("current_scene")}>
                  {lang === "zh" ? "当前分镜" : "Current Scene"}
                </button>
                <button data-testid="export-scope-sequence" type="button" disabled={!rangeOptions.find((o) => o.value === "continuous_sequence")?.enabled} title={rangeOptions.find((o) => o.value === "continuous_sequence")?.reason} style={{ ...styles.optionBtn, ...(exportScope === "continuous_sequence" ? styles.optionBtnOn : {}) }} onClick={() => rangeOptions.find((o) => o.value === "continuous_sequence")?.enabled && setExportScope("continuous_sequence")}>
                  {lang === "zh" ? "连续序列" : "Continuity Sequence"}
                </button>
              </div>
            </div>
          ) : null}
          <div style={styles.modalRow}>
            <div style={styles.profileLabel}>{lang === "zh" ? "适用大模型" : "Target Model"}</div>
            <select
              data-testid="export-platform-select"
              value={platformPresetId}
              onChange={(e) => changePlatform(e.target.value as PlatformPresetId)}
              style={styles.profileSelect}
            >
              {PLATFORM_PRESETS.map((p) => {
                const opt = targetOptions.find((o) => o.value === p.id);
                return (
                  <option key={p.id} value={p.id} disabled={opt && !opt.enabled} title={opt?.reason}>
                    {lang === "zh" ? p.labelZh : p.labelEn}{opt && !opt.enabled ? ` (${lang === "zh" ? "不支持" : "unsupported"})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          {exportMode === "package" && !canSaveDirectory ? (
            <div style={styles.unsupportedCard}>
              <div style={styles.unsupportedText}>
                {lang === "zh"
                  ? "目录保存不可用：可下载 ZIP，或复制手动建目录流程。"
                  : "Directory save unavailable: use ZIP download or copy the manual workflow."}
              </div>
              <div style={styles.unsupportedActions}>
                <button
                  style={styles.btnGhost}
                  type="button"
                  onClick={async () => {
                    await copy(manualSaveGuide);
                    setActionHint(lang === "zh" ? "已复制手动建目录流程" : "Manual workflow copied");
                  }}
                >
                  {lang === "zh" ? "复制手动建目录流程" : "Copy Manual Workflow"}
                </button>
              </div>
            </div>
          ) : null}
          <div style={styles.modalBtns}>
            <button data-testid="export-close" style={styles.btnGhost} onClick={() => setShowExportModal(false)} type="button">
              {lang === "zh" ? "关闭" : "Close"}
            </button>
            <button
              data-testid="export-submit"
              style={styles.btnPrimary}
              onClick={async () => {
                if (exportMode === "quick") {
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
                      setShowExportModal(false);
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
                    setActionHint(lang === "zh" ? `项目包已导出：${res.folderLabel}` : `Project package exported: ${res.folderLabel}`);
                    setShowExportModal(false);
                  } else {
                    setActionHint(res.folderLabel || (lang === "zh" ? "保存失败" : "Save failed"));
                  }
                } else {
                  const zip = await downloadFlowZipPackage();
                  setExporting(false);
                  if (zip.ok) {
                    setActionHint(lang === "zh" ? "项目包 ZIP 已下载" : "Project package ZIP downloaded");
                    setShowExportModal(false);
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
                  ? exportMode === "quick" ? "导出中..." : "保存中..."
                  : exportMode === "quick" ? "Exporting..." : "Saving..."
                : exportMode === "quick"
                  ? (lang === "zh" ? "导出提示词 TXT" : "Export Prompt TXT")
                  : canSaveDirectory
                    ? (lang === "zh" ? "导出整个项目" : "Export Whole Project")
                    : (lang === "zh" ? "下载项目 ZIP" : "Download Project ZIP")}
            </button>
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
                style={styles.iconCloseBtn}
                type="button"
                onClick={() => setShowConflictModal(false)}
                aria-label={lang === "zh" ? "关闭冲突弹窗" : "Close conflict modal"}
                title={lang === "zh" ? "关闭" : "Close"}
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
                        style={styles.btnGhost}
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
              <button style={styles.btnGhost} type="button" onClick={() => setShowConflictModal(false)}>
                {lang === "zh" ? "返回修改" : "Back to Edit"}
              </button>
              <button
                style={styles.btnPrimary}
                type="button"
                onClick={async () => {
                  const action = pendingConflictAction;
                  setShowConflictModal(false);
                  if (action === "copy") await runCopyPrompt();
                  if (action === "save") runOpenSaveModal();
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
    padding: "0 12px 12px",
    minHeight: 132,
    height: "min(30vh, 250px)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    borderTop: "none",
    background: "#f7f9fc",
    position: "relative",
    backdropFilter: "none"
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
    padding: "7px 10px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_STATUS.border.info}`,
    background: UI_STATUS.surface.info,
    fontSize: UI_FONT.body,
    fontWeight: 900,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)"
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
    gap: 8,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: UI_RADIUS.panel,
    background: "rgba(255,255,255,0.01)",
    boxShadow: "none",
    padding: 10
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
    background: "rgba(8,12,20,0.9)",
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
    minHeight: UI_SIZE.controlH,
    display: "flex",
    alignItems: "center",
    fontSize: UI_FONT.body,
    fontWeight: 900,
    opacity: UI_OPACITY.label,
    width: UI_SIZE.labelWExport,
    flexShrink: 0
  },
  profileSelect: {
    flex: 1,
    height: UI_SIZE.controlH,
    borderRadius: UI_SIZE.compactRadius,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: UI_COLOR.bgInput,
    color: UI_PALETTE.text.primary,
    outline: "none",
    padding: "0 34px 0 10px",
    fontSize: UI_FONT.body,
    fontWeight: 700
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
    borderRadius: UI_RADIUS.panel,
    border: `1px solid ${UI_PALETTE.border.default}`,
    background: `${UI_PANEL.rightGlow}, rgba(12,17,27,0.96)`,
    boxShadow: UI_EFFECT.floatShadow,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowX: "hidden",
    overflowY: "auto",
    backdropFilter: "blur(18px)"
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
    borderRadius: UI_RADIUS.chip,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: UI_PALETTE.text.primary,
    cursor: "pointer",
    fontSize: UI_TYPO.size14,
    fontWeight: 900,
    lineHeight: 1,
    boxShadow: UI_CONTROL.shadow.soft
  },
  copyPreview: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_PALETTE.border.soft}`,
    background: "rgba(8,12,20,0.9)",
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
  modalRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  modalBtns: { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4, flexWrap: "wrap" },
  optionWrap: { display: "flex", flexWrap: "wrap", gap: 6, flex: 1 },
  optionBtn: {
    padding: "5px 8px",
    borderRadius: UI_RADIUS.control,
    border: `1px solid ${UI_CONTROL.border.default}`,
    background: UI_CONTROL.bg.default,
    color: "inherit",
    cursor: "pointer",
    fontSize: UI_FONT.body,
    fontWeight: 800,
    outline: "none",
    boxShadow: UI_CONTROL.shadow.soft
  },
  optionBtnOn: {
    border: `1px solid ${UI_CONTROL.border.active}`,
    background: UI_CONTROL.bg.accent,
    boxShadow: UI_CONTROL.shadow.hover,
    ["--spx-btn-bg-hover" as any]: UI_CONTROL.bg.accentHover,
    ["--spx-btn-bg-active" as any]: UI_CONTROL.bg.accentActive,
    ["--spx-btn-border-hover" as any]: UI_CONTROL.border.active,
    ["--spx-btn-border-active" as any]: UI_CONTROL.border.active
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
    gap: 8,
    overflowY: "auto",
    overflowX: "hidden",
    paddingRight: 2,
    scrollbarWidth: "thin"
  },

  pre: {
    flex: "0 0 auto",
    margin: 0,
    padding: 10,
    borderRadius: UI_RADIUS.control,
    border: "none",
    background: "#f3f6fa",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: UI_TYPO.size12,
    lineHeight: 1.5
  },

  // 机器语言/控制层：保持和主提示词一致可读性，避免灰区难读
  preNotes: {
    flex: "0 0 auto",
    margin: 0,
    padding: 10,
    borderRadius: UI_RADIUS.control,
    border: "none",
    background: "#f3f6fa",
    color: "#334155",
    overflow: "visible",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
    fontSize: UI_TYPO.size12,
    lineHeight: 1.5
  }
};
