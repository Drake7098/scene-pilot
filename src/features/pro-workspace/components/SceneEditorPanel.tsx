import React, { useEffect, useRef, useState } from "react";
import type { Lang } from "../../../i18n";
import type { Project, Scene, SceneRefMeta } from "../../../model";
import { resolveSceneConfig } from "../../../model";
import { EditorSection, EditorInput, EditorSelect, EditorCheckbox } from "../../../components/ui";
import { Film, Image as ImageIcon } from "lucide-react";
import { t } from "../../../i18n";
import { useFieldState } from "../../../hooks/useFieldState";
import { FIELD_KEYS } from "../../../rules/fieldKeys";
import { deleteRefBlob, getRefBlob, putRefBlob } from "../../../utils/localRefs";
import { FIGMA_COLORS } from "../constants";
import { resolveActiveProFields } from "../../../utils/proFieldsResolver";
import { PRO_CAMERA_PRESETS } from "../../../content/proCameraPresets";

type Props = {
  lang: Lang;
  scene: Scene;
  project: Project | null;
  onUpdateScene: (s: Scene) => void;
};

const BG_MARK = "bg:";
function parseBg(notes: string): string {
  const hit = (notes ?? "")
    .split("\n")
    .find((l) => l.trim().toLowerCase().startsWith(BG_MARK));
  return hit ? hit.trim().slice(BG_MARK.length).trim() : "";
}
function setBg(notes: string, bg: string): string {
  const lines = (notes ?? "").split("\n").filter(Boolean);
  const rest = lines.filter((l) => !l.trim().toLowerCase().startsWith(BG_MARK));
  if (bg.trim()) rest.unshift(`${BG_MARK} ${bg.trim()}`);
  return rest.join("\n");
}

export function SceneEditorPanel({ lang, scene, project, onUpdateScene }: Props) {
  const mediaMode = resolveSceneConfig(scene).mediaMode;
  const shotPlan = (project?.project?.shotPlan ?? "single") as string;
  const isSingle = shotPlan === "single";
  const applyMode = project?.meta?.currentTemplate?.applyMode ?? "layout_only";
  const layoutLocked = applyMode === "layout_only";

  const activeProFields = resolveActiveProFields(scene.notes ?? "");
  const hasProMotion = activeProFields.proMotionIds.length > 0;

  const durationRule = useFieldState(FIELD_KEYS.SCENE_DURATION, scene, project, lang);
  const sceneChangeModeRule = useFieldState(FIELD_KEYS.SCENE_CHANGE_MODE, scene, project, lang);
  const jumpCutRule = useFieldState(FIELD_KEYS.SCENE_JUMP_CUT_MODE, scene, project, lang);
  const entryDirRule = useFieldState(FIELD_KEYS.SCENE_ENTRY_DIRECTION, scene, project, lang);
  const exitDirRule = useFieldState(FIELD_KEYS.SCENE_EXIT_DIRECTION, scene, project, lang);

  const [bgRefThumb, setBgRefThumb] = useState<string>("");
  const [bgRefToast, setBgRefToast] = useState("");
  const bgRefThumbUrlRef = useRef<string>("");
  useEffect(() => {
    const id = scene.backgroundRef?.id;
    if (!id) {
      if (bgRefThumbUrlRef.current) {
        URL.revokeObjectURL(bgRefThumbUrlRef.current);
        bgRefThumbUrlRef.current = "";
      }
      setBgRefThumb("");
      return;
    }
    getRefBlob(id)
      .then((blob) => {
        if (!blob) return;
        if (bgRefThumbUrlRef.current) URL.revokeObjectURL(bgRefThumbUrlRef.current);
        const url = URL.createObjectURL(blob);
        bgRefThumbUrlRef.current = url;
        setBgRefThumb(url);
      })
      .catch(() => setBgRefThumb(""));
    return () => {
      if (bgRefThumbUrlRef.current) {
        URL.revokeObjectURL(bgRefThumbUrlRef.current);
        bgRefThumbUrlRef.current = "";
      }
      setBgRefThumb("");
    };
  }, [scene.backgroundRef?.id]);

  async function setSceneBackgroundRef(files: FileList | null) {
    const picked = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!picked.length) {
      setBgRefToast(lang === "zh" ? "未选择有效图片。" : "No valid image selected.");
      return;
    }
    const file = picked[0];
    const nextRef: SceneRefMeta = {
      id: `bgref_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      mime: file.type,
      size: file.size,
      updatedAt: Date.now(),
    };
    await putRefBlob(nextRef.id, file);
    const prev = scene.backgroundRef;
    if (prev?.id) {
      try {
        await deleteRefBlob(prev.id);
      } catch {
        /* no-op */
      }
    }
    onUpdateScene({ ...scene, backgroundRef: nextRef });
    setBgRefToast(lang === "zh" ? "已更新分镜背景参考图。" : "Shot background reference updated.");
  }

  async function removeSceneBackgroundRef() {
    const prev = scene.backgroundRef;
    if (!prev?.id) return;
    try {
      await deleteRefBlob(prev.id);
    } catch {
      /* no-op */
    }
    onUpdateScene({ ...scene, backgroundRef: undefined });
    setBgRefToast(lang === "zh" ? "已移除分镜背景参考图。" : "Shot background reference removed.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <EditorSection title={t(lang, "scene")} icon={Film} defaultOpen={true}>
        <EditorInput
          label={lang === "zh" ? "场景名称" : "Scene name"}
          value={scene.name ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, name: v })}
          disabled={layoutLocked}
          placeholder={lang === "zh" ? "未命名场景" : "Untitled scene"}
        />
        <EditorInput
          label={lang === "zh" ? "时长 (秒)" : "Duration (s)"}
          type="number"
          value={String(Math.max(1, Math.round(Number(scene.duration_s) || 0)))}
          onChange={(v) => {
            const n = Math.max(1, Math.min(120, Math.round(Number(v) || 1)));
            onUpdateScene({ ...scene, duration_s: n });
          }}
          disabled={!durationRule.enabled}
          title={durationRule.reason}
        />
        <EditorInput
          label={lang === "zh" ? "分镜备注" : "Shot note"}
          value={scene.shotNote ?? ""}
          onChange={(v) => onUpdateScene({ ...scene, shotNote: v })}
          disabled={layoutLocked}
          placeholder={lang === "zh" ? "可选" : "Optional"}
        />
      </EditorSection>

      <EditorSection title={lang === "zh" ? "镜头" : "Camera"} defaultOpen={true}>
        <EditorSelect
          compact
          label={lang === "zh" ? "景别" : "Shot size"}
          value={scene.camera?.shot ?? ""}
          onChange={(v) =>
            onUpdateScene({
              ...scene,
              camera: { ...(scene.camera ?? {}), shot: v }
            })
          }
          disabled={layoutLocked}
          options={[
            { label: lang === "zh" ? "未设置" : "Unset", value: "" },
            { label: lang === "zh" ? "全景" : "Wide", value: "wide" },
            { label: lang === "zh" ? "中景" : "Medium", value: "medium" },
            { label: lang === "zh" ? "特写" : "Close", value: "close" },
            { label: lang === "zh" ? "极近景" : "Extreme close", value: "extreme_close" },
            { label: lang === "zh" ? "自定义" : "Custom", value: "custom" },
          ]}
        />
        <EditorSelect
          compact
          label={lang === "zh" ? "运动" : "Movement"}
          labelSuffix={hasProMotion ? "PRO" : undefined}
          value={scene.camera?.movement ?? ""}
          onChange={(v) =>
            onUpdateScene({
              ...scene,
              camera: { ...(scene.camera ?? {}), movement: v }
            })
          }
          disabled={layoutLocked || mediaMode === "image"}
          options={[
            { label: lang === "zh" ? "未设置" : "Unset", value: "" },
            { label: lang === "zh" ? "静止" : "Static", value: "static" },
            { label: lang === "zh" ? "左摇" : "Pan left", value: "pan_left" },
            { label: lang === "zh" ? "右摇" : "Pan right", value: "pan_right" },
            { label: lang === "zh" ? "推进" : "Push in", value: "push_in" },
            { label: lang === "zh" ? "拉远" : "Pull out", value: "pull_out" },
            { label: lang === "zh" ? "手持" : "Handheld", value: "handheld" },
            // PRO 选项动态追加
            ...activeProFields.proMotionIds.map(id => {
              const preset = PRO_CAMERA_PRESETS.find(p => p.id === id);
              if (!preset) return null;
              return {
                label: (lang === "zh" ? preset.labelZh : preset.labelEn) + " ✦",
                value: id
              };
            }).filter(Boolean) as { label: string; value: string }[]
          ]}
        />
      </EditorSection>

      {sceneChangeModeRule.visible && !isSingle && (
        <EditorSection title={lang === "zh" ? "衔接" : "Continuity"} defaultOpen={false}>
          <EditorSelect
            label={lang === "zh" ? "转场" : "Transition"}
            value={scene.transitionType ?? "cut"}
            onChange={(v) =>
              onUpdateScene({
                ...scene,
                transitionType: v as Scene["transitionType"]
              })
            }
            disabled={layoutLocked || !jumpCutRule.enabled}
            title={jumpCutRule.reason}
            options={[
              { label: "Cut", value: "cut" },
              { label: "Dissolve", value: "dissolve" },
              { label: lang === "zh" ? "反向镜头" : "Reverse angle", value: "reverse_angle" },
            ]}
          />
          <EditorCheckbox
            label={lang === "zh" ? "继承上一镜" : "Inherit from previous"}
            checked={scene.inheritFromPrevious ?? false}
            onCheckedChange={(v) =>
              onUpdateScene({
                ...scene,
                inheritFromPrevious: v
              })
            }
            disabled={!sceneChangeModeRule.enabled}
            title={sceneChangeModeRule.reason}
          />
        </EditorSection>
      )}

      <EditorSection title={lang === "zh" ? "光线" : "Lighting"} defaultOpen={false}>
        <EditorSelect
          compact
          label={lang === "zh" ? "时间" : "Time"}
          value={scene.lighting?.time ?? ""}
          onChange={(v) =>
            onUpdateScene({
              ...scene,
              lighting: { ...(scene.lighting ?? {}), time: v }
            })
          }
          disabled={layoutLocked}
          options={[
            { label: lang === "zh" ? "未设置" : "Unset", value: "" },
            { label: lang === "zh" ? "日间" : "Day", value: "day" },
            { label: lang === "zh" ? "黎明" : "Dawn", value: "dawn" },
            { label: lang === "zh" ? "黄金时段" : "Golden hour", value: "golden_hour" },
            { label: lang === "zh" ? "傍晚" : "Dusk", value: "dusk" },
            { label: lang === "zh" ? "蓝色时段" : "Blue hour", value: "blue_hour" },
            { label: lang === "zh" ? "夜间" : "Night", value: "night" },
            { label: lang === "zh" ? "室内" : "Indoor", value: "indoor" },
          ]}
        />
        <EditorSelect
          compact
          label={lang === "zh" ? "主光方向" : "Key light"}
          value={scene.lighting?.key_dir ?? ""}
          onChange={(v) =>
            onUpdateScene({
              ...scene,
              lighting: { ...(scene.lighting ?? {}), key_dir: v }
            })
          }
          disabled={layoutLocked}
          options={[
            { label: lang === "zh" ? "未设置" : "Unset", value: "" },
            { label: lang === "zh" ? "正面" : "Front", value: "front" },
            { label: lang === "zh" ? "左侧" : "Side left", value: "side_left" },
            { label: lang === "zh" ? "右侧" : "Side right", value: "side_right" },
            { label: lang === "zh" ? "背光" : "Back", value: "back" },
            { label: lang === "zh" ? "顶光" : "Top", value: "top" },
            { label: lang === "zh" ? "轮廓光" : "Rim light", value: "rim_light" },
          ]}
        />
      </EditorSection>

      <EditorSection title={lang === "zh" ? "场景背景" : "Scene Background"} icon={ImageIcon} defaultOpen={false}>
        <EditorSelect
          compact
          label={lang === "zh" ? "背景类型" : "Background Type"}
          value={(() => {
            const v = parseBg(scene.notes ?? "");
            const presets = [
              "",
              "plain white seamless backdrop",
              "plain black seamless backdrop",
              "neutral gray studio backdrop",
              "modern indoor living room",
              "city street, wet pavement, dense storefront signs",
              "urban rooftop skyline",
              "clean futuristic corridor",
              "forest clearing, natural haze",
              "desert dunes",
              "coastal beach, open sky, soft sea haze",
              "deep space, dense starfield",
            ];
            return presets.includes(v) ? v : "__custom__";
          })()}
          onChange={(v) => {
            if (v !== "__custom__") {
              onUpdateScene({ ...scene, notes: setBg(scene.notes ?? "", v) });
            }
          }}
          disabled={layoutLocked}
          options={[
            { value: "", label: lang === "zh" ? "（无）" : "(none)" },
            { value: "plain white seamless backdrop", label: lang === "zh" ? "白底棚拍" : "White studio" },
            { value: "plain black seamless backdrop", label: lang === "zh" ? "黑底棚拍" : "Black studio" },
            { value: "neutral gray studio backdrop", label: lang === "zh" ? "灰底棚拍" : "Gray studio" },
            { value: "modern indoor living room", label: lang === "zh" ? "现代客厅" : "Living room" },
            { value: "city street, wet pavement, dense storefront signs", label: lang === "zh" ? "城市街道" : "City street" },
            { value: "urban rooftop skyline", label: lang === "zh" ? "城市天台" : "Rooftop" },
            { value: "clean futuristic corridor", label: lang === "zh" ? "科幻走廊" : "Futuristic corridor" },
            { value: "forest clearing, natural haze", label: lang === "zh" ? "森林空地" : "Forest" },
            { value: "desert dunes", label: lang === "zh" ? "沙漠" : "Desert" },
            { value: "coastal beach, open sky, soft sea haze", label: lang === "zh" ? "海岸" : "Coastal" },
            { value: "deep space, dense starfield", label: lang === "zh" ? "深空" : "Deep space" },
            { value: "__custom__", label: lang === "zh" ? "自定义…" : "Custom…" },
          ]}
        />
        <EditorInput
          compact
          label={lang === "zh" ? "背景描述" : "Background description"}
          value={parseBg(scene.notes ?? "")}
          onChange={(v) =>
            onUpdateScene({
              ...scene,
              notes: setBg(scene.notes ?? "", v)
            })
          }
          disabled={layoutLocked}
          placeholder={lang === "zh" ? "bg: 自定义背景" : "bg: custom background"}
        />
        <div style={{ marginTop: 2 }}>
          <div style={{ fontSize: 11, color: FIGMA_COLORS.textMuted, marginBottom: 2 }}>
            {lang === "zh" ? "分镜背景参考图" : "Shot Background Ref"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minHeight: 28 }}>
            <label
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px solid ${FIGMA_COLORS.border}`,
                background: FIGMA_COLORS.bg,
                color: FIGMA_COLORS.text,
                fontSize: 12,
                cursor: layoutLocked ? "not-allowed" : "pointer",
                opacity: layoutLocked ? 0.6 : 1,
              }}
            >
              {lang === "zh" ? "导入背景图片" : "Import Background Image"}
              <input
                type="file"
                accept="image/*"
                multiple={false}
                style={{ display: "none" }}
                disabled={layoutLocked}
                onChange={async (e) => {
                  await setSceneBackgroundRef(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {scene.backgroundRef ? (
              <>
                {bgRefThumb ? (
                  <img
                    src={bgRefThumb}
                    alt={scene.backgroundRef.name}
                    style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
                  />
                ) : null}
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {scene.backgroundRef.name}
                </span>
                <button
                  type="button"
                  onClick={() => void removeSceneBackgroundRef()}
                  style={{
                    padding: "4px 8px",
                    border: `1px solid ${FIGMA_COLORS.border}`,
                    background: "transparent",
                    color: FIGMA_COLORS.textMuted,
                    fontSize: 11,
                    borderRadius: 4,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {lang === "zh" ? "移除" : "Remove"}
                </button>
              </>
            ) : null}
          </div>
          {bgRefToast ? (
            <div style={{ marginTop: 4, fontSize: 10, color: FIGMA_COLORS.textMuted }}>{bgRefToast}</div>
          ) : null}
        </div>
      </EditorSection>

      {layoutLocked && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 12px",
            borderRadius: 6,
            background: `${FIGMA_COLORS.accent}20`,
            border: `1px solid ${FIGMA_COLORS.border}`,
            fontSize: 11,
            color: FIGMA_COLORS.textMuted,
          }}
        >
          {lang === "zh"
            ? "当前为「仅布局」应用模式，场景字段不可编辑。"
            : "Layout-only apply mode: scene fields are read-only."}
        </div>
      )}
    </div>
  );
}
