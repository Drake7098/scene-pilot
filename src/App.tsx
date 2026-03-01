import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Lang } from "./i18n";
import { t } from "./i18n";
import { defaultProject } from "./model";
import type { Project, Scene } from "./model";
import { loadLang, saveLang, loadProject, saveProject } from "./utils/storage";

import { Sidebar } from "./components/Sidebar";
import { Stage } from "./components/Stage";
import { PropsPanel } from "./components/PropsPanel";
import { ExportPanel } from "./components/ExportPanel";

import {
  Languages,
  Menu,
  FilePlus2,
  Save,
  SaveAll,
  FolderOpen,
  BookOpen,
  MessageSquareWarning,
  Info
} from "lucide-react";

// ✅ telemetry (需要你已添加 ./utils/analytics.ts)
import {
  isTelemetryOn,
  setTelemetryOptIn,
  track,
  flush,
  newSession,
  installGlobalErrorHooks,
  sendFeedback
} from "./utils/analytics";

type FSFileHandle = any;

type HelpModal = "tutorial" | "feedback" | "about" | null;

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [project, setProject] = useState<Project>(() => loadProject() ?? defaultProject());
  const [sceneIdx, setSceneIdx] = useState<number>(0);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editT, setEditT] = useState<0 | 1>(0);

  const [fileHandle, setFileHandle] = useState<FSFileHandle | null>(null);
  const [fileLabel, setFileLabel] = useState<string>(() => {
    try {
      return localStorage.getItem("scene_pilot_last_file_label") || "";
    } catch {
      return "";
    }
  });

  // ✅ 新建前确认弹窗
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // ✅ 顶部菜单（除中英文切换外，其它按钮都进下拉）
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ 帮助类弹窗：新手教程 / 问题反馈 / 关于
  const [helpModal, setHelpModal] = useState<HelpModal>(null);
  const [tutorialPage, setTutorialPage] = useState<0 | 1>(0);
  const [feedbackText, setFeedbackText] = useState("");

  // ✅ 反馈发送状态
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<"ok" | "fail" | "">("");
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const tt = useMemo(() => (key: string) => t(lang, key), [lang]);
  const useDesktopFixedLayout = viewportWidth >= 1400;

  const safeProject = useMemo(() => {
    if (project.scenes && project.scenes.length > 0) return project;
    return defaultProject();
  }, [project]);

  const scene: Scene = useMemo(() => {
    const list = safeProject.scenes;
    const idx = clampInt(sceneIdx, 0, Math.max(0, list.length - 1));
    return list[idx] ?? list[0];
  }, [safeProject, sceneIdx]);

  // ---------------------- mediaMode + editT lock (minimal) ----------------------
  const mediaMode = useMemo<"image" | "video">(() => {
    // 尽量兼容不同字段命名（按你项目实际字段优先命中）
    const s: any = scene as any;
    const m =
      s?.mediaMode ??
      s?.mode ??
      s?.media?.mode ??
      s?.media?.type ??
      s?.export?.mediaMode ??
      "video";
    return m === "image" ? "image" : "video";
  }, [scene]);

  // image 模式强制只用 t0
  const effectiveEditT: 0 | 1 = mediaMode === "image" ? 0 : editT;

  // 当切到 image 时，把状态 editT 拉回 0（避免 UI 残留在 1）
  useEffect(() => {
    if (mediaMode === "image" && editT !== 0) setEditT(0);
  }, [mediaMode, editT]);

  // ---------------------- Telemetry boot (最小新增) ----------------------
  useEffect(() => {
    // ✅ 默认开启埋点（你若要默认关闭：改成 setTelemetryOptIn(false)）
    try {
      const v = localStorage.getItem("spx_telemetry_on");
      if (v == null) setTelemetryOptIn(true);
    } catch {
      // Ignore localStorage access failures (privacy mode / blocked storage).
    }

    // ✅ 新会话
    newSession();

    if (isTelemetryOn()) {
      track("app_open", { app: "ScenePilotix", ver: "1.03" }, lang);
      installGlobalErrorHooks(lang);

      // ✅ 在线心跳
      const ping = () => {
        track("session_ping", { sceneIdx }, lang);
        void flush();
      };
      ping();
      const timer = window.setInterval(ping, 30000);

      // 关闭/刷新前尽量 flush 一次
      const onUnload = () => {
        void flush();
      };
      window.addEventListener("beforeunload", onUnload);

      return () => {
        window.clearInterval(timer);
        window.removeEventListener("beforeunload", onUnload);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语言切换埋点
  useEffect(() => {
    if (isTelemetryOn()) track("lang_view", { lang }, lang);
  }, [lang]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function updateProject(next: Project) {
    setProject(next);
    saveProject(next);
  }

  function updateScene(nextScene: Scene) {
    const idx = clampInt(sceneIdx, 0, Math.max(0, safeProject.scenes.length - 1));
    const next: Project = {
      ...safeProject,
      scenes: safeProject.scenes.map((s, i) => (i === idx ? nextScene : s))
    };
    updateProject(next);
  }

  function doNewProjectNow() {
    const p = defaultProject();
    setSceneIdx(0);
    setSelectedLayerId(null);
    setEditT(0);
    setFileHandle(null);
    setLabelPersist("");
    updateProject(p);

    if (isTelemetryOn()) track("project_new", {}, lang);
  }

  function requestNewProject() {
    setShowNewConfirm(true);
    if (isTelemetryOn()) track("project_new_confirm_open", {}, lang);
  }

  function toggleLang() {
    const next: Lang = lang === "zh" ? "en" : "zh";
    setLang(next);
    saveLang(next);
    if (isTelemetryOn()) track("lang_toggle", { from: lang, to: next }, next);
  }

  // ---------------------- File IO ----------------------
  function hasFSAccess() {
    const w = window as any;
    return !!w.showOpenFilePicker && !!w.showSaveFilePicker;
  }

  function prettyHandleLabel(h: any) {
    const name = (h && (h.name || h?.getFile?.name)) || "";
    return name || "";
  }

  function setLabelPersist(label: string) {
    setFileLabel(label);
    try {
      if (label) localStorage.setItem("scene_pilot_last_file_label", label);
      else localStorage.removeItem("scene_pilot_last_file_label");
    } catch {
      // Ignore localStorage access failures when persisting file label.
    }
  }

  async function writeHandle(handle: any, p: Project) {
    const json = JSON.stringify(p, null, 2);
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
  }

  async function readHandle(handle: any): Promise<Project | null> {
    try {
      const file = await handle.getFile();
      const text = await file.text();
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.scenes)) return null;
      return obj as Project;
    } catch {
      return null;
    }
  }

  function downloadJson(text: string, filename: string) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function saveAsToDisk() {
    const w = window as any;

    if (!hasFSAccess()) {
      downloadJson(JSON.stringify(project, null, 2), `scene_pilot_${Date.now()}.json`);
      if (isTelemetryOn()) track("project_save_as", { via: "download" }, lang);
      return;
    }

    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileLabel || "scene_pilot_project.json",
        types: [
          {
            description: "ScenePilotix Project (JSON)",
            accept: { "application/json": [".json"] }
          }
        ]
      });

      await writeHandle(handle, project);
      setFileHandle(handle);
      setLabelPersist(prettyHandleLabel(handle) || "scene_pilot_project.json");

      if (isTelemetryOn()) track("project_save_as", { via: "fs" }, lang);
    } catch {
      // User may cancel save picker; ignore and keep current state.
    }
  }

  async function saveToDisk() {
    if (fileHandle && hasFSAccess()) {
      try {
        await writeHandle(fileHandle, project);
        const label = prettyHandleLabel(fileHandle) || fileLabel;
        if (label) setLabelPersist(label);

        if (isTelemetryOn()) track("project_save", { via: "fs" }, lang);
        return;
      } catch {
        // fallthrough -> save as
      }
    }
    await saveAsToDisk();
  }

  async function openFromDisk() {
    const w = window as any;

    if (!hasFSAccess()) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const [handle] = await w.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "ScenePilotix Project (JSON)",
            accept: { "application/json": [".json"] }
          }
        ]
      });

      const p = await readHandle(handle);
      if (p) {
        setProject(p);
        setSceneIdx(0);
        setSelectedLayerId(null);
        setEditT(0);
        setFileHandle(handle);
        setLabelPersist(prettyHandleLabel(handle) || "scene_pilot_project.json");

        if (isTelemetryOn()) track("project_open", { via: "fs" }, lang);
      }
    } catch {
      // User may cancel open picker; ignore and keep current state.
    }
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      if (!obj || !Array.isArray(obj.scenes)) return;
      setProject(obj as Project);
      setSceneIdx(0);
      setSelectedLayerId(null);
      setEditT(0);
      setFileHandle(null);
      setLabelPersist(f.name);

      if (isTelemetryOn()) track("project_open", { via: "upload" }, lang);
    } catch {
      // Ignore invalid upload payloads and JSON parse failures.
    }
  }

  // ---------------------- Helpers: dropdown actions ----------------------
  function closeMenu() {
    setMenuOpen(false);
  }

  async function menuAction(fn: () => void | Promise<void>, ev?: string) {
    closeMenu();
    if (ev && isTelemetryOn()) track(ev, {}, lang);
    try {
      await fn();
    } catch {
      // ignore
    }
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      document.body.removeChild(ta);
      return true;
    }
  }

  // ✅ 发送反馈到服务器（最小新增）
  async function submitFeedback() {
    const msg =
      feedbackText.trim() ||
      (lang === "zh"
        ? "【问题】\n【复现步骤】1) \n【期望】\n【实际】\n【环境】"
        : "[Issue]\n[Steps] 1)\n[Expected]\n[Actual]\n[Env]");

    setFeedbackSending(true);
    setFeedbackSent("");

    try {
      // 备注：sendFeedback 只在 telemetry on 时才会发；你已默认开启
      const ok = await sendFeedback(msg, { app: "ScenePilotix", ver: "1.03", sceneIdx }, lang);
      setFeedbackSent(ok ? "ok" : "fail");
      if (ok) {
        if (isTelemetryOn()) track("feedback_sent", { len: msg.length }, lang);
        setFeedbackText("");
      }
    } catch {
      setFeedbackSent("fail");
    } finally {
      setFeedbackSending(false);
    }
  }

  // ---------------------- UI ----------------------
  return (
    <div style={styles.app}>
      <div style={styles.top}>
        {/* ✅ 左上角 Logo：ScenePilotix + 放大中文；彻底移除原 tagline 行 */}
        <div style={styles.brand} title="ScenePilotix">
          <div style={styles.logoRow}>
            <div style={styles.logoEn}>ScenePilotix</div>
            <div style={styles.logoZh}>场景领航</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* ✅ 保留中英文切换按钮 */}
        <button style={styles.topBtn} onClick={toggleLang} type="button">
          <Languages size={16} />
          <span>{lang === "zh" ? "中文" : "EN"}</span>
        </button>

        {/* ✅ 其它按钮：统一收入口径 -> 下拉菜单 */}
        <button
          style={styles.topBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setMenuOpen((v) => !v);
            if (isTelemetryOn()) track("menu_toggle", { open: !menuOpen }, lang);
          }}
          type="button"
          title={lang === "zh" ? "菜单" : "Menu"}
        >
          <Menu size={16} />
          <span>{lang === "zh" ? "菜单" : "Menu"}</span>
        </button>

        {/* hidden file input for no FS access */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={onUploadFile}
        />
      </div>

      {/* ✅ 下拉菜单：点击外部关闭 */}
      {menuOpen && (
        <div
          style={styles.menuMask}
          onMouseDown={() => setMenuOpen(false)}
          onClick={() => setMenuOpen(false)}
          role="presentation"
        >
          <div
            style={styles.menu}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.menuSectionTitle}>{lang === "zh" ? "项目" : "Project"}</div>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() => menuAction(() => requestNewProject(), "menu_new_project")}
            >
              <FilePlus2 size={16} />
              <span>{tt("top.newProject")}</span>
            </button>

            <button style={styles.menuItem} type="button" onClick={() => menuAction(() => saveToDisk(), "menu_save")}>
              <Save size={16} />
              <span>{lang === "zh" ? "保存" : "Save"}</span>
            </button>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() => menuAction(() => saveAsToDisk(), "menu_save_as")}
            >
              <SaveAll size={16} />
              <span>{lang === "zh" ? "另存为" : "Save As"}</span>
            </button>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() => menuAction(() => openFromDisk(), "menu_open")}
            >
              <FolderOpen size={16} />
              <span>{lang === "zh" ? "打开" : "Open"}</span>
            </button>

            <div style={styles.menuSep} />

            <div style={styles.menuSectionTitle}>{lang === "zh" ? "帮助" : "Help"}</div>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() =>
                menuAction(() => {
                  setHelpModal("tutorial");
                  setTutorialPage(0);
                }, "menu_tutorial")
              }
            >
              <BookOpen size={16} />
              <span>{lang === "zh" ? "新手教程" : "Beginner Tutorial"}</span>
            </button>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() =>
                menuAction(() => {
                  setHelpModal("feedback");
                  setFeedbackSent("");
                }, "menu_feedback")
              }
            >
              <MessageSquareWarning size={16} />
              <span>{lang === "zh" ? "问题反馈" : "Feedback"}</span>
            </button>

            <button
              style={styles.menuItem}
              type="button"
              onClick={() =>
                menuAction(() => {
                  setHelpModal("about");
                }, "menu_about")
              }
            >
              <Info size={16} />
              <span>{lang === "zh" ? "关于" : "About"}</span>
            </button>
          </div>
        </div>
      )}

      <div style={{ ...styles.main, ...(useDesktopFixedLayout ? styles.mainDesktop : {}) }}>
        <Sidebar
          lang={lang}
          project={safeProject}
          sceneIdx={sceneIdx}
          setSceneIdx={(i) => {
            setSceneIdx(i);
            setSelectedLayerId(null);
            setEditT(0);
            if (isTelemetryOn()) track("scene_select", { idx: i }, lang);
          }}
          onUpdateProject={(p) => {
            updateProject(p);
            if (isTelemetryOn()) track("project_update", { scenes: (p.scenes || []).length }, lang);
          }}
          scene={scene}
          selectedLayerId={selectedLayerId}
          onSelectLayer={(id) => {
            setSelectedLayerId(id);
            setEditT(0);
            if (isTelemetryOn()) track("layer_select", { id: id || "" }, lang);
          }}
          onUpdateScene={(s) => {
            updateScene(s);
            if (isTelemetryOn()) track("scene_update", { idx: sceneIdx }, lang);
          }}
        />

        <div style={styles.center}>
          <Stage
            scene={scene}
            selectedLayerId={selectedLayerId}
            onSelectLayer={(id) => {
              setSelectedLayerId(id);
              if (!id) setEditT(0);
              if (isTelemetryOn()) track("stage_select", { id: id || "" }, lang);
            }}
            onUpdateScene={(s) => {
              updateScene(s);
              if (isTelemetryOn()) track("stage_update", { idx: sceneIdx }, lang);
            }}
            editT={effectiveEditT}
          />

          <ExportPanel
            lang={lang}
            project={safeProject}
            sceneIdx={sceneIdx}
            selectedLayerId={selectedLayerId}
          />
        </div>

        <PropsPanel
          lang={lang}
          scene={scene}
          selectedLayerId={selectedLayerId}
          onUpdateScene={(s) => {
            updateScene(s);
            if (isTelemetryOn()) track("props_update_scene", { idx: sceneIdx }, lang);
          }}
          onRenameLayer={(oldId, newId) => {
            if (selectedLayerId === oldId) setSelectedLayerId(newId);
            if (isTelemetryOn()) track("layer_rename", { oldId, newId }, lang);
          }}
          editT={effectiveEditT}
          setEditT={(tv) => {
            // ✅ image 模式禁止进 t1（保留数据但锁编辑）
            if (mediaMode === "image" && tv === 1) return;

            setEditT(tv);
            if (isTelemetryOn()) track("editT_set", { t: tv }, lang);
          }}
        />
      </div>

      {/* ✅ 新建确认弹窗 */}
      {showNewConfirm && (
        <div style={styles.modalMask} onMouseDown={() => setShowNewConfirm(false)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div style={styles.modalTitle}>{lang === "zh" ? "新建项目" : "New Project"}</div>
            <div style={styles.modalText}>{lang === "zh" ? "要先保存当前项目吗？" : "Do you want to save the current project first?"}</div>

            <div style={{ height: 10 }} />

            <div style={styles.modalBtns}>
              <button style={styles.modalBtnGhost} onClick={() => setShowNewConfirm(false)} type="button">
                {lang === "zh" ? "取消" : "Cancel"}
              </button>

              <button
                style={styles.modalBtnDanger}
                onClick={() => {
                  setShowNewConfirm(false);
                  doNewProjectNow();
                }}
                type="button"
              >
                {lang === "zh" ? "不保存直接新建" : "New without saving"}
              </button>

              <button
                style={styles.modalBtn}
                onClick={async () => {
                  setShowNewConfirm(false);
                  await saveToDisk();
                  doNewProjectNow();
                }}
                type="button"
              >
                {lang === "zh" ? "保存后新建" : "Save then new"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 新手教程 / 问题反馈 / 关于 */}
      {helpModal && (
        <div style={styles.modalMask} onMouseDown={() => setHelpModal(null)} role="presentation">
          <div
            style={styles.modal}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {helpModal === "tutorial" && (
              <>
                <div style={styles.tutorialTop}>
                  <div style={styles.modalTitle}>{lang === "zh" ? "新手教程" : "Beginner Tutorial"}</div>
                  {tutorialPage === 0 ? (
                    <button
                      style={styles.tutorialPill}
                      onClick={() => {
                        setTutorialPage(1);
                        if (isTelemetryOn()) track("tutorial_advanced_open", {}, lang);
                      }}
                      type="button"
                    >
                      {lang === "zh" ? "高阶用户提醒" : "Advanced Tips"}
                    </button>
                  ) : (
                    <div style={styles.tutorialPageTag}>{lang === "zh" ? "进阶工作流" : "Advanced Workflow"}</div>
                  )}
                </div>
                <div style={styles.modalText}>
                  {tutorialPage === 0 ? (
                    lang === "zh" ? (
                      <>
                        <div style={styles.tutBlockTitle}>ScenePilotix 的核心作用</div>
                        <div style={styles.tutText}>
                          把“对象位置、大小、层级、镜头、光照、运动轨迹”先结构化，再导出到生成平台。<br />
                          目标不是替你写花哨提示词，而是让模型更遵守你的画面结构。
                        </div>

                        <div style={styles.tutBlockTitle}>你怎么用（新手最快路径）</div>
                        <div style={styles.tutText}>
                          1) 创建分镜，先选图片模式，Quick 起步。<br />
                          2) 在画布放对象，先锁布局（位置/大小/层级），再补对象属性。<br />
                          3) 点导出，选择平台并复制提示词去目标平台生成。<br />
                          4) 如果结果偏离，再回到对象和镜头字段微调，而不是堆长提示词。
                        </div>

                        <div style={styles.tutBlockTitle}>上手原则</div>
                        <div style={styles.tutText}>
                          先少对象（3-6 个）跑通，再扩大复杂度；先稳定结构，再加风格细节。
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={styles.tutBlockTitle}>Core Value of ScenePilotix</div>
                        <div style={styles.tutText}>
                          Structure object position, scale, layering, camera, lighting, and motion paths first, then export for generation.<br />
                          The goal is not fancy prompts. The goal is stronger structural compliance.
                        </div>

                        <div style={styles.tutBlockTitle}>Fast Start (Beginner Path)</div>
                        <div style={styles.tutText}>
                          1) Create a scene, start in Image mode with Quick.<br />
                          2) Place objects on canvas and lock layout first (position/size/z-order), then fill object details.<br />
                          3) Click Export, choose platform, copy prompt and run it on target platform.<br />
                          4) If output drifts, tune object/camera fields first instead of stacking long prompt text.
                        </div>

                        <div style={styles.tutBlockTitle}>Starter Rule</div>
                        <div style={styles.tutText}>
                          Start with 3-6 objects. Stabilize structure first, then add style details.
                        </div>
                      </>
                    )
                  ) : lang === "zh" ? (
                    <>
                      <div style={styles.tutBlockTitle}>进阶工作流：从生图到 PRO 构建</div>
                      <div style={styles.tutText}>
                        <b>Step 1 生图基线（Quick）</b><br />
                        用图片模式先拿到“结构正确”的基线图：对象是否在正确区域、比例是否合理、主体是否清晰。
                      </div>

                      <div style={styles.tutBlockTitle}>Step 2 PRO 多目标构建</div>
                      <div style={styles.tutText}>
                        切到 PRO 后，再加复杂目标：插图参考、局部约束、平台导出策略。<br />
                        建议每次只新增一类复杂度（例如先加参考图，再加局部风格），便于定位偏差来源。
                      </div>

                      <div style={styles.tutBlockTitle}>Step 3 连续一致性（视频/多图批次）</div>
                      <div style={styles.tutText}>
                        进入视频模式后，用 t0→t1 只控制必要运动对象；静止对象不改。<br />
                        连续性检查重点：主体身份、服装材质、关键道具位置、光照方向、镜头运动逻辑。
                      </div>

                      <div style={styles.tutBlockTitle}>进阶提醒</div>
                      <div style={styles.tutText}>
                        PRO 的价值在“多约束协同”，不是“更长提示词”。<br />
                        如果结果变差，优先回退到上一个稳定版本，再逐项加回。
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.tutBlockTitle}>Advanced Workflow: From Image to PRO</div>
                      <div style={styles.tutText}>
                        <b>Step 1 Image Baseline (Quick)</b><br />
                        First get a structurally-correct still: object region, scale relationship, and subject clarity.
                      </div>

                      <div style={styles.tutBlockTitle}>Step 2 PRO Multi-Target Build</div>
                      <div style={styles.tutText}>
                        Then switch to PRO and add complexity in layers: reference images, local constraints, and platform-specific export strategy.<br />
                        Add one complexity class at a time to isolate regressions.
                      </div>

                      <div style={styles.tutBlockTitle}>Step 3 Continuity Lock (Video / Batch)</div>
                      <div style={styles.tutText}>
                        In video mode, only animate what must move from t0→t1. Keep static objects untouched.<br />
                        Continuity checks: subject identity, outfit/material, key prop position, light direction, camera logic.
                      </div>

                      <div style={styles.tutBlockTitle}>Advanced Reminder</div>
                      <div style={styles.tutText}>
                        PRO wins by coordinated constraints, not by longer prompts.<br />
                        If quality drops, roll back to the last stable version and re-add constraints one by one.
                      </div>
                    </>
                  )}
                </div>

                <div style={styles.modalBtns}>
                  {tutorialPage === 1 ? (
                    <button style={styles.modalBtnGhost} onClick={() => setTutorialPage(0)} type="button">
                      {lang === "zh" ? "返回基础页" : "Back to Basics"}
                    </button>
                  ) : (
                    <button style={styles.modalBtnGhost} onClick={() => setTutorialPage(1)} type="button">
                      {lang === "zh" ? "下一页：进阶工作流" : "Next: Advanced Workflow"}
                    </button>
                  )}
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      setTutorialPage(0);
                      if (isTelemetryOn()) track("tutorial_close", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </>
            )}

            {helpModal === "feedback" && (
              <>
                <div style={styles.modalTitle}>{lang === "zh" ? "问题反馈" : "Feedback"}</div>
                <div style={styles.modalText}>
                  {lang === "zh"
                    ? "你可以直接在这里发送到服务器（我能看到统计与内容），也可以复制模板贴给我。"
                    : "You can send it to the server (so I can see stats & content), or copy the template to share with me."}
                </div>

                <div style={styles.feedbackTpl}>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【问题】" : "[Issue]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【复现步骤】1) 2) 3)" : "[Steps] 1) 2) 3)"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【期望】" : "[Expected]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【实际】" : "[Actual]"}</div>
                  <div style={styles.feedbackTplLine}>{lang === "zh" ? "【环境】浏览器/系统" : "[Env] Browser/OS"}</div>
                </div>

                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder={
                    lang === "zh"
                      ? "把你的反馈写在这里（可选），然后点“发送”或“复制”"
                      : "Write your feedback here (optional), then click Send or Copy"
                  }
                  style={styles.feedbackArea}
                />

                {feedbackSent && (
                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.82 }}>
                    {feedbackSent === "ok"
                      ? lang === "zh"
                        ? "✅ 已发送"
                        : "✅ Sent"
                      : lang === "zh"
                        ? "❌ 发送失败（可能是未部署 telemetry worker 或网络问题）"
                        : "❌ Failed (worker not deployed or network issue)"}
                  </div>
                )}

                <div style={styles.modalBtns}>
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      setFeedbackSent("");
                      if (isTelemetryOn()) track("feedback_close", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>

                  <button
                    style={styles.modalBtnGhost}
                    onClick={async () => {
                      const text =
                        feedbackText.trim() ||
                        (lang === "zh"
                          ? "【问题】\n【复现步骤】1) \n【期望】\n【实际】\n【环境】"
                          : "[Issue]\n[Steps] 1)\n[Expected]\n[Actual]\n[Env]");
                      await copyToClipboard(text);
                      if (isTelemetryOn()) track("feedback_copy", { len: text.length }, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "复制" : "Copy"}
                  </button>

                  <button style={styles.modalBtn} onClick={submitFeedback} type="button" disabled={feedbackSending}>
                    {feedbackSending ? (lang === "zh" ? "发送中…" : "Sending…") : lang === "zh" ? "发送" : "Send"}
                  </button>
                </div>
              </>
            )}

            {helpModal === "about" && (
              <>
                <div style={styles.modalTitle}>{lang === "zh" ? "关于" : "About"}</div>
                <div style={styles.modalText}>
                  <div style={{ fontWeight: 900, opacity: 0.95 }}>ScenePilotix</div>
                  <div style={{ marginTop: 6, opacity: 0.82, lineHeight: 1.55 }}>
                    {lang === "zh"
                      ? "一个用于“分镜结构 + 精准构图 + 运动轨迹”提示词生成的工具。目标：让大模型更稳定地理解你想要的画面位置、尺寸和运动。"
                      : "A tool for storyboard structure + precise composition + motion paths prompt generation. Goal: make models follow layout/scale/motion more reliably."}
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.7 }}>
                    {lang === "zh" ? "Version: 1.03 (Universal)" : "Version: 1.03 (Universal)"}
                  </div>
                </div>

                <div style={styles.modalBtns}>
                  <button
                    style={styles.modalBtnGhost}
                    onClick={() => {
                      setHelpModal(null);
                      if (isTelemetryOn()) track("about_close", {}, lang);
                    }}
                    type="button"
                  >
                    {lang === "zh" ? "关闭" : "Close"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function clampInt(v: number, a: number, b: number) {
  const x = Number.isFinite(v) ? v : a;
  return Math.max(a, Math.min(b, x));
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    color: "rgba(255,255,255,0.92)",
    background: "radial-gradient(1200px 700px at 20% 10%, rgba(120,180,255,0.18), transparent 50%), #0b1020"
  },
  top: {
    height: 58,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "0 12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(0,0,0,0.15)",
    backdropFilter: "blur(8px)"
  },

  // ✅ brand：单行（彻底去掉 File badge 与 tagline）
  brand: { display: "flex", alignItems: "center" },
  logoRow: { display: "flex", alignItems: "baseline", gap: 10, lineHeight: 1 },
  logoEn: { fontWeight: 900, fontSize: 16, letterSpacing: 0.2 },
  logoZh: { fontWeight: 900, fontSize: 18, opacity: 0.88 },

  topBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    outline: "none",
    boxShadow: "none"
  },

  main: { flex: 1, display: "flex", minHeight: 0 },
  mainDesktop: {
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr) 344px"
  },

  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0
  },

  // ---- dropdown menu ----
  menuMask: {
    position: "fixed",
    inset: 0,
    zIndex: 9998
  },
  menu: {
    position: "absolute",
    top: 58,
    right: 12,
    width: 280,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 10
  },
  menuSectionTitle: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.65,
    padding: "6px 8px"
  },
  menuItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900,
    outline: "none",
    boxShadow: "none",
    marginBottom: 8,
    textAlign: "left"
  },
  menuSep: {
    height: 1,
    background: "rgba(255,255,255,0.10)",
    margin: "8px 6px 10px"
  },

  // ---- modal ----
  modalMask: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999
  },
  modal: {
    width: 520,
    maxWidth: "100%",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,20,35,0.96)",
    boxShadow: "0 18px 60px rgba(0,0,0,0.45)",
    padding: 14
  },
  modalTitle: { fontWeight: 900, fontSize: 14, opacity: 0.95 },
  modalText: { marginTop: 8, fontSize: 12, opacity: 0.82, lineHeight: 1.6 },

  modalBtns: { display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 12 },

  modalBtn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(120,180,255,0.35)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnGhost: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },
  modalBtnDanger: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,80,80,0.10)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 900
  },

  // ---- tutorial formatting ----
  tutorialTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  tutorialPill: {
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid rgba(120,180,255,0.4)",
    background: "rgba(120,180,255,0.12)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 900
  },
  tutorialPageTag: {
    fontSize: 11,
    fontWeight: 900,
    opacity: 0.78,
    padding: "5px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)"
  },
  tutBlockTitle: { marginTop: 10, fontWeight: 900, opacity: 0.92 },
  tutText: { marginTop: 6, opacity: 0.82 },

  // ---- feedback ----
  feedbackTpl: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)"
  },
  feedbackTplLine: { fontSize: 12, opacity: 0.82, lineHeight: 1.55 },
  feedbackArea: {
    width: "100%",
    marginTop: 10,
    minHeight: 110,
    resize: "vertical",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.20)",
    color: "rgba(255,255,255,0.92)",
    outline: "none",
    padding: "10px 10px",
    fontSize: 12,
    lineHeight: 1.45
  }
};
