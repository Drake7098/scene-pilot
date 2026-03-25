"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Film,
  Camera,
  Sun,
  Palette,
  User,
  Move,
  Box,
  Wand2,
  Settings,
  Play,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Image,
  Video,
  Sparkles,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useI18n } from "@/lib/i18n"

export default function WorkspacePage() {
  const { t } = useI18n()
  const [expandedSections, setExpandedSections] = useState<string[]>(["shot", "camera", "lighting"])
  const [activeTab, setActiveTab] = useState("prompt")

  const flowControlSections = [
    { id: "shot", name: t("workspace.shot"), icon: Film, items: ["Shot 1 - Hero", "Shot 2 - Detail", "Shot 3 - Wide"] },
    { id: "director", name: t("workspace.director"), icon: Wand2, items: ["Epic", "Dramatic", "Subtle"] },
    { id: "camera", name: t("workspace.camera"), icon: Camera, items: ["Close-up", "Medium", "Wide Angle"] },
    { id: "scene", name: t("workspace.scene"), icon: Box, items: ["Interior", "Exterior", "Studio"] },
    { id: "subject", name: t("workspace.subject"), icon: User, items: ["Product", "Person", "Object"] },
    { id: "action", name: "Action", icon: Move, items: ["Static", "Pan", "Orbit"] },
    { id: "lighting", name: t("workspace.lighting"), icon: Sun, items: ["Natural", "Studio", "Dramatic"] },
    { id: "style", name: t("workspace.style"), icon: Palette, items: ["Cinematic", "Documentary", "Commercial"] },
  ]

  const entityPanelSections = [
    { id: "background", name: t("workspace.background"), fields: ["Color", "Environment", "Depth"] },
    { id: "subject", name: t("workspace.subject"), fields: ["Position", "Scale", "Rotation"] },
    { id: "attributes", name: "Attributes", fields: ["Material", "Texture", "Color"] },
    { id: "state", name: "State", fields: ["Pose", "Expression", "Motion"] },
    { id: "lighting", name: t("workspace.lighting"), fields: ["Intensity", "Temperature", "Direction"] },
    { id: "style", name: t("workspace.style"), fields: ["Film Grain", "Color Grade", "Contrast"] },
  ]

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-sidebar px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Film className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">ScenePilotix</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm text-muted-foreground">Product Launch Teaser</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-8">
          <div className="max-w-2xl flex-1 rounded-lg border border-border/60 bg-input px-4 py-2 text-sm text-muted-foreground">
            <span className="line-clamp-1">
              A cinematic close-up shot of a premium product, dramatic lighting, shallow depth of field...
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-border hover:bg-secondary">
            <RefreshCw className="mr-2 h-3 w-3" />
            Refine
          </Button>
          <Link href="/generate">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="mr-2 h-3 w-3" />
              {t("workspace.generate")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Flow Control */}
        <aside className="w-64 shrink-0 overflow-auto border-r border-border/50 bg-sidebar">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary">{t("hero.flowControl")}</h2>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1">
              {flowControlSections.map((section) => (
                <div key={section.id}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
                  >
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <section.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{section.name}</span>
                  </button>
                  {expandedSections.includes(section.id) && (
                    <div className="ml-6 space-y-0.5 py-1">
                      {section.items.map((item) => (
                        <button
                          key={item}
                          className="flex w-full items-center rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
                        >
                          {item}
                        </button>
                      ))}
                      <button className="flex w-full items-center gap-1 rounded-lg px-2 py-1 text-xs text-primary transition-colors hover:bg-sidebar-accent">
                        <Plus className="h-3 w-3" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Panel - Canvas */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 p-6">
            <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/30">
              {/* Shot Overview */}
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Film className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{t("workspace.shot")} 1 - Hero</div>
                    <div className="text-xs text-muted-foreground">Close-up · Dramatic · Studio</div>
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
                  <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                    <Image className="h-10 w-10 text-primary/50" />
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{t("hero.canvasPreview")}</p>
                  <p className="text-xs text-muted-foreground/60">{t("workspace.generate")} to see result</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Panel - Output */}
          <div className="h-64 shrink-0 border-t border-border/50 bg-sidebar">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <div className="flex h-10 items-center border-b border-border/50 px-4">
                <TabsList className="h-8 bg-transparent p-0">
                  <TabsTrigger
                    value="prompt"
                    className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Prompt
                  </TabsTrigger>
                  <TabsTrigger
                    value="payload"
                    className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Payload
                  </TabsTrigger>
                  <TabsTrigger
                    value="result"
                    className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  >
                    Result
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="prompt" className="h-[calc(100%-40px)] p-4">
                <Textarea
                  placeholder={t("generate.prompt")}
                  className="h-full resize-none bg-input border-border font-mono text-sm"
                  defaultValue="A cinematic close-up shot of a premium product placed on a reflective surface. Dramatic studio lighting with soft shadows. Shallow depth of field creating a luxurious, high-end aesthetic. Film grain texture, professional color grading with warm highlights and cool shadows."
                />
              </TabsContent>

              <TabsContent value="payload" className="h-[calc(100%-40px)] overflow-auto p-4">
                <pre className="font-mono text-xs text-muted-foreground">
{`{
  "shot": {
    "type": "close-up",
    "subject": "product",
    "camera": "50mm",
    "dof": "shallow"
  },
  "lighting": {
    "type": "studio",
    "intensity": 0.8,
    "temperature": 5600
  },
  "style": {
    "grade": "cinematic",
    "grain": 0.15,
    "contrast": 1.2
  }
}`}
                </pre>
              </TabsContent>

              <TabsContent value="result" className="h-[calc(100%-40px)] p-4">
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/60 bg-input/50">
                  <div className="text-center">
                    <Video className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No result yet</p>
                    <p className="text-xs text-muted-foreground/60">{t("workspace.generate")} to see {t("workspace.preview").toLowerCase()}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Right Panel - Entity Edit */}
        <aside className="w-72 shrink-0 overflow-auto border-l border-border/50 bg-sidebar">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary">{t("hero.entityEdit")}</h2>
            </div>

            <div className="space-y-4">
              {entityPanelSections.map((section) => (
                <div key={section.id} className="rounded-xl border border-border/50 bg-input/30 p-3">
                  <h3 className="mb-3 text-xs font-medium text-primary uppercase tracking-wider">
                    {section.name}
                  </h3>
                  <div className="space-y-3">
                    {section.fields.map((field) => (
                      <div key={field}>
                        <label className="mb-1.5 block text-xs text-muted-foreground">{field}</label>
                        {field === "Intensity" || field === "Temperature" || field === "Contrast" || field === "Film Grain" ? (
                          <Slider defaultValue={[50]} max={100} step={1} className="py-1" />
                        ) : (
                          <Input className="h-8 bg-input border-border text-xs" placeholder={`Enter ${field.toLowerCase()}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Reference */}
              <div className="rounded-xl border border-border/50 bg-input/30 p-3">
                <h3 className="mb-3 text-xs font-medium text-primary uppercase tracking-wider">
                  Reference
                </h3>
                <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5">
                  <div className="text-center">
                    <Plus className="mx-auto mb-1 h-5 w-5 text-primary/50" />
                    <p className="text-xs text-muted-foreground">Add reference</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground/60">
                  Only one reference image or video allowed
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
