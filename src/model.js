const MEDIA_MARK = "media:";
const COMPILER_MARK = "@compiler:";
const SCENE_TIER_MARK = "@scene_tier:";
const V2_MODE_MARK = "@v2_mode:";
const STAB_MARK = "stability:";
function parseMarker(notes, mark) {
    const lines = (notes ?? "").split("\n");
    const hit = lines.find((line) => line.trim().toLowerCase().startsWith(mark));
    if (!hit)
        return "";
    return hit.trim().slice(mark.length).trim().toLowerCase();
}
function replaceMarker(notes, mark, value) {
    const lines = (notes ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    const rest = lines.filter((line) => !line.toLowerCase().startsWith(mark));
    return [`${mark} ${value}`, ...rest].join("\n");
}
export function resolveSceneConfig(scene) {
    const notes = scene?.notes ?? "";
    const conf = scene?.config ?? {};
    const mediaFromMarker = parseMarker(notes, MEDIA_MARK) === "image" ? "image" : "video";
    const compilerFromMarker = parseMarker(notes, COMPILER_MARK) === "v2" ? "v2" : "v1";
    const tierRaw = parseMarker(notes, SCENE_TIER_MARK);
    const sceneTierFromMarker = tierRaw === "indoor" || tierRaw === "open_space" ? tierRaw : "small_plaza";
    const v2FromMarker = parseMarker(notes, V2_MODE_MARK) === "short" ? "short" : "strict";
    const stabRaw = parseMarker(notes, STAB_MARK);
    const stabilityFromMarker = stabRaw === "off" ? "off" : stabRaw === "strict" ? "strict" : "standard";
    return {
        mediaMode: conf.mediaMode === "image" || conf.mediaMode === "video" ? conf.mediaMode : mediaFromMarker,
        compiler: conf.compiler === "v2" ? "v2" : conf.compiler === "v1" ? "v1" : compilerFromMarker,
        sceneTier: conf.sceneTier === "indoor" || conf.sceneTier === "small_plaza" || conf.sceneTier === "open_space"
            ? conf.sceneTier
            : sceneTierFromMarker,
        v2Mode: conf.v2Mode === "short" || conf.v2Mode === "strict" ? conf.v2Mode : v2FromMarker,
        stability: conf.stability === "off" || conf.stability === "standard" || conf.stability === "strict"
            ? conf.stability
            : stabilityFromMarker
    };
}
export function withSceneConfig(scene, patch) {
    const base = resolveSceneConfig(scene);
    const nextConfig = { ...base, ...patch };
    let nextNotes = scene.notes ?? "";
    nextNotes = replaceMarker(nextNotes, MEDIA_MARK, nextConfig.mediaMode);
    nextNotes = replaceMarker(nextNotes, COMPILER_MARK, nextConfig.compiler);
    nextNotes = replaceMarker(nextNotes, SCENE_TIER_MARK, nextConfig.sceneTier);
    nextNotes = replaceMarker(nextNotes, V2_MODE_MARK, nextConfig.v2Mode);
    nextNotes = replaceMarker(nextNotes, STAB_MARK, nextConfig.stability);
    return { ...scene, notes: nextNotes, config: nextConfig };
}
// ---------- helpers (internal) ----------
function clamp(n, min, max) {
    if (Number.isNaN(n))
        return min;
    return Math.max(min, Math.min(max, n));
}
function ensureArray(v, fallback = []) {
    return Array.isArray(v) ? v : fallback;
}
function inferMediaTypeFromScenes(scenes) {
    let hasImage = false;
    let hasVideo = false;
    for (const s of scenes) {
        const mediaMode = resolveSceneConfig(s).mediaMode;
        if (mediaMode === "image")
            hasImage = true;
        else
            hasVideo = true;
    }
    if (hasImage && !hasVideo)
        return "image";
    return "video";
}
/**
 * ✅ 关键点：不要让 UI / Stage 遇到 undefined 的 kf[0] / 找不到 t=0 / t=1
 * 这个函数会“就地补齐” layer.kf 的 t=0 或 t=1。
 */
export function ensureKF(layer, t) {
    const kfs = ensureArray(layer.kf, []);
    layer.kf = kfs;
    const found = layer.kf.find((k) => k.t === t);
    if (found)
        return found;
    const base = layer.kf.find((k) => k.t === 0) ??
        layer.kf[0] ?? { t: 0, x: 50, y: 50, w: 20, h: 20, rot: 0 };
    const created = { ...base, t };
    layer.kf.push(created);
    layer.kf.sort((a, b) => a.t - b.t);
    return created;
}
/**
 * ✅ 用于“从 storage 读出来”的项目做一次清洗：
 * - 补齐 scene.camera.keyframes 的 t=0/1
 * - 补齐每个 layer 的 t=0/1
 * - clamp 数值避免 NaN/越界导致画布爆掉
 *
 * 不改变数据结构，只保证字段健壮。
 */
export function sanitizeProject(p) {
    // 尽量不假设 p 一定干净：但也不在这里做复杂 schema 校验
    const scenes = ensureArray(p?.scenes, []);
    for (const s of scenes) {
        s.duration_s = clamp(s.duration_s ?? 6, 1, 600);
        // camera
        if (!s.camera) {
            s.camera = {
                shot: "wide",
                movement: "static",
                keyframes: [
                    { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
                    { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
                ]
            };
        }
        s.camera.keyframes = ensureArray(s.camera.keyframes, []);
        const c0 = s.camera.keyframes.find((k) => k.t === 0) ?? { t: 0, x: 0, y: 0, zoom: 1, rot: 0 };
        const c1 = s.camera.keyframes.find((k) => k.t === 1) ?? { ...c0, t: 1 };
        // 去重并排序
        s.camera.keyframes = [c0, c1].map((k) => ({
            ...k,
            x: clamp(k.x, -10000, 10000),
            y: clamp(k.y, -10000, 10000),
            zoom: clamp(k.zoom, 0.01, 100),
            rot: clamp(k.rot, -3600, 3600)
        }));
        // lighting
        if (!s.lighting)
            s.lighting = { time: "sunset", key_dir: "top_right", mood: "cinematic" };
        // layers
        s.layers = ensureArray(s.layers, []);
        for (const l of s.layers) {
            l.opacity = clamp(l.opacity ?? 1, 0, 1);
            l.z = clamp(l.z ?? 0, -9999, 9999);
            l.look = l.look ?? "";
            l.color = l.color ?? "#b7c3ff";
            l.notes = l.notes ?? "";
            l.externalPrompt = l.externalPrompt ?? "";
            l.referenceLinks = l.referenceLinks ?? "";
            l.localRefs = Array.isArray(l.localRefs) ? l.localRefs : [];
            l.referencePolicy = l.referencePolicy === "required" ? "required" : "optional";
            l.type = l.type ?? "";
            l.shape = (l.shape ?? "rect");
            l.kf = ensureArray(l.kf, []);
            const k0 = ensureKF(l, 0);
            const k1 = ensureKF(l, 1);
            // clamp kf 数值
            for (const k of [k0, k1]) {
                k.x = clamp(k.x, 0, 100);
                k.y = clamp(k.y, 0, 100);
                k.w = clamp(k.w, 0, 100);
                k.h = clamp(k.h, 0, 100);
                k.rot = clamp(k.rot, -3600, 3600);
            }
        }
        s.notes = s.notes ?? "";
        s.config = resolveSceneConfig(s);
        s.name = s.name ?? "Scene";
        s.id = s.id ?? `s_${Math.random().toString(16).slice(2)}`;
        s.index = Number.isFinite(s.index) ? Math.max(1, Math.round(s.index)) : undefined;
        s.layoutLocked = !!s.layoutLocked;
        const bgRefRaw = s.backgroundRef;
        if (bgRefRaw && typeof bgRefRaw === "object" && typeof bgRefRaw.id === "string") {
            s.backgroundRef = {
                id: String(bgRefRaw.id),
                name: String(bgRefRaw.name ?? "background.jpg"),
                mime: String(bgRefRaw.mime ?? "image/jpeg"),
                size: Number.isFinite(bgRefRaw.size) ? Math.max(0, Number(bgRefRaw.size)) : 0,
                updatedAt: Number.isFinite(bgRefRaw.updatedAt) ? Number(bgRefRaw.updatedAt) : Date.now()
            };
        }
        else {
            s.backgroundRef = undefined;
        }
        s.cameraPreset = typeof s.cameraPreset === "string" ? s.cameraPreset : "";
        s.shotNote = typeof s.shotNote === "string" ? s.shotNote : "";
        const entryRaw = String(s.entryDir ?? "").toUpperCase();
        const exitRaw = String(s.exitDir ?? "").toUpperCase();
        s.entryDir = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].includes(entryRaw) ? entryRaw : undefined;
        s.exitDir = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"].includes(exitRaw) ? exitRaw : undefined;
    }
    // project meta
    if (!p.project)
        p.project = { mode: "storyboard" };
    p.project.mode = (p.project.mode ?? "storyboard");
    p.project.mediaType = p.project.mediaType === "image" || p.project.mediaType === "video"
        ? p.project.mediaType
        : inferMediaTypeFromScenes(scenes);
    const rawPlan = (p.project.shotPlan ?? "single");
    p.project.shotPlan = ["single", "multicam", "continuous", "edit"].includes(rawPlan) ? rawPlan : "single";
    const creativeRaw = p.project.creativeContext;
    if (creativeRaw && typeof creativeRaw === "object") {
        p.project.creativeContext = {
            source: creativeRaw.source === "quick_workspace" || creativeRaw.source === "imported"
                ? creativeRaw.source
                : "manual",
            mediaType: creativeRaw.mediaType === "image" || creativeRaw.mediaType === "video"
                ? creativeRaw.mediaType
                : undefined,
            fileName: typeof creativeRaw.fileName === "string" ? creativeRaw.fileName.trim() : "",
            primaryInput: typeof creativeRaw.primaryInput === "string" ? creativeRaw.primaryInput.trim() : "",
            secondaryInput: typeof creativeRaw.secondaryInput === "string" ? creativeRaw.secondaryInput.trim() : "",
            mergedInput: typeof creativeRaw.mergedInput === "string" ? creativeRaw.mergedInput.trim() : "",
            intentSummary: typeof creativeRaw.intentSummary === "string" ? creativeRaw.intentSummary.trim() : "",
            locationHint: typeof creativeRaw.locationHint === "string" ? creativeRaw.locationHint.trim() : "",
            styleHint: typeof creativeRaw.styleHint === "string" ? creativeRaw.styleHint.trim() : "",
            subjectLabels: Array.isArray(creativeRaw.subjectLabels)
                ? Array.from(new Set(creativeRaw.subjectLabels
                    .map((item) => typeof item === "string" ? item.trim() : "")
                    .filter(Boolean))).slice(0, 12)
                : []
        };
    }
    else {
        p.project.creativeContext = undefined;
    }
    scenes.forEach((s, i) => {
        if (!s.index)
            s.index = i + 1;
        const isFirst = i === 0;
        const rawTransition = String(s.transitionType ?? "");
        const transition = ["cut", "reverse_angle", "camera_continues", "dissolve", "time_jump"].includes(rawTransition)
            ? rawTransition
            : undefined;
        if (p.project.mediaType === "image" || p.project.shotPlan === "single") {
            s.inheritFromPrevious = false;
            s.inheritBgRefFromPrevious = false;
            s.inheritObjectRefsFromPrevious = "off";
            s.transitionType = "cut";
        }
        else if (p.project.shotPlan === "multicam") {
            s.inheritFromPrevious = isFirst ? false : (typeof s.inheritFromPrevious === "boolean" ? !!s.inheritFromPrevious : true);
            s.inheritBgRefFromPrevious = isFirst
                ? false
                : (typeof s.inheritBgRefFromPrevious === "boolean" ? !!s.inheritBgRefFromPrevious : true);
            s.inheritObjectRefsFromPrevious = isFirst
                ? "off"
                : (String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "identity_only"
                    ? "identity_only"
                    : String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
                        ? "off"
                        : "all");
            s.transitionType = transition ?? "reverse_angle";
        }
        else if (p.project.shotPlan === "continuous") {
            s.inheritFromPrevious = isFirst ? false : true;
            s.inheritBgRefFromPrevious = isFirst ? false : true;
            s.inheritObjectRefsFromPrevious = isFirst
                ? "off"
                : (String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "identity_only"
                    ? "identity_only"
                    : String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
                        ? "off"
                        : "all");
            s.transitionType = "camera_continues";
        }
        else {
            s.inheritFromPrevious = isFirst ? false : (typeof s.inheritFromPrevious === "boolean" ? !!s.inheritFromPrevious : false);
            s.inheritBgRefFromPrevious = isFirst
                ? false
                : (typeof s.inheritBgRefFromPrevious === "boolean" ? !!s.inheritBgRefFromPrevious : false);
            s.inheritObjectRefsFromPrevious = isFirst
                ? "off"
                : (String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "all"
                    ? "all"
                    : String(s.inheritObjectRefsFromPrevious ?? "").toLowerCase() === "off"
                        ? "off"
                        : "identity_only");
            s.transitionType = transition ?? "cut";
        }
    });
    p.scenes = scenes;
    return p;
}
export function defaultProject() {
    const p = {
        project: { mode: "storyboard", mediaType: "video", shotPlan: "single" },
        scenes: [
            {
                id: "s1",
                name: "Main Frame",
                duration_s: 6,
                camera: {
                    shot: "wide",
                    movement: "static",
                    keyframes: [
                        { t: 0, x: 0, y: 0, zoom: 1, rot: 0 },
                        { t: 1, x: 0, y: 0, zoom: 1, rot: 0 }
                    ]
                },
                lighting: { time: "sunset", key_dir: "top_right", mood: "cinematic" },
                layers: [
                    {
                        id: "Subject 1",
                        type: "subject",
                        shape: "ring",
                        shapeDesc: "ring station, modular",
                        look: "",
                        z: 30,
                        color: "#b7c3ff",
                        opacity: 0.95,
                        kf: [
                            { t: 0, x: 58, y: 55, w: 26, h: 18, rot: 12 },
                            { t: 1, x: 58, y: 55, w: 26, h: 18, rot: 12 }
                        ],
                        notes: "",
                        externalPrompt: "",
                        referenceLinks: "",
                        localRefs: [],
                        referencePolicy: "optional"
                    }
                ],
                config: {
                    mediaMode: "video",
                    compiler: "v1",
                    sceneTier: "small_plaza",
                    v2Mode: "strict",
                    stability: "standard"
                },
                notes: ""
            }
        ]
    };
    return sanitizeProject(p);
}
