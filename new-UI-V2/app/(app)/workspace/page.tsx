"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Film,
  Camera,
  Sun,
  Palette,
  User,
  Box,
  Wand2,
  Settings,
  Play,
  ChevronDown,
  Plus,
  Image,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  Trash2,
  Move,
  Focus,
  Aperture,
  Clock,
  CloudSun,
  Clapperboard,
  Ratio,
  Gauge,
  Layers,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useI18n, LanguageSwitcher } from "@/lib/i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

// Professional Cinema Options Data
const DIRECTOR_STYLES = {
  en: [
    { value: "nolan", label: "Christopher Nolan", desc: "Epic, non-linear, IMAX" },
    { value: "spielberg", label: "Steven Spielberg", desc: "Classic Hollywood, emotional" },
    { value: "tarantino", label: "Quentin Tarantino", desc: "Dialogue-driven, stylized violence" },
    { value: "kubrick", label: "Stanley Kubrick", desc: "Symmetrical, meticulous, cold" },
    { value: "fincher", label: "David Fincher", desc: "Dark, precise, digital perfection" },
    { value: "villeneuve", label: "Denis Villeneuve", desc: "Atmospheric, grand scale" },
    { value: "wongkarwai", label: "Wong Kar-wai", desc: "Romantic, neon, step-printing" },
    { value: "wes", label: "Wes Anderson", desc: "Symmetrical, pastel, whimsical" },
    { value: "ridley", label: "Ridley Scott", desc: "Epic, atmospheric, detailed" },
    { value: "scorsese", label: "Martin Scorsese", desc: "Tracking shots, freeze frames" },
    { value: "deakins", label: "Roger Deakins Style", desc: "Natural light, painterly" },
    { value: "lubezki", label: "Lubezki Style", desc: "Long takes, natural light" },
    { value: "commercial", label: "Commercial/Ad Style", desc: "Clean, product-focused" },
    { value: "documentary", label: "Documentary Style", desc: "Authentic, observational" },
    { value: "music_video", label: "Music Video Style", desc: "Dynamic, stylized" },
  ],
  zh: [
    { value: "nolan", label: "克里斯托弗·诺兰", desc: "史诗、非线性、IMAX" },
    { value: "spielberg", label: "史蒂文·斯皮尔伯格", desc: "经典好莱坞、情感化" },
    { value: "tarantino", label: "昆汀·塔伦蒂诺", desc: "对话驱动、风格化暴力" },
    { value: "kubrick", label: "斯坦利·库布里克", desc: "对称、精密、冷峻" },
    { value: "fincher", label: "大卫·芬奇", desc: "黑暗、精确、数字完美" },
    { value: "villeneuve", label: "丹尼斯·维伦纽瓦", desc: "氛围感、宏大场面" },
    { value: "wongkarwai", label: "王家卫", desc: "浪漫、霓虹、抽帧" },
    { value: "wes", label: "韦斯·安德森", desc: "对称、柔和色调、奇幻" },
    { value: "ridley", label: "雷德利·斯科特", desc: "史诗、氛围、细节" },
    { value: "scorsese", label: "马丁·斯科塞斯", desc: "跟踪镜头、定格" },
    { value: "deakins", label: "罗杰·迪金斯风格", desc: "自然光、绘画感" },
    { value: "lubezki", label: "卢贝兹基风格", desc: "长镜头、自然光" },
    { value: "commercial", label: "商业广告风格", desc: "干净、产品聚焦" },
    { value: "documentary", label: "纪录片风格", desc: "真实、观察性" },
    { value: "music_video", label: "音乐视频风格", desc: "动感、风格化" },
  ],
}

const FILM_GENRES = {
  en: [
    "Action", "Drama", "Sci-Fi", "Horror", "Thriller", "Comedy", "Romance",
    "Fantasy", "Documentary", "Commercial", "Music Video", "Animation",
    "Film Noir", "Western", "War", "Mystery", "Adventure", "Crime",
  ],
  zh: [
    "动作片", "剧情片", "科幻片", "恐怖片", "惊悚片", "喜剧片", "爱情片",
    "奇幻片", "纪录片", "广告片", "音乐视频", "动画片",
    "黑色电影", "西部片", "战争片", "悬疑片", "冒险片", "犯罪片",
  ],
}

const ERA_PERIODS = {
  en: [
    "Contemporary (2020s)", "2010s", "2000s", "1990s", "1980s", "1970s",
    "1960s", "1950s", "1940s Film Noir", "1930s Art Deco", "1920s Silent Era",
    "Victorian Era", "Renaissance", "Medieval", "Ancient", "Futuristic",
    "Post-Apocalyptic", "Cyberpunk Future", "Steampunk",
  ],
  zh: [
    "当代 (2020年代)", "2010年代", "2000年代", "1990年代", "1980年代", "1970年代",
    "1960年代", "1950年代", "1940年代黑色电影", "1930年代装饰艺术", "1920年代默片时代",
    "维多利亚时代", "文艺复兴", "中世纪", "古代", "未来主义",
    "末日后", "赛博朋克未来", "蒸汽朋克",
  ],
}

const SHOT_TYPES = {
  en: [
    { value: "extreme_close_up", label: "Extreme Close-up (ECU)", desc: "Eyes, lips, detail" },
    { value: "close_up", label: "Close-up (CU)", desc: "Face, hands" },
    { value: "medium_close_up", label: "Medium Close-up (MCU)", desc: "Head and shoulders" },
    { value: "medium", label: "Medium Shot (MS)", desc: "Waist up" },
    { value: "medium_full", label: "Medium Full Shot", desc: "Knees up" },
    { value: "full", label: "Full Shot (FS)", desc: "Entire body" },
    { value: "wide", label: "Wide Shot (WS)", desc: "Subject in environment" },
    { value: "extreme_wide", label: "Extreme Wide (EWS)", desc: "Vast landscape" },
    { value: "establishing", label: "Establishing Shot", desc: "Location context" },
    { value: "insert", label: "Insert Shot", desc: "Object detail" },
    { value: "over_shoulder", label: "Over-the-Shoulder (OTS)", desc: "Conversation angle" },
    { value: "two_shot", label: "Two Shot", desc: "Two subjects" },
    { value: "group", label: "Group Shot", desc: "Multiple subjects" },
    { value: "pov", label: "POV Shot", desc: "Character perspective" },
  ],
  zh: [
    { value: "extreme_close_up", label: "大特写 (ECU)", desc: "眼睛、嘴唇、细节" },
    { value: "close_up", label: "特写 (CU)", desc: "面部、手部" },
    { value: "medium_close_up", label: "中特写 (MCU)", desc: "头肩部" },
    { value: "medium", label: "中景 (MS)", desc: "腰部以上" },
    { value: "medium_full", label: "中全景", desc: "膝部以上" },
    { value: "full", label: "全景 (FS)", desc: "全身" },
    { value: "wide", label: "远景 (WS)", desc: "主体在环境中" },
    { value: "extreme_wide", label: "大远景 (EWS)", desc: "广阔景观" },
    { value: "establishing", label: "建置镜头", desc: "场景交代" },
    { value: "insert", label: "插入镜头", desc: "物体细节" },
    { value: "over_shoulder", label: "过肩镜头 (OTS)", desc: "对话角度" },
    { value: "two_shot", label: "双人镜头", desc: "两个主体" },
    { value: "group", label: "群像镜头", desc: "多个主体" },
    { value: "pov", label: "主观镜头", desc: "角色视角" },
  ],
}

const CAMERA_ANGLES = {
  en: [
    { value: "eye_level", label: "Eye Level", desc: "Neutral, natural" },
    { value: "low_angle", label: "Low Angle", desc: "Power, dominance" },
    { value: "high_angle", label: "High Angle", desc: "Vulnerability, overview" },
    { value: "birds_eye", label: "Bird's Eye View", desc: "Directly above" },
    { value: "worms_eye", label: "Worm's Eye View", desc: "Directly below" },
    { value: "dutch_angle", label: "Dutch Angle/Tilt", desc: "Tension, unease" },
    { value: "overhead", label: "Overhead Shot", desc: "Top-down view" },
    { value: "canted", label: "Canted Frame", desc: "Slight tilt" },
  ],
  zh: [
    { value: "eye_level", label: "平视", desc: "中性、自然" },
    { value: "low_angle", label: "仰视", desc: "力量、支配" },
    { value: "high_angle", label: "俯视", desc: "脆弱、概览" },
    { value: "birds_eye", label: "鸟瞰", desc: "正上方" },
    { value: "worms_eye", label: "虫视", desc: "正下方" },
    { value: "dutch_angle", label: "荷兰角/倾斜", desc: "紧张、不安" },
    { value: "overhead", label: "俯拍", desc: "顶视图" },
    { value: "canted", label: "倾斜画面", desc: "轻微倾斜" },
  ],
}

const CAMERA_MOVEMENTS = {
  en: [
    { value: "static", label: "Static/Locked", desc: "No movement" },
    { value: "pan", label: "Pan", desc: "Horizontal rotation" },
    { value: "tilt", label: "Tilt", desc: "Vertical rotation" },
    { value: "dolly", label: "Dolly In/Out", desc: "Forward/backward" },
    { value: "truck", label: "Truck/Crab", desc: "Lateral movement" },
    { value: "pedestal", label: "Pedestal", desc: "Up/down movement" },
    { value: "zoom", label: "Zoom In/Out", desc: "Lens zoom" },
    { value: "dolly_zoom", label: "Dolly Zoom/Vertigo", desc: "Disorienting effect" },
    { value: "tracking", label: "Tracking Shot", desc: "Following subject" },
    { value: "steadicam", label: "Steadicam", desc: "Smooth handheld" },
    { value: "handheld", label: "Handheld", desc: "Documentary feel" },
    { value: "crane", label: "Crane/Jib", desc: "Sweeping vertical" },
    { value: "aerial", label: "Aerial/Drone", desc: "Flying movement" },
    { value: "arc", label: "Arc Shot", desc: "Circular around subject" },
    { value: "whip_pan", label: "Whip Pan", desc: "Fast horizontal" },
    { value: "roll", label: "Roll", desc: "Rotating on axis" },
  ],
  zh: [
    { value: "static", label: "静止/锁定", desc: "无运动" },
    { value: "pan", label: "横摇", desc: "水平旋转" },
    { value: "tilt", label: "俯仰", desc: "垂直旋转" },
    { value: "dolly", label: "推/拉", desc: "前后移动" },
    { value: "truck", label: "横移", desc: "左右移动" },
    { value: "pedestal", label: "升降", desc: "上下移动" },
    { value: "zoom", label: "变焦", desc: "镜头变焦" },
    { value: "dolly_zoom", label: "滑动变焦/眩晕", desc: "迷失方向效果" },
    { value: "tracking", label: "跟踪镜头", desc: "跟随主体" },
    { value: "steadicam", label: "斯坦尼康", desc: "平稳手持" },
    { value: "handheld", label: "手持", desc: "纪录片感" },
    { value: "crane", label: "摇臂", desc: "垂直大幅度移动" },
    { value: "aerial", label: "航拍/无人机", desc: "飞行运动" },
    { value: "arc", label: "弧线镜头", desc: "围绕主体旋转" },
    { value: "whip_pan", label: "甩镜", desc: "快速水平" },
    { value: "roll", label: "滚动", desc: "轴向旋转" },
  ],
}

const FOCAL_LENGTHS = {
  en: [
    { value: "8mm", label: "8mm Fisheye", desc: "Extreme distortion" },
    { value: "14mm", label: "14mm Ultra Wide", desc: "Dramatic perspective" },
    { value: "24mm", label: "24mm Wide", desc: "Environmental" },
    { value: "35mm", label: "35mm Standard Wide", desc: "Natural, journalistic" },
    { value: "50mm", label: "50mm Standard", desc: "Human eye equivalent" },
    { value: "85mm", label: "85mm Portrait", desc: "Flattering compression" },
    { value: "100mm", label: "100mm Macro", desc: "Detail, intimacy" },
    { value: "135mm", label: "135mm Telephoto", desc: "Compressed background" },
    { value: "200mm", label: "200mm Long Telephoto", desc: "Isolated subject" },
    { value: "300mm", label: "300mm+ Super Telephoto", desc: "Sports, wildlife" },
    { value: "anamorphic", label: "Anamorphic", desc: "Cinematic wide, flares" },
  ],
  zh: [
    { value: "8mm", label: "8mm 鱼眼", desc: "极端畸变" },
    { value: "14mm", label: "14mm 超广角", desc: "戏剧性透视" },
    { value: "24mm", label: "24mm 广角", desc: "环境感" },
    { value: "35mm", label: "35mm 标准广角", desc: "自然、新闻感" },
    { value: "50mm", label: "50mm 标准", desc: "人眼等效" },
    { value: "85mm", label: "85mm 人像", desc: "讨喜的压缩" },
    { value: "100mm", label: "100mm 微距", desc: "细节、亲密" },
    { value: "135mm", label: "135mm 中长焦", desc: "背景压缩" },
    { value: "200mm", label: "200mm 长焦", desc: "主体隔离" },
    { value: "300mm", label: "300mm+ 超长焦", desc: "体育、野生动物" },
    { value: "anamorphic", label: "变形宽银幕", desc: "电影宽幅、光晕" },
  ],
}

const DEPTH_OF_FIELD = {
  en: [
    { value: "f1.2", label: "f/1.2 - f/1.8", desc: "Ultra shallow, dreamy" },
    { value: "f2.8", label: "f/2.8 - f/4", desc: "Shallow, subject separation" },
    { value: "f5.6", label: "f/5.6 - f/8", desc: "Moderate, balanced" },
    { value: "f11", label: "f/11 - f/16", desc: "Deep, landscape" },
    { value: "f22", label: "f/22+", desc: "Maximum depth" },
    { value: "deep_focus", label: "Deep Focus", desc: "Everything sharp (Citizen Kane)" },
    { value: "rack_focus", label: "Rack Focus", desc: "Shifting focus" },
    { value: "split_diopter", label: "Split Diopter", desc: "Two planes in focus" },
  ],
  zh: [
    { value: "f1.2", label: "f/1.2 - f/1.8", desc: "超浅景深、梦幻" },
    { value: "f2.8", label: "f/2.8 - f/4", desc: "浅景深、主体分离" },
    { value: "f5.6", label: "f/5.6 - f/8", desc: "中等、平衡" },
    { value: "f11", label: "f/11 - f/16", desc: "深景深、风景" },
    { value: "f22", label: "f/22+", desc: "最大景深" },
    { value: "deep_focus", label: "深焦", desc: "全部清晰（公民凯恩）" },
    { value: "rack_focus", label: "焦点转换", desc: "移动焦点" },
    { value: "split_diopter", label: "分屈光镜", desc: "双平面对焦" },
  ],
}

const LIGHTING_STYLES = {
  en: [
    { value: "natural", label: "Natural Light", desc: "Sun, ambient" },
    { value: "golden_hour", label: "Golden Hour", desc: "Warm sunrise/sunset" },
    { value: "blue_hour", label: "Blue Hour", desc: "Cool twilight" },
    { value: "high_key", label: "High Key", desc: "Bright, minimal shadows" },
    { value: "low_key", label: "Low Key", desc: "Dark, dramatic shadows" },
    { value: "rembrandt", label: "Rembrandt", desc: "Triangle under eye" },
    { value: "split", label: "Split Lighting", desc: "Half face lit" },
    { value: "butterfly", label: "Butterfly/Paramount", desc: "From above, glamour" },
    { value: "rim", label: "Rim/Edge Light", desc: "Outline separation" },
    { value: "silhouette", label: "Silhouette", desc: "Backlit, no front" },
    { value: "chiaroscuro", label: "Chiaroscuro", desc: "Strong contrast, renaissance" },
    { value: "neon", label: "Neon/Practical", desc: "Colored, urban night" },
    { value: "soft_diffused", label: "Soft Diffused", desc: "Overcast, beauty" },
    { value: "hard_direct", label: "Hard Direct", desc: "Sharp shadows" },
    { value: "motivated", label: "Motivated Light", desc: "From visible source" },
    { value: "three_point", label: "Three-Point Setup", desc: "Classic studio" },
  ],
  zh: [
    { value: "natural", label: "自然光", desc: "太阳、环境光" },
    { value: "golden_hour", label: "黄金时刻", desc: "温暖的日出/日落" },
    { value: "blue_hour", label: "蓝色时刻", desc: "冷色黄昏" },
    { value: "high_key", label: "高调", desc: "明亮、阴影少" },
    { value: "low_key", label: "低调", desc: "暗调、戏剧阴影" },
    { value: "rembrandt", label: "伦勃朗光", desc: "眼下三角形" },
    { value: "split", label: "分割光", desc: "半面照亮" },
    { value: "butterfly", label: "蝴蝶光/派拉蒙", desc: "顶部、魅力" },
    { value: "rim", label: "轮廓光", desc: "边缘分离" },
    { value: "silhouette", label: "剪影", desc: "逆光、无正面" },
    { value: "chiaroscuro", label: "明暗对照", desc: "强对比、文艺复兴" },
    { value: "neon", label: "霓虹/实景", desc: "彩色、都市夜晚" },
    { value: "soft_diffused", label: "柔和漫射", desc: "阴天、美妆" },
    { value: "hard_direct", label: "硬直射", desc: "锐利阴影" },
    { value: "motivated", label: "动机光", desc: "来自可见光源" },
    { value: "three_point", label: "三点布光", desc: "经典影棚" },
  ],
}

const COLOR_TEMPERATURES = {
  en: [
    { value: "2700k", label: "2700K Warm", desc: "Tungsten, intimate" },
    { value: "3200k", label: "3200K Tungsten", desc: "Studio warm" },
    { value: "4000k", label: "4000K Neutral Warm", desc: "Morning light" },
    { value: "5000k", label: "5000K Noon", desc: "Balanced daylight" },
    { value: "5600k", label: "5600K Daylight", desc: "Standard daylight" },
    { value: "6500k", label: "6500K Overcast", desc: "Cool daylight" },
    { value: "7500k", label: "7500K Shade", desc: "Cool blue" },
    { value: "9000k", label: "9000K+ Blue Sky", desc: "Very cool" },
    { value: "mixed", label: "Mixed/Practical", desc: "Multiple sources" },
  ],
  zh: [
    { value: "2700k", label: "2700K 暖色", desc: "钨丝灯、亲密" },
    { value: "3200k", label: "3200K 钨丝灯", desc: "影棚暖色" },
    { value: "4000k", label: "4000K 中性暖", desc: "晨光" },
    { value: "5000k", label: "5000K 正午", desc: "平衡日光" },
    { value: "5600k", label: "5600K 日光", desc: "标准日光" },
    { value: "6500k", label: "6500K 阴天", desc: "冷日光" },
    { value: "7500k", label: "7500K 阴影", desc: "冷蓝" },
    { value: "9000k", label: "9000K+ 蓝天", desc: "非常冷" },
    { value: "mixed", label: "混合/实景", desc: "多光源" },
  ],
}

const COLOR_GRADES = {
  en: [
    { value: "neutral", label: "Neutral/Natural", desc: "Accurate colors" },
    { value: "cinematic", label: "Cinematic Teal & Orange", desc: "Hollywood blockbuster" },
    { value: "film_emulation", label: "Film Emulation", desc: "Kodak/Fuji look" },
    { value: "bleach_bypass", label: "Bleach Bypass", desc: "Desaturated, gritty" },
    { value: "cross_process", label: "Cross Process", desc: "Unusual color shifts" },
    { value: "vintage", label: "Vintage/Retro", desc: "Faded, nostalgic" },
    { value: "noir", label: "Film Noir B&W", desc: "High contrast black and white" },
    { value: "sepia", label: "Sepia Tone", desc: "Warm monochrome" },
    { value: "desaturated", label: "Desaturated", desc: "Muted colors" },
    { value: "vibrant", label: "Vibrant/Saturated", desc: "Bold colors" },
    { value: "pastel", label: "Pastel", desc: "Soft, washed" },
    { value: "cyberpunk", label: "Cyberpunk", desc: "Neon, high contrast" },
    { value: "matrix", label: "Matrix Green", desc: "Green tint" },
    { value: "moonlight", label: "Moonlight Blue", desc: "Cool night" },
    { value: "warm_shadows", label: "Warm Shadows", desc: "Orange in shadows" },
    { value: "cool_highlights", label: "Cool Highlights", desc: "Blue in highlights" },
  ],
  zh: [
    { value: "neutral", label: "中性/自然", desc: "准确颜色" },
    { value: "cinematic", label: "电影青橙", desc: "好莱坞大片" },
    { value: "film_emulation", label: "胶片模拟", desc: "柯达/富士风格" },
    { value: "bleach_bypass", label: "漂白绕过", desc: "低饱和、粗粝" },
    { value: "cross_process", label: "交叉冲洗", desc: "异常色偏" },
    { value: "vintage", label: "复古/怀旧", desc: "褪色、怀旧" },
    { value: "noir", label: "黑色电影黑白", desc: "高对比黑白" },
    { value: "sepia", label: "棕褐色调", desc: "暖单色" },
    { value: "desaturated", label: "低饱和", desc: "柔和颜色" },
    { value: "vibrant", label: "鲜艳/高饱和", desc: "大胆颜色" },
    { value: "pastel", label: "柔和色调", desc: "柔软、褪色" },
    { value: "cyberpunk", label: "赛博朋克", desc: "霓虹、高对比" },
    { value: "matrix", label: "黑客帝国绿", desc: "绿色调" },
    { value: "moonlight", label: "月光蓝", desc: "冷夜晚" },
    { value: "warm_shadows", label: "暖阴影", desc: "阴影偏橙" },
    { value: "cool_highlights", label: "冷高光", desc: "高光偏蓝" },
  ],
}

const SCENE_TYPES = {
  en: [
    "Interior - Studio", "Interior - House/Apartment", "Interior - Office",
    "Interior - Restaurant/Bar", "Interior - Industrial/Warehouse",
    "Interior - Hospital", "Interior - School", "Interior - Church",
    "Interior - Museum/Gallery", "Interior - Shopping Mall",
    "Exterior - Urban Street", "Exterior - Rooftop", "Exterior - Park/Garden",
    "Exterior - Beach/Ocean", "Exterior - Forest/Woods", "Exterior - Desert",
    "Exterior - Mountain", "Exterior - Field/Meadow", "Exterior - Snow/Ice",
    "Exterior - City Skyline", "Exterior - Suburb", "Exterior - Highway/Road",
    "Set - Green Screen", "Set - White Cyclorama", "Set - Black Void",
    "Virtual - Abstract Space", "Virtual - Sci-Fi Environment",
  ],
  zh: [
    "室内 - 摄影棚", "室内 - 住宅/公寓", "室内 - 办公室",
    "室内 - 餐厅/酒吧", "室内 - 工业/仓库",
    "室内 - 医院", "室内 - 学校", "室内 - 教堂",
    "室内 - 博物馆/画廊", "室内 - 购物中心",
    "室外 - 城市街道", "室外 - 屋顶", "室外 - 公园/花园",
    "室外 - 海滩/海洋", "室外 - 森林/树林", "室外 - 沙漠",
    "室外 - 山脉", "室外 - 田野/草地", "室外 - 雪地/冰原",
    "室外 - 城市天际线", "室外 - 郊区", "室外 - 公路/道路",
    "布景 - 绿幕", "布景 - 白色无缝背景", "布景 - 黑色虚空",
    "虚拟 - 抽象空间", "虚拟 - 科幻环境",
  ],
}

const WEATHER_CONDITIONS = {
  en: [
    "Clear/Sunny", "Partly Cloudy", "Overcast", "Fog/Mist", "Light Rain",
    "Heavy Rain", "Storm/Thunder", "Snow", "Blizzard", "Dust/Sandstorm",
    "Wind", "Haze/Smog", "Rainbow", "Aurora", "Clear Night", "Cloudy Night",
  ],
  zh: [
    "晴朗/阳光", "多云", "阴天", "雾/薄雾", "小雨",
    "大雨", "暴风雨/雷电", "雪", "暴风雪", "沙尘暴",
    "大风", "霾/烟雾", "彩虹", "极光", "晴朗夜晚", "多云夜晚",
  ],
}

const TIME_OF_DAY = {
  en: [
    "Dawn (5-6am)", "Sunrise/Golden Hour (6-7am)", "Morning (7-10am)",
    "Late Morning (10am-12pm)", "Noon (12pm)", "Afternoon (1-4pm)",
    "Late Afternoon (4-6pm)", "Golden Hour/Sunset (6-7pm)", "Dusk (7-8pm)",
    "Blue Hour (8-9pm)", "Evening (9-11pm)", "Night (11pm-4am)",
    "Midnight", "Pre-Dawn (4-5am)",
  ],
  zh: [
    "黎明 (5-6点)", "日出/黄金时刻 (6-7点)", "上午 (7-10点)",
    "上午晚些 (10-12点)", "正午 (12点)", "下午 (1-4点)",
    "下午晚些 (4-6点)", "黄金时刻/日落 (6-7点)", "黄昏 (7-8点)",
    "蓝色时刻 (8-9点)", "晚间 (9-11点)", "深夜 (11点-4点)",
    "午夜", "凌晨 (4-5点)",
  ],
}

const SUBJECT_TYPES = {
  en: [
    "Person - Solo", "Person - Couple", "Person - Group", "Person - Crowd",
    "Product - Electronics", "Product - Fashion", "Product - Food/Beverage",
    "Product - Cosmetics", "Product - Automotive", "Product - Furniture",
    "Product - Jewelry", "Product - Packaging",
    "Object - Sculpture", "Object - Architecture", "Object - Nature",
    "Animal - Pet", "Animal - Wildlife",
    "Vehicle - Car", "Vehicle - Motorcycle", "Vehicle - Aircraft",
    "Abstract - Shapes", "Abstract - Particles", "Abstract - Liquid",
  ],
  zh: [
    "人物 - 单人", "人物 - 双人", "人物 - 群组", "人物 - 人群",
    "产品 - 电子产品", "产品 - 时尚", "产品 - 食品/饮料",
    "产品 - 化妆品", "产品 - 汽车", "产品 - 家具",
    "产品 - 珠宝", "产品 - 包装",
    "物体 - 雕塑", "物体 - 建筑", "物体 - 自然",
    "动物 - 宠物", "动物 - 野生动物",
    "载具 - 汽车", "载具 - 摩托车", "载具 - 飞行器",
    "抽象 - 形状", "抽象 - 粒子", "抽象 - 液体",
  ],
}

const ASPECT_RATIOS = {
  en: [
    { value: "1:1", label: "1:1 Square", desc: "Instagram, social" },
    { value: "4:3", label: "4:3 Standard", desc: "Classic TV" },
    { value: "16:9", label: "16:9 HD", desc: "Modern TV, YouTube" },
    { value: "1.85:1", label: "1.85:1 Flat", desc: "Academy widescreen" },
    { value: "2.35:1", label: "2.35:1 Scope", desc: "Anamorphic cinema" },
    { value: "2.39:1", label: "2.39:1 Panavision", desc: "Modern cinema" },
    { value: "2.76:1", label: "2.76:1 Ultra Panavision", desc: "Epic, Hateful Eight" },
    { value: "9:16", label: "9:16 Vertical", desc: "TikTok, Stories" },
    { value: "4:5", label: "4:5 Portrait", desc: "Instagram portrait" },
    { value: "21:9", label: "21:9 Ultrawide", desc: "Cinematic ultrawide" },
    { value: "imax", label: "1.43:1 IMAX", desc: "IMAX ratio" },
  ],
  zh: [
    { value: "1:1", label: "1:1 正方形", desc: "Instagram、社交" },
    { value: "4:3", label: "4:3 标准", desc: "经典电视" },
    { value: "16:9", label: "16:9 高清", desc: "现代电视、YouTube" },
    { value: "1.85:1", label: "1.85:1 平面", desc: "学院宽银幕" },
    { value: "2.35:1", label: "2.35:1 变形宽银幕", desc: "变形宽银幕电影" },
    { value: "2.39:1", label: "2.39:1 派拉蒙", desc: "现代电影" },
    { value: "2.76:1", label: "2.76:1 超级派拉蒙", desc: "史诗、八恶人" },
    { value: "9:16", label: "9:16 竖屏", desc: "抖音、故事" },
    { value: "4:5", label: "4:5 人像", desc: "Instagram人像" },
    { value: "21:9", label: "21:9 超宽", desc: "电影超宽" },
    { value: "imax", label: "1.43:1 IMAX", desc: "IMAX比例" },
  ],
}

const RESOLUTIONS = {
  en: [
    { value: "720p", label: "720p HD", desc: "1280x720" },
    { value: "1080p", label: "1080p Full HD", desc: "1920x1080" },
    { value: "2k", label: "2K", desc: "2048x1080" },
    { value: "4k", label: "4K UHD", desc: "3840x2160" },
    { value: "4k_dci", label: "4K DCI", desc: "4096x2160" },
    { value: "6k", label: "6K", desc: "6144x3456" },
    { value: "8k", label: "8K UHD", desc: "7680x4320" },
  ],
  zh: [
    { value: "720p", label: "720p 高清", desc: "1280x720" },
    { value: "1080p", label: "1080p 全高清", desc: "1920x1080" },
    { value: "2k", label: "2K", desc: "2048x1080" },
    { value: "4k", label: "4K 超高清", desc: "3840x2160" },
    { value: "4k_dci", label: "4K DCI", desc: "4096x2160" },
    { value: "6k", label: "6K", desc: "6144x3456" },
    { value: "8k", label: "8K 超高清", desc: "7680x4320" },
  ],
}

const FRAME_RATES = {
  en: [
    { value: "23.976", label: "23.976 fps", desc: "Film standard" },
    { value: "24", label: "24 fps", desc: "Cinema" },
    { value: "25", label: "25 fps", desc: "PAL/European" },
    { value: "29.97", label: "29.97 fps", desc: "NTSC" },
    { value: "30", label: "30 fps", desc: "Standard video" },
    { value: "48", label: "48 fps", desc: "HFR (Hobbit)" },
    { value: "50", label: "50 fps", desc: "PAL slow-mo" },
    { value: "60", label: "60 fps", desc: "Smooth video" },
    { value: "120", label: "120 fps", desc: "Slow motion" },
    { value: "240", label: "240 fps", desc: "Super slow-mo" },
  ],
  zh: [
    { value: "23.976", label: "23.976 fps", desc: "电影标准" },
    { value: "24", label: "24 fps", desc: "电影" },
    { value: "25", label: "25 fps", desc: "PAL/欧洲" },
    { value: "29.97", label: "29.97 fps", desc: "NTSC" },
    { value: "30", label: "30 fps", desc: "标准视频" },
    { value: "48", label: "48 fps", desc: "HFR（霍比特人）" },
    { value: "50", label: "50 fps", desc: "PAL慢动作" },
    { value: "60", label: "60 fps", desc: "流畅视频" },
    { value: "120", label: "120 fps", desc: "慢动作" },
    { value: "240", label: "240 fps", desc: "超级慢动作" },
  ],
}

const FILM_GRAIN = {
  en: [
    { value: "none", label: "None", desc: "Clean digital" },
    { value: "subtle", label: "Subtle", desc: "Barely visible" },
    { value: "light", label: "Light 35mm", desc: "Modern film look" },
    { value: "medium", label: "Medium 35mm", desc: "Classic film" },
    { value: "heavy", label: "Heavy 16mm", desc: "Gritty, indie" },
    { value: "super8", label: "Super 8", desc: "Vintage home movie" },
    { value: "vhs", label: "VHS Noise", desc: "Retro video" },
  ],
  zh: [
    { value: "none", label: "无", desc: "干净数字" },
    { value: "subtle", label: "微弱", desc: "几乎不可见" },
    { value: "light", label: "轻微 35mm", desc: "现代胶片感" },
    { value: "medium", label: "中等 35mm", desc: "经典胶片" },
    { value: "heavy", label: "重度 16mm", desc: "粗粝、独立" },
    { value: "super8", label: "Super 8", desc: "复古家庭电影" },
    { value: "vhs", label: "VHS噪点", desc: "复古录像" },
  ],
}

// Additional Object type
interface AdditionalObject {
  id: string
  type: string
  description: string
}

export default function WorkspacePage() {
  const { locale, t } = useI18n()
  const [copied, setCopied] = useState(false)

  // State for all selections
  const [directorStyle, setDirectorStyle] = useState("")
  const [filmGenre, setFilmGenre] = useState("")
  const [eraPeriod, setEraPeriod] = useState("")
  const [shotType, setShotType] = useState("")
  const [cameraAngle, setCameraAngle] = useState("")
  const [cameraMovement, setCameraMovement] = useState("")
  const [focalLength, setFocalLength] = useState("")
  const [depthOfField, setDepthOfField] = useState("")
  const [lightingStyle, setLightingStyle] = useState("")
  const [colorTemperature, setColorTemperature] = useState("")
  const [colorGrade, setColorGrade] = useState("")
  const [sceneType, setSceneType] = useState("")
  const [weather, setWeather] = useState("")
  const [timeOfDay, setTimeOfDay] = useState("")
  const [subjectType, setSubjectType] = useState("")
  const [subjectDescription, setSubjectDescription] = useState("")
  const [aspectRatio, setAspectRatio] = useState("")
  const [resolution, setResolution] = useState("")
  const [frameRate, setFrameRate] = useState("")
  const [filmGrain, setFilmGrain] = useState("")

  // Additional objects
  const [additionalObjects, setAdditionalObjects] = useState<AdditionalObject[]>([])

  const addObject = () => {
    setAdditionalObjects([
      ...additionalObjects,
      { id: Date.now().toString(), type: "", description: "" },
    ])
  }

  const removeObject = (id: string) => {
    setAdditionalObjects(additionalObjects.filter((obj) => obj.id !== id))
  }

  const updateObject = (id: string, field: "type" | "description", value: string) => {
    setAdditionalObjects(
      additionalObjects.map((obj) =>
        obj.id === id ? { ...obj, [field]: value } : obj
      )
    )
  }

  // Generate prompt based on selections
  const generatedPrompt = useMemo(() => {
    const parts: string[] = []

    // Director style
    const director = DIRECTOR_STYLES[locale].find((d) => d.value === directorStyle)
    if (director) {
      parts.push(`${locale === "zh" ? "导演风格" : "Director style"}: ${director.label}`)
    }

    // Genre & Era
    if (filmGenre) parts.push(`${locale === "zh" ? "类型" : "Genre"}: ${filmGenre}`)
    if (eraPeriod) parts.push(`${locale === "zh" ? "时代" : "Era"}: ${eraPeriod}`)

    // Shot
    const shot = SHOT_TYPES[locale].find((s) => s.value === shotType)
    if (shot) parts.push(`${locale === "zh" ? "镜头" : "Shot"}: ${shot.label}`)

    // Camera
    const angle = CAMERA_ANGLES[locale].find((a) => a.value === cameraAngle)
    if (angle) parts.push(`${locale === "zh" ? "角度" : "Angle"}: ${angle.label}`)

    const movement = CAMERA_MOVEMENTS[locale].find((m) => m.value === cameraMovement)
    if (movement) parts.push(`${locale === "zh" ? "运镜" : "Movement"}: ${movement.label}`)

    const lens = FOCAL_LENGTHS[locale].find((f) => f.value === focalLength)
    if (lens) parts.push(`${locale === "zh" ? "镜头" : "Lens"}: ${lens.label}`)

    const dof = DEPTH_OF_FIELD[locale].find((d) => d.value === depthOfField)
    if (dof) parts.push(`${locale === "zh" ? "景深" : "DOF"}: ${dof.label}`)

    // Lighting
    const light = LIGHTING_STYLES[locale].find((l) => l.value === lightingStyle)
    if (light) parts.push(`${locale === "zh" ? "灯光" : "Lighting"}: ${light.label}`)

    const temp = COLOR_TEMPERATURES[locale].find((t) => t.value === colorTemperature)
    if (temp) parts.push(`${locale === "zh" ? "色温" : "Color temp"}: ${temp.label}`)

    // Color
    const grade = COLOR_GRADES[locale].find((g) => g.value === colorGrade)
    if (grade) parts.push(`${locale === "zh" ? "调色" : "Grade"}: ${grade.label}`)

    // Scene
    if (sceneType) parts.push(`${locale === "zh" ? "场景" : "Scene"}: ${sceneType}`)
    if (weather) parts.push(`${locale === "zh" ? "天气" : "Weather"}: ${weather}`)
    if (timeOfDay) parts.push(`${locale === "zh" ? "时间" : "Time"}: ${timeOfDay}`)

    // Subject
    if (subjectType) parts.push(`${locale === "zh" ? "主体类型" : "Subject"}: ${subjectType}`)
    if (subjectDescription) parts.push(`${locale === "zh" ? "主体描述" : "Subject desc"}: ${subjectDescription}`)

    // Additional objects
    additionalObjects.forEach((obj, index) => {
      if (obj.type || obj.description) {
        const label = locale === "zh" ? `对象${index + 2}` : `Object ${index + 2}`
        parts.push(`${label}: ${obj.type}${obj.description ? ` - ${obj.description}` : ""}`)
      }
    })

    // Technical
    const ratio = ASPECT_RATIOS[locale].find((a) => a.value === aspectRatio)
    if (ratio) parts.push(`${locale === "zh" ? "比例" : "Ratio"}: ${ratio.label}`)

    const res = RESOLUTIONS[locale].find((r) => r.value === resolution)
    if (res) parts.push(`${locale === "zh" ? "分辨率" : "Resolution"}: ${res.label}`)

    const fps = FRAME_RATES[locale].find((f) => f.value === frameRate)
    if (fps) parts.push(`${locale === "zh" ? "帧率" : "FPS"}: ${fps.label}`)

    const grain = FILM_GRAIN[locale].find((g) => g.value === filmGrain)
    if (grain && grain.value !== "none") parts.push(`${locale === "zh" ? "颗粒" : "Grain"}: ${grain.label}`)

    return parts.join(". ") + (parts.length > 0 ? "." : "")
  }, [
    locale, directorStyle, filmGenre, eraPeriod, shotType, cameraAngle,
    cameraMovement, focalLength, depthOfField, lightingStyle, colorTemperature,
    colorGrade, sceneType, weather, timeOfDay, subjectType, subjectDescription,
    additionalObjects, aspectRatio, resolution, frameRate, filmGrain,
  ])

  const copyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const labels = {
    en: {
      direction: "Direction",
      directorStyle: "Director Style",
      filmGenre: "Film Genre",
      eraPeriod: "Era/Period",
      camera: "Camera",
      shotType: "Shot Type",
      cameraAngle: "Camera Angle",
      cameraMovement: "Camera Movement",
      focalLength: "Focal Length",
      depthOfField: "Depth of Field",
      lighting: "Lighting",
      lightingStyle: "Lighting Style",
      colorTemperature: "Color Temperature",
      colorGrading: "Color Grading",
      colorGrade: "Color Grade",
      scene: "Scene",
      sceneType: "Scene Type",
      weather: "Weather",
      timeOfDay: "Time of Day",
      subject: "Subject",
      subjectType: "Subject Type",
      subjectDescription: "Subject Description",
      describeSubject: "Describe the main subject...",
      additionalObjects: "Additional Objects",
      addObject: "Add Object",
      objectType: "Object Type",
      objectDescription: "Description",
      technical: "Technical",
      aspectRatio: "Aspect Ratio",
      resolution: "Resolution",
      frameRate: "Frame Rate",
      filmGrain: "Film Grain",
      promptPreview: "Prompt Preview",
      copy: "Copy",
      copied: "Copied",
      generate: "Generate",
      selectPlaceholder: "Select...",
      backToDashboard: "Back",
    },
    zh: {
      direction: "导演",
      directorStyle: "导演风格",
      filmGenre: "电影类型",
      eraPeriod: "时代背景",
      camera: "摄影机",
      shotType: "景别",
      cameraAngle: "拍摄角度",
      cameraMovement: "运镜方式",
      focalLength: "焦距",
      depthOfField: "景深",
      lighting: "灯光",
      lightingStyle: "灯光风格",
      colorTemperature: "色温",
      colorGrading: "调色",
      colorGrade: "色彩风格",
      scene: "场景",
      sceneType: "场景类型",
      weather: "天气",
      timeOfDay: "时间",
      subject: "主体",
      subjectType: "主体类型",
      subjectDescription: "主体描述",
      describeSubject: "描述主体细节...",
      additionalObjects: "其他对象",
      addObject: "添加对象",
      objectType: "对象类型",
      objectDescription: "描述",
      technical: "技术参数",
      aspectRatio: "画面比例",
      resolution: "分辨率",
      frameRate: "帧率",
      filmGrain: "胶片颗粒",
      promptPreview: "提示词预览",
      copy: "复制",
      copied: "已复制",
      generate: "生成",
      selectPlaceholder: "选择...",
      backToDashboard: "返回",
    },
  }

  const l = labels[locale]

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-sidebar px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">{l.backToDashboard}</span>
          </Link>
          <div className="h-4 w-px bg-border" />
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Film className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">ScenePilotix</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/generate">
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {l.generate}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Settings */}
        <ScrollArea className="w-80 shrink-0 border-r border-border/50 bg-sidebar">
          <div className="p-4 space-y-6">
            {/* Direction Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Clapperboard className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.direction}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.directorStyle}</Label>
                  <Select value={directorStyle} onValueChange={setDirectorStyle}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTOR_STYLES[locale].map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex flex-col">
                            <span>{style.label}</span>
                            <span className="text-xs text-muted-foreground">{style.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.filmGenre}</Label>
                  <Select value={filmGenre} onValueChange={setFilmGenre}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {FILM_GENRES[locale].map((genre) => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.eraPeriod}</Label>
                  <Select value={eraPeriod} onValueChange={setEraPeriod}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {ERA_PERIODS[locale].map((era) => (
                        <SelectItem key={era} value={era}>{era}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Camera Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Camera className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.camera}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.shotType}</Label>
                  <Select value={shotType} onValueChange={setShotType}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {SHOT_TYPES[locale].map((shot) => (
                        <SelectItem key={shot.value} value={shot.value}>
                          <div className="flex flex-col">
                            <span>{shot.label}</span>
                            <span className="text-xs text-muted-foreground">{shot.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.cameraAngle}</Label>
                  <Select value={cameraAngle} onValueChange={setCameraAngle}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_ANGLES[locale].map((angle) => (
                        <SelectItem key={angle.value} value={angle.value}>
                          <div className="flex flex-col">
                            <span>{angle.label}</span>
                            <span className="text-xs text-muted-foreground">{angle.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.cameraMovement}</Label>
                  <Select value={cameraMovement} onValueChange={setCameraMovement}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMERA_MOVEMENTS[locale].map((movement) => (
                        <SelectItem key={movement.value} value={movement.value}>
                          <div className="flex flex-col">
                            <span>{movement.label}</span>
                            <span className="text-xs text-muted-foreground">{movement.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.focalLength}</Label>
                  <Select value={focalLength} onValueChange={setFocalLength}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {FOCAL_LENGTHS[locale].map((lens) => (
                        <SelectItem key={lens.value} value={lens.value}>
                          <div className="flex flex-col">
                            <span>{lens.label}</span>
                            <span className="text-xs text-muted-foreground">{lens.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.depthOfField}</Label>
                  <Select value={depthOfField} onValueChange={setDepthOfField}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPTH_OF_FIELD[locale].map((dof) => (
                        <SelectItem key={dof.value} value={dof.value}>
                          <div className="flex flex-col">
                            <span>{dof.label}</span>
                            <span className="text-xs text-muted-foreground">{dof.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Lighting Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Sun className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.lighting}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.lightingStyle}</Label>
                  <Select value={lightingStyle} onValueChange={setLightingStyle}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {LIGHTING_STYLES[locale].map((light) => (
                        <SelectItem key={light.value} value={light.value}>
                          <div className="flex flex-col">
                            <span>{light.label}</span>
                            <span className="text-xs text-muted-foreground">{light.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.colorTemperature}</Label>
                  <Select value={colorTemperature} onValueChange={setColorTemperature}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_TEMPERATURES[locale].map((temp) => (
                        <SelectItem key={temp.value} value={temp.value}>
                          <div className="flex flex-col">
                            <span>{temp.label}</span>
                            <span className="text-xs text-muted-foreground">{temp.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Color Grading Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Palette className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.colorGrading}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.colorGrade}</Label>
                  <Select value={colorGrade} onValueChange={setColorGrade}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_GRADES[locale].map((grade) => (
                        <SelectItem key={grade.value} value={grade.value}>
                          <div className="flex flex-col">
                            <span>{grade.label}</span>
                            <span className="text-xs text-muted-foreground">{grade.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Scene Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Box className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.scene}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.sceneType}</Label>
                  <Select value={sceneType} onValueChange={setSceneType}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {SCENE_TYPES[locale].map((scene) => (
                        <SelectItem key={scene} value={scene}>{scene}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.weather}</Label>
                  <Select value={weather} onValueChange={setWeather}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_CONDITIONS[locale].map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.timeOfDay}</Label>
                  <Select value={timeOfDay} onValueChange={setTimeOfDay}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OF_DAY[locale].map((time) => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Subject Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.subject}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.subjectType}</Label>
                  <Select value={subjectType} onValueChange={setSubjectType}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_TYPES[locale].map((subject) => (
                        <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.subjectDescription}</Label>
                  <Textarea
                    className="bg-input border-border resize-none h-20"
                    placeholder={l.describeSubject}
                    value={subjectDescription}
                    onChange={(e) => setSubjectDescription(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Additional Objects Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{l.additionalObjects}</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addObject}
                  className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {l.addObject}
                </Button>
              </div>
              <div className="space-y-3">
                {additionalObjects.map((obj, index) => (
                  <div key={obj.id} className="rounded-lg border border-border/50 bg-input/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {locale === "zh" ? `对象 ${index + 2}` : `Object ${index + 2}`}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeObject(obj.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Select value={obj.type} onValueChange={(v) => updateObject(obj.id, "type", v)}>
                      <SelectTrigger className="bg-input border-border h-8 text-xs">
                        <SelectValue placeholder={l.objectType} />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_TYPES[locale].map((subject) => (
                          <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="bg-input border-border h-8 text-xs"
                      placeholder={l.objectDescription}
                      value={obj.description}
                      onChange={(e) => updateObject(obj.id, "description", e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <Separator className="bg-border/50" />

            {/* Technical Section */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold text-sm">{l.technical}</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.aspectRatio}</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS[locale].map((ratio) => (
                        <SelectItem key={ratio.value} value={ratio.value}>
                          <div className="flex flex-col">
                            <span>{ratio.label}</span>
                            <span className="text-xs text-muted-foreground">{ratio.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.resolution}</Label>
                  <Select value={resolution} onValueChange={setResolution}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS[locale].map((res) => (
                        <SelectItem key={res.value} value={res.value}>
                          <div className="flex flex-col">
                            <span>{res.label}</span>
                            <span className="text-xs text-muted-foreground">{res.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.frameRate}</Label>
                  <Select value={frameRate} onValueChange={setFrameRate}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {FRAME_RATES[locale].map((fps) => (
                        <SelectItem key={fps.value} value={fps.value}>
                          <div className="flex flex-col">
                            <span>{fps.label}</span>
                            <span className="text-xs text-muted-foreground">{fps.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{l.filmGrain}</Label>
                  <Select value={filmGrain} onValueChange={setFilmGrain}>
                    <SelectTrigger className="bg-input border-border">
                      <SelectValue placeholder={l.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {FILM_GRAIN[locale].map((grain) => (
                        <SelectItem key={grain.value} value={grain.value}>
                          <div className="flex flex-col">
                            <span>{grain.label}</span>
                            <span className="text-xs text-muted-foreground">{grain.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        {/* Center Panel - Canvas Preview */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 p-6">
            <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/30">
              {/* Shot Overview */}
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Film className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{locale === "zh" ? "镜头 1" : "Shot 1"}</div>
                    <div className="text-xs text-muted-foreground">
                      {shotType && SHOT_TYPES[locale].find(s => s.value === shotType)?.label}
                      {lightingStyle && ` · ${LIGHTING_STYLES[locale].find(l => l.value === lightingStyle)?.label}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Canvas Preview */}
              <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-secondary/20 via-card to-secondary/10">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Image className="h-12 w-12 text-primary/50" />
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {locale === "zh" ? "画布预览" : "Canvas Preview"}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {locale === "zh" ? "选择参数后点击生成" : "Configure settings and click Generate"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Prompt Preview */}
        <aside className="w-80 shrink-0 flex flex-col border-l border-border/50 bg-sidebar">
          {/* Prompt Preview - Fixed at Top */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-primary">{l.promptPreview}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyPrompt}
                className="h-7 text-xs"
                disabled={!generatedPrompt}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                    {l.copied}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    {l.copy}
                  </>
                )}
              </Button>
            </div>
            <div className="rounded-lg border border-border/50 bg-input/50 p-3 min-h-[120px] max-h-[200px] overflow-auto">
              {generatedPrompt ? (
                <p className="text-sm text-foreground leading-relaxed">{generatedPrompt}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {locale === "zh" ? "选择参数后，提示词将自动生成..." : "Select options to generate prompt..."}
                </p>
              )}
            </div>
          </div>

          {/* Reference Section */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              <div className="rounded-xl border border-border/50 bg-input/30 p-3">
                <h3 className="mb-3 text-xs font-medium text-primary uppercase tracking-wider">
                  {locale === "zh" ? "参考图/视频" : "Reference"}
                </h3>
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
                  <div className="text-center">
                    <Plus className="mx-auto mb-1 h-5 w-5 text-primary/50" />
                    <p className="text-xs text-muted-foreground">
                      {locale === "zh" ? "添加参考" : "Add reference"}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/60">
                  {locale === "zh" ? "仅支持一张参考图片或视频" : "Only one reference image or video allowed"}
                </p>
              </div>

              {/* Quick Tips */}
              <div className="rounded-xl border border-border/50 bg-input/30 p-3">
                <h3 className="mb-3 text-xs font-medium text-primary uppercase tracking-wider">
                  {locale === "zh" ? "快捷提示" : "Quick Tips"}
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {locale === "zh" ? "选择导演风格会自动影响整体美学" : "Director style influences overall aesthetic"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {locale === "zh" ? "景深与焦距配合使用效果更佳" : "Combine DOF with focal length for best results"}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {locale === "zh" ? "主体描述越详细，生成效果越准确" : "More detailed subject description = better results"}
                  </li>
                </ul>
              </div>
            </div>
          </ScrollArea>

          {/* Generate Button - Fixed at Bottom */}
          <div className="p-4 border-t border-border/50">
            <Link href="/generate" className="block">
              <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90">
                <Sparkles className="mr-2 h-4 w-4" />
                {l.generate}
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
