"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Film,
  Sparkles,
  Settings,
  ChevronDown,
  ArrowLeft,
  Image,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"

export default function GeneratePage() {
  const { t } = useI18n()
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      window.location.href = "/result"
    }, 3000)
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/50 bg-sidebar px-6">
        <div className="flex items-center gap-4">
          <Link href="/workspace" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Film className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold">{t("generate.title")}</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left - Settings */}
        <div className="w-96 shrink-0 overflow-auto border-r border-border/50 bg-sidebar p-6">
          <div className="space-y-6">
            {/* Prompt */}
            <div>
              <Label className="mb-2 block text-sm font-medium">Prompt</Label>
              <Textarea
                placeholder={t("generate.prompt")}
                className="min-h-32 resize-none bg-input border-border"
                defaultValue="A cinematic close-up shot of a premium product placed on a reflective surface. Dramatic studio lighting with soft shadows. Shallow depth of field creating a luxurious, high-end aesthetic."
              />
            </div>

            {/* Negative Prompt */}
            <div>
              <Label className="mb-2 block text-sm font-medium">{t("generate.negativePrompt")}</Label>
              <Textarea
                placeholder="What to avoid..."
                className="min-h-20 resize-none bg-input border-border text-sm"
                defaultValue="blurry, low quality, distorted, amateur, oversaturated"
              />
            </div>

            {/* Basic Settings */}
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Output Format</Label>
                <Select defaultValue="video">
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video (4 seconds)</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video-8s">Video (8 seconds)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">{t("generate.aspectRatio")}</Label>
                <Select defaultValue="16:9">
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 Landscape</SelectItem>
                    <SelectItem value="9:16">9:16 Portrait</SelectItem>
                    <SelectItem value="1:1">1:1 Square</SelectItem>
                    <SelectItem value="21:9">21:9 Cinematic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">{t("generate.quality")}</Label>
                <Select defaultValue="4k">
                  <SelectTrigger className="bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Settings */}
            <div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between py-2 text-sm font-medium"
              >
                <span className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  {t("workspace.settings")}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 rounded-xl border border-border/50 bg-input/30 p-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm">Creativity</Label>
                      <span className="text-xs text-primary">0.7</span>
                    </div>
                    <Slider defaultValue={[70]} max={100} step={1} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm">Motion Intensity</Label>
                      <span className="text-xs text-primary">0.5</span>
                    </div>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-sm">Film Grain</Label>
                      <span className="text-xs text-primary">0.15</span>
                    </div>
                    <Slider defaultValue={[15]} max={100} step={1} />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm">Seed</Label>
                    <input
                      type="number"
                      placeholder="Random"
                      className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("generate.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {t("generate.generateBtn")}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Estimated time: ~30 seconds
            </p>
          </div>
        </div>

        {/* Right - Preview */}
        <div className="flex-1 bg-background p-8">
          <div className="mx-auto h-full max-w-4xl">
            <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/30">
              <div className="border-b border-border/50 px-4 py-3">
                <h2 className="text-sm font-semibold text-primary">{t("workspace.preview")}</h2>
              </div>

              <div className="flex flex-1 items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                    <p className="mb-1 text-sm font-medium">{t("generate.generating")}</p>
                    <p className="text-xs text-muted-foreground">This may take up to 30 seconds</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                      <Image className="h-12 w-12 text-primary/50" />
                    </div>
                    <p className="mb-1 text-sm text-muted-foreground">{t("workspace.preview")}</p>
                    <p className="text-xs text-muted-foreground/60">Click {t("generate.generateBtn")} to create</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
