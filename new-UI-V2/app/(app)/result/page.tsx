"use client"

import Link from "next/link"
import {
  Film,
  Download,
  Share2,
  Copy,
  RefreshCw,
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Maximize,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const historyItems = [
  { id: "1", time: "Just now", prompt: "A cinematic close-up shot of a premium product..." },
  { id: "2", time: "5 min ago", prompt: "Wide angle establishing shot of a modern office..." },
  { id: "3", time: "15 min ago", prompt: "Dramatic lighting on a character's face..." },
  { id: "4", time: "1 hour ago", prompt: "Aerial view of a cityscape at sunset..." },
]

export default function ResultPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/40 bg-sidebar px-6">
        <div className="flex items-center gap-4">
          <Link href="/generate" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Film className="h-3.5 w-3.5 text-background" />
            </div>
            <span className="font-semibold">Result</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-3 w-3" />
            Share
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-3 w-3" />
            Download
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview */}
        <div className="flex-1 p-8">
          <div className="mx-auto h-full max-w-5xl">
            {/* Video Preview */}
            <div className="relative mb-6 overflow-hidden rounded-lg border border-border/60 bg-card/30">
              <div className="aspect-video bg-gradient-to-br from-secondary via-card to-secondary">
                <div className="flex h-full items-center justify-center">
                  <button className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground/90 text-background transition-transform hover:scale-105">
                    <Play className="h-8 w-8 pl-1" />
                  </button>
                </div>
              </div>

              {/* Video Controls */}
              <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-background/80 to-transparent px-4 py-3">
                <div className="mb-2 h-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full w-1/3 rounded-full bg-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button className="text-foreground/80 hover:text-foreground">
                      <Pause className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">0:01 / 0:04</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-foreground/80 hover:text-foreground">
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button className="text-foreground/80 hover:text-foreground">
                      <Maximize className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info & Actions */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Prompt */}
              <div className="rounded-lg border border-border/60 bg-card/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Prompt</h3>
                  <Button variant="ghost" size="sm" className="h-7">
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  A cinematic close-up shot of a premium product placed on a reflective surface.
                  Dramatic studio lighting with soft shadows. Shallow depth of field creating a
                  luxurious, high-end aesthetic. Film grain texture, professional color grading
                  with warm highlights and cool shadows.
                </p>
              </div>

              {/* Details */}
              <div className="rounded-lg border border-border/60 bg-card/50 p-4">
                <h3 className="mb-3 text-sm font-medium">Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Format</span>
                    <p className="font-medium">Video (4s)</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Resolution</span>
                    <p className="font-medium">3840 x 2160</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Aspect Ratio</span>
                    <p className="font-medium">16:9</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Generated</span>
                    <p className="font-medium">Just now</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <Link href="/generate">
                <Button variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              </Link>
              <Link href="/workspace">
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Refine in Workspace
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* History Sidebar */}
        <aside className="w-80 shrink-0 overflow-auto border-l border-border/40 bg-sidebar">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium">Generation History</h2>
              <Link href="/history" className="text-xs text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>

            <div className="space-y-2">
              {historyItems.map((item, index) => (
                <button
                  key={item.id}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    index === 0
                      ? "border-foreground/20 bg-card"
                      : "border-border/40 bg-card/30 hover:border-border hover:bg-card/50"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-secondary">
                      <Film className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{item.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
